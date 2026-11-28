ALTER TABLE public.care_circles ADD COLUMN deletion_pending boolean NOT NULL DEFAULT false;
CREATE FUNCTION public.care_clear_revoked_credentials() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF NEW.revoked_at IS NOT NULL THEN DELETE FROM public.care_sessions WHERE member_id=NEW.id; DELETE FROM public.care_access_codes WHERE member_id=NEW.id; END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.care_clear_revoked_credentials() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER care_revoke_credentials AFTER UPDATE OF revoked_at ON public.care_members FOR EACH ROW EXECUTE FUNCTION public.care_clear_revoked_credentials();
CREATE FUNCTION public.care_edit_entity(p_circle uuid,p_entity text,p_id uuid,p_values jsonb,p_label text,p_delete boolean DEFAULT false) RETURNS uuid LANGUAGE plpgsql SET search_path=public AS $$
DECLARE t text; allowed text[]; before_row jsonb; at_time timestamptz:=clock_timestamp(); cols text; vals text; updates text; affected integer;
BEGIN
SELECT CASE p_entity WHEN 'reminder' THEN 'reminders' WHEN 'routine' THEN 'care_routines' WHEN 'note' THEN 'care_notes' END INTO t;
IF t IS NULL THEN RAISE EXCEPTION 'Invalid entity'; END IF;
PERFORM 1 FROM public.care_circles WHERE id=p_circle AND NOT deletion_pending FOR SHARE; IF NOT FOUND THEN RAISE EXCEPTION 'Family unavailable'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(p_circle::text||':'||t||':'||p_id::text,0));
EXECUTE format('SELECT to_jsonb(r) FROM public.%I r WHERE id=$1 AND circle_id=$2 FOR UPDATE',t) INTO before_row USING p_id,p_circle;
IF p_delete THEN
 IF before_row IS NULL THEN RAISE EXCEPTION 'Item unavailable'; END IF;
 IF p_entity='reminder' THEN UPDATE public.reminders SET deleted_at=at_time,updated_at=at_time WHERE id=p_id AND circle_id=p_circle;
 ELSE EXECUTE format('DELETE FROM public.%I WHERE id=$1 AND circle_id=$2',t) USING p_id,p_circle; END IF;
ELSE
 allowed:=CASE p_entity WHEN 'reminder' THEN ARRAY['id','circle_id','title','detail','local_time','critical','snooze_minutes','date_override','lead_minutes','updated_at'] WHEN 'routine' THEN ARRAY['id','circle_id','title','local_time','steps','enabled','date_override','updated_at'] ELSE ARRAY['id','circle_id','label','answer','category','phone','recap_date','updated_at'] END;
 p_values:=p_values||jsonb_build_object('id',p_id,'circle_id',p_circle,'updated_at',at_time);
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_values) k WHERE NOT k=ANY(allowed)) THEN RAISE EXCEPTION 'Invalid fields'; END IF;
 SELECT string_agg(format('%I',k),',' ORDER BY k),string_agg(format('v.%I',k),',' ORDER BY k),string_agg(format('%I=EXCLUDED.%I',k,k),',' ORDER BY k) FILTER(WHERE k NOT IN ('id','circle_id')) INTO cols,vals,updates FROM jsonb_object_keys(p_values) k;
 EXECUTE format('INSERT INTO public.%I AS target (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I,$1) v ON CONFLICT(id) DO UPDATE SET %s WHERE target.circle_id=$2',t,cols,vals,t,updates) USING p_values,p_circle;
 GET DIAGNOSTICS affected=ROW_COUNT; IF affected=0 THEN RAISE EXCEPTION 'Item unavailable'; END IF;
END IF;
INSERT INTO public.care_history(circle_id,entity,entity_id,label,before_value,after_version) VALUES(p_circle,p_entity,p_id,left(p_label,240),before_row,at_time);
RETURN p_id;
END $$;
REVOKE ALL ON FUNCTION public.care_edit_entity(uuid,text,uuid,jsonb,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.care_edit_entity(uuid,text,uuid,jsonb,text,boolean) TO service_role;
CREATE FUNCTION public.care_undo_entity(p_circle uuid,p_history uuid) RETURNS boolean LANGUAGE plpgsql SET search_path=public AS $$
DECLARE h public.care_history;t text;current_row jsonb;value jsonb;cols text;vals text;updates text;at_time timestamptz:=clock_timestamp();
BEGIN
PERFORM 1 FROM public.care_circles WHERE id=p_circle AND NOT deletion_pending FOR SHARE;IF NOT FOUND THEN RAISE EXCEPTION 'Family unavailable'; END IF;
SELECT * INTO h FROM public.care_history WHERE id=p_history AND circle_id=p_circle AND undone_at IS NULL FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Change unavailable'; END IF;
t:=CASE h.entity WHEN 'reminder' THEN 'reminders' WHEN 'routine' THEN 'care_routines' WHEN 'note' THEN 'care_notes' END;IF t IS NULL THEN RAISE EXCEPTION 'Invalid entity'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(p_circle::text||':'||t||':'||h.entity_id::text,0));
EXECUTE format('SELECT to_jsonb(r) FROM public.%I r WHERE id=$1 AND circle_id=$2 FOR UPDATE',t) INTO current_row USING h.entity_id,p_circle;
IF current_row IS NOT NULL AND (current_row->>'updated_at')::timestamptz<>h.after_version THEN RAISE EXCEPTION 'A newer change exists. Undo would overwrite it.'; END IF;
IF h.before_value IS NOT NULL THEN
 value:=h.before_value||jsonb_build_object('id',h.entity_id,'circle_id',p_circle,'updated_at',at_time);
 SELECT string_agg(format('%I',k),',' ORDER BY k),string_agg(format('v.%I',k),',' ORDER BY k),string_agg(format('%I=EXCLUDED.%I',k,k),',' ORDER BY k) FILTER(WHERE k NOT IN ('id','circle_id')) INTO cols,vals,updates FROM jsonb_object_keys(value) k;
 EXECUTE format('INSERT INTO public.%I AS target (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I,$1) v ON CONFLICT(id) DO UPDATE SET %s WHERE target.circle_id=$2',t,cols,vals,t,updates) USING value,p_circle;
ELSE EXECUTE format('DELETE FROM public.%I WHERE id=$1 AND circle_id=$2',t) USING h.entity_id,p_circle;
END IF;
UPDATE public.care_history SET undone_at=at_time WHERE id=h.id AND circle_id=p_circle;
RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.care_undo_entity(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.care_undo_entity(uuid,uuid) TO service_role;
CREATE FUNCTION public.care_begin_erase(p_circle uuid) RETURNS boolean LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
UPDATE public.care_circles SET deletion_pending=true WHERE id=p_circle;IF NOT FOUND THEN RAISE EXCEPTION 'Family unavailable'; END IF;
UPDATE public.care_members SET revoked_at=now(),notify_order=0 WHERE circle_id=p_circle;
DELETE FROM public.care_invitations WHERE circle_id=p_circle;
DELETE FROM public.pairing_codes WHERE circle_id=p_circle;
DELETE FROM public.g2_devices WHERE circle_id=p_circle;
RETURN true;END $$;
REVOKE ALL ON FUNCTION public.care_begin_erase(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.care_begin_erase(uuid) TO service_role;
CREATE POLICY care_media_service_read ON storage.objects FOR SELECT TO service_role USING (bucket_id='care-family-media');
CREATE POLICY care_media_service_insert ON storage.objects FOR INSERT TO service_role WITH CHECK (bucket_id='care-family-media');
CREATE POLICY care_media_service_update ON storage.objects FOR UPDATE TO service_role USING (bucket_id='care-family-media') WITH CHECK (bucket_id='care-family-media');
CREATE POLICY care_media_service_delete ON storage.objects FOR DELETE TO service_role USING (bucket_id='care-family-media');
CREATE OR REPLACE FUNCTION public.care_claim_invitation(p_hash text,p_user bigint,p_name text,p_chat bigint) RETURNS uuid LANGUAGE plpgsql SET search_path=public AS $$ DECLARE i public.care_invitations;m uuid;BEGIN
UPDATE public.care_invitations SET used_at=now() WHERE code_hash=p_hash AND used_at IS NULL AND expires_at>now() AND EXISTS(SELECT 1 FROM public.care_members WHERE id=created_by AND role='owner' AND revoked_at IS NULL) RETURNING * INTO i;
IF i.code_hash IS NULL THEN RETURN NULL;END IF;
INSERT INTO public.care_members(circle_id,telegram_user_id,member_name,role,direct_chat_id) VALUES(i.circle_id,p_user,left(p_name,80),i.role,p_chat) ON CONFLICT(circle_id,telegram_user_id) DO UPDATE SET revoked_at=NULL,direct_chat_id=p_chat,role=CASE WHEN care_members.role='owner' THEN 'owner' ELSE i.role END RETURNING id INTO m;
RETURN m;END $$;
REVOKE ALL ON FUNCTION public.care_claim_invitation(text,bigint,text,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.care_claim_invitation(text,bigint,text,bigint) TO service_role;
CREATE OR REPLACE FUNCTION public.care_routine_step(p_circle uuid,p_routine uuid,p_date date,p_step integer,p_key text) RETURNS integer LANGUAGE plpgsql SET search_path=public AS $$ DECLARE r public.care_routines; n integer;BEGIN
SELECT * INTO r FROM public.care_routines WHERE circle_id=p_circle AND id=p_routine AND enabled=true FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Routine unavailable'; END IF;
IF r.date_override IS NOT NULL AND r.date_override<>p_date THEN RAISE EXCEPTION 'Wrong date'; END IF;
n:=coalesce((r.progress->>p_date::text)::integer,0);IF p_step<>n+1 OR p_step>jsonb_array_length(r.steps) THEN RETURN n;END IF;
INSERT INTO public.care_events(circle_id,idempotency_key,kind,label) VALUES(p_circle,p_key,'routine-step',r.title) ON CONFLICT(idempotency_key) DO NOTHING;
IF NOT FOUND THEN RETURN n;END IF;
UPDATE public.care_routines SET progress=jsonb_build_object(p_date::text,p_step),updated_at=now() WHERE id=p_routine;RETURN p_step;END $$;
REVOKE ALL ON FUNCTION public.care_routine_step(uuid,uuid,date,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.care_routine_step(uuid,uuid,date,integer,text) TO service_role;
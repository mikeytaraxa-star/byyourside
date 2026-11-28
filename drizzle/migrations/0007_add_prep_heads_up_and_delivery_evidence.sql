ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS lead_minutes integer NOT NULL DEFAULT 0;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reminders_lead_minutes_range' AND connamespace = 'public'::regnamespace) THEN
    ALTER TABLE public.reminders ADD CONSTRAINT reminders_lead_minutes_range CHECK (lead_minutes >= 0 AND lead_minutes <= 180);
  END IF;
END $$;
ALTER TABLE public.care_events ADD COLUMN IF NOT EXISTS delivery_detail jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.care_events ADD COLUMN IF NOT EXISTS grouped_at timestamp with time zone;
COMMENT ON COLUMN public.reminders.lead_minutes IS 'Minutes before local_time to show a preparation heads-up; 0 disables it.';
COMMENT ON COLUMN public.care_events.delivery_detail IS 'Per-recipient delivery outcomes keyed by chat id, recorded by verified server handlers.';
COMMENT ON COLUMN public.care_events.grouped_at IS 'When this ordinary notice was folded into a bundled family update.';
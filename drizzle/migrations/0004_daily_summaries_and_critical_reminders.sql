ALTER TABLE public.care_circles
  ADD COLUMN summary_time text NOT NULL DEFAULT '21:00',
  ADD COLUMN summary_sent_on date;

ALTER TABLE public.reminders
  ADD COLUMN critical boolean NOT NULL DEFAULT false,
  ADD COLUMN missed_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN last_missed_on date;

COMMENT ON COLUMN public.care_circles.summary_time IS 'Local HH:MM for the daily family summary, or off.';
COMMENT ON COLUMN public.reminders.critical IS 'Family-designated important reminder; second consecutive unconfirmed day triggers a stronger alert.';
COMMENT ON COLUMN public.reminders.missed_streak IS 'Consecutive days with an unconfirmed important reminder at the family-alert check.';
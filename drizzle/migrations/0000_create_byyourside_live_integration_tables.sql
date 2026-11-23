CREATE TABLE public.care_circles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_chat_id bigint NOT NULL UNIQUE,
  display_name text NOT NULL DEFAULT 'Your Loved One',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.care_circles TO service_role;
ALTER TABLE public.care_circles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.telegram_updates (
  update_id bigint PRIMARY KEY,
  chat_id bigint NOT NULL,
  telegram_user_id bigint,
  text text,
  raw_update jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.telegram_updates TO service_role;
ALTER TABLE public.telegram_updates ENABLE ROW LEVEL SECURITY;
CREATE INDEX telegram_updates_chat_id_idx ON public.telegram_updates (chat_id, created_at DESC);

CREATE TABLE public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES public.care_circles(id) ON DELETE CASCADE,
  local_time text NOT NULL,
  title text NOT NULL,
  detail text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'missed')),
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.reminders TO service_role;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE INDEX reminders_circle_status_idx ON public.reminders (circle_id, status, local_time);

CREATE TABLE public.people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES public.care_circles(id) ON DELETE CASCADE,
  name text NOT NULL,
  relation text NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (circle_id, name)
);
GRANT ALL ON public.people TO service_role;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
CREATE INDEX people_circle_id_idx ON public.people (circle_id);

CREATE TABLE public.pairing_codes (
  code text PRIMARY KEY,
  circle_id uuid NOT NULL REFERENCES public.care_circles(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.pairing_codes TO service_role;
ALTER TABLE public.pairing_codes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.g2_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES public.care_circles(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.g2_devices TO service_role;
ALTER TABLE public.g2_devices ENABLE ROW LEVEL SECURITY;
CREATE INDEX g2_devices_circle_idx ON public.g2_devices (circle_id);
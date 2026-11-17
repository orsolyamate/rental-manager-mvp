CREATE TABLE public.rent_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES public.apartments(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  valid_from date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rent_history_apartment_valid_from_key UNIQUE (apartment_id, valid_from)
);

CREATE TABLE public.common_cost_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES public.apartments(id) ON DELETE RESTRICT,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  valid_from date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT common_cost_history_apartment_valid_from_key UNIQUE (apartment_id, valid_from)
);

-- Least privilege: drop platform defaults, then allow only read + insert for anon
REVOKE ALL ON public.rent_history FROM anon, authenticated;
REVOKE ALL ON public.common_cost_history FROM anon, authenticated;
GRANT SELECT, INSERT ON public.rent_history TO anon;
GRANT SELECT, INSERT ON public.common_cost_history TO anon;
GRANT ALL ON public.rent_history TO service_role;
GRANT ALL ON public.common_cost_history TO service_role;

ALTER TABLE public.rent_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.common_cost_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lakbér-előzmények olvashatók"
  ON public.rent_history FOR SELECT TO anon USING (true);
CREATE POLICY "Új lakbér rögzíthető pozitív összeggel"
  ON public.rent_history FOR INSERT TO anon WITH CHECK (amount > 0);

CREATE POLICY "Közös költség előzmények olvashatók"
  ON public.common_cost_history FOR SELECT TO anon USING (true);
CREATE POLICY "Új közös költség rögzíthető pozitív összeggel"
  ON public.common_cost_history FOR INSERT TO anon WITH CHECK (amount > 0);

INSERT INTO public.rent_history (apartment_id, amount, valid_from) VALUES
  ('6f1d2c3a-4b5e-4f60-8a71-92b3c4d5e6f7', 200000, '2026-01-01'),
  ('6f1d2c3a-4b5e-4f60-8a71-92b3c4d5e6f7', 220000, '2026-07-01');

INSERT INTO public.common_cost_history (apartment_id, amount, valid_from) VALUES
  ('6f1d2c3a-4b5e-4f60-8a71-92b3c4d5e6f7', 25000, '2026-01-01'),
  ('6f1d2c3a-4b5e-4f60-8a71-92b3c4d5e6f7', 27000, '2026-07-01');
-- Issue 1: fix, előre feltöltött lakás és bérlő adatok (read-only)

CREATE TABLE public.apartments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  address text NOT NULL CHECK (length(trim(address)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL UNIQUE REFERENCES public.apartments(id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Legkisebb jogosultság: az anon szerep csak olvashat
GRANT SELECT ON public.apartments TO anon;
GRANT SELECT ON public.tenants TO anon;
GRANT ALL ON public.apartments TO service_role;
GRANT ALL ON public.tenants TO service_role;

ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lakás adatai nyilvánosan olvashatók"
  ON public.apartments FOR SELECT TO anon USING (true);

CREATE POLICY "Bérlő adatai nyilvánosan olvashatók"
  ON public.tenants FOR SELECT TO anon USING (true);

-- Előre feltöltött tesztadatok
INSERT INTO public.apartments (id, name, address)
VALUES ('6f1d2c3a-4b5e-4f60-8a71-92b3c4d5e6f7', 'Erzsébetvárosi kétszobás lakás', '1074 Budapest, Dohány utca 28. 3. emelet 12.');

INSERT INTO public.tenants (id, apartment_id, name)
VALUES ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', '6f1d2c3a-4b5e-4f60-8a71-92b3c4d5e6f7', 'Kovács Eszter');
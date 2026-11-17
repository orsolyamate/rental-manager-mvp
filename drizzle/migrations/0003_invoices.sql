CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES public.apartments(id) ON DELETE RESTRICT,
  provider_name text NULL CHECK (provider_name IS NULL OR (length(trim(provider_name)) BETWEEN 1 AND 200)),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  invoice_date date NOT NULL,
  due_date date NULL,
  paid boolean NOT NULL DEFAULT false,
  paid_date date NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoices_paid_date_consistency CHECK (
    (paid = true AND paid_date IS NOT NULL) OR (paid = false AND paid_date IS NULL)
  )
);

CREATE INDEX invoices_apartment_invoice_date_idx ON public.invoices (apartment_id, invoice_date DESC);

REVOKE ALL ON public.invoices FROM anon, authenticated;
GRANT SELECT, INSERT ON public.invoices TO anon;
GRANT ALL ON public.invoices TO service_role;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Számlák olvashatók"
  ON public.invoices FOR SELECT TO anon USING (true);
CREATE POLICY "Új számla rögzíthető érvényes adatokkal"
  ON public.invoices FOR INSERT TO anon WITH CHECK (
    amount > 0 AND ((paid AND paid_date IS NOT NULL) OR (NOT paid AND paid_date IS NULL))
  );

INSERT INTO public.invoices (apartment_id, provider_name, amount, invoice_date, due_date, paid, paid_date) VALUES
  ('6f1d2c3a-4b5e-4f60-8a71-92b3c4d5e6f7', 'MVM Next – villany', 8540, '2026-10-05', '2026-10-20', true, '2026-10-14'),
  ('6f1d2c3a-4b5e-4f60-8a71-92b3c4d5e6f7', 'Fővárosi Vízművek', 5230, '2026-10-12', '2026-10-27', true, '2026-10-25'),
  ('6f1d2c3a-4b5e-4f60-8a71-92b3c4d5e6f7', 'FŐTÁV – távhő', 14860, '2026-11-03', '2026-11-18', true, '2026-11-10'),
  ('6f1d2c3a-4b5e-4f60-8a71-92b3c4d5e6f7', 'MVM Next – villany', 9120, '2026-11-05', '2026-11-20', false, NULL),
  ('6f1d2c3a-4b5e-4f60-8a71-92b3c4d5e6f7', NULL, 3000, '2026-11-09', NULL, false, NULL);
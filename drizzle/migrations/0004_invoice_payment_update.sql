-- Column-level privilege: anon may update ONLY paid and paid_date
GRANT UPDATE (paid, paid_date) ON public.invoices TO anon;

-- Row-level rule for updates: the resulting row must still be consistent
CREATE POLICY "Számla fizetési státusza módosítható"
  ON public.invoices FOR UPDATE TO anon
  USING (true)
  WITH CHECK (
    amount > 0 AND ((paid AND paid_date IS NOT NULL) OR (NOT paid AND paid_date IS NULL))
  );
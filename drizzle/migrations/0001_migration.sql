-- Legkisebb jogosultság: a lakás és bérlő tábla csak olvasható az alkalmazásból
REVOKE ALL ON public.apartments FROM anon, authenticated;
REVOKE ALL ON public.tenants FROM anon, authenticated;
GRANT SELECT ON public.apartments TO anon;
GRANT SELECT ON public.tenants TO anon;
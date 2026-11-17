import { createServerFn } from "@tanstack/react-start";
import { createPublicDbClient } from "./public-db";

export type FixedData = {
  apartment: { id: string; name: string; address: string };
  tenant: { id: string; name: string } | null;
};

// Read-only: the fixed apartment and its current tenant (RLS applies via the anon key).
export const getFixedData = createServerFn({ method: "GET" }).handler(
  async (): Promise<FixedData> => {
    const supabase = createPublicDbClient();

    const { data: apartment, error: apartmentError } = await supabase
      .from("apartments")
      .select("id, name, address")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (apartmentError) throw new Error("A lakás adatai nem tölthetők be.");
    if (!apartment) throw new Error("Nincs rögzített lakás az adatbázisban.");

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name")
      .eq("apartment_id", apartment.id)
      .maybeSingle();

    if (tenantError) throw new Error("A bérlő adatai nem tölthetők be.");

    return { apartment, tenant };
  },
);

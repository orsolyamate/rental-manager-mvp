import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type FixedData = {
  apartment: { id: string; name: string; address: string };
  tenant: { id: string; name: string } | null;
};

// Read-only: the fixed apartment and its current tenant, read with the publishable (anon) key so RLS applies.
export const getFixedData = createServerFn({ method: "GET" }).handler(
  async (): Promise<FixedData> => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const supabase = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

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

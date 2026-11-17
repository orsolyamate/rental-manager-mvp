import { createServerFn } from "@tanstack/react-start";
import { createPublicDbClient } from "./public-db";
import { newFeeSchema, type FeeEntry, type FeeKind } from "./fees";

export type FeesData = { rent: FeeEntry[]; common_cost: FeeEntry[] };

const TABLES = { rent: "rent_history", common_cost: "common_cost_history" } as const;

export const getFees = createServerFn({ method: "GET" }).handler(async (): Promise<FeesData> => {
  const supabase = createPublicDbClient();
  const [rent, common] = await Promise.all([
    supabase
      .from("rent_history")
      .select("id, amount, valid_from")
      .order("valid_from", { ascending: false }),
    supabase
      .from("common_cost_history")
      .select("id, amount, valid_from")
      .order("valid_from", { ascending: false }),
  ]);
  if (rent.error || common.error) throw new Error("A díjak nem tölthetők be.");
  const norm = (rows: { id: string; amount: number; valid_from: string }[]) =>
    rows.map((r) => ({ id: r.id, amount: Number(r.amount), valid_from: r.valid_from }));
  return { rent: norm(rent.data), common_cost: norm(common.data) };
});

export type AddFeeResult =
  { ok: true } | { ok: false; message: string; field?: "amount" | "validFrom" | undefined };

export const addFee = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input)
  .handler(async ({ data }): Promise<AddFeeResult> => {
    const parsed = newFeeSchema.safeParse(data);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path[0];
      return {
        ok: false,
        message: issue?.message ?? "Hibás adatok.",
        field: field === "amount" || field === "validFrom" ? field : undefined,
      };
    }
    const { kind, amount, validFrom } = parsed.data;
    const supabase = createPublicDbClient();

    const { data: apartment, error: aptError } = await supabase
      .from("apartments")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (aptError || !apartment) return { ok: false, message: "A lakás nem található." };

    const { error } = await supabase
      .from(TABLES[kind as FeeKind])
      .insert({ apartment_id: apartment.id, amount, valid_from: validFrom });

    if (error) {
      console.error("addFee failed", error.code, error.message);
      if (error.code === "23505") {
        return {
          ok: false,
          field: "validFrom",
          message: "Erre a dátumra már van rögzített érték.",
        };
      }
      if (error.code === "23514") {
        return {
          ok: false,
          field: "amount",
          message: "Az összegnek nullánál nagyobbnak kell lennie.",
        };
      }
      return { ok: false, message: "A mentés nem sikerült. Kérlek, próbáld újra." };
    }
    return { ok: true };
  });

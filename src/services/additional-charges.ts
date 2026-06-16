import { supabase } from "@/integrations/supabase/client";

export type ChargeKind = "transport" | "logistics";
export type ChargeSign = "debit" | "credit";

export interface AdditionalCharge {
  id: string;
  user_id: string;
  kind: ChargeKind;
  charge_date: string; // YYYY-MM-DD
  sign: ChargeSign;
  item: string;
  unit_price: number;
  quantity: number;
  total: number;
  istat: boolean;
  deposit_number: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type NewCharge = Omit<
  AdditionalCharge,
  "id" | "user_id" | "created_at" | "updated_at"
>;

/** Voci di addebito di default (usate per il seed; la lista live è in DB). */
export const CHARGE_ITEMS: string[] = [
  "Scansione",
  "Imballaggio",
  "Preventivo",
  "Riconsegna",
  "Ritiro",
  "Etichettatura",
  "Picking",
  "Stoccaggio",
  "Movimentazione",
  "Pallet",
  "Documentazione doganale",
  "Assicurazione merce",
  "Sosta",
  "Facchinaggio",
  "Sponda idraulica",
];

export async function listChargeItems(): Promise<string[]> {
  const { data, error } = await supabase
    .from("charge_items" as never)
    .select("name")
    .order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Array<{ name: string }>).map((r) => r.name);
}

export async function createChargeItem(name: string): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Nome vuoto");
  const { error } = await supabase
    .from("charge_items" as never)
    .insert({ name: trimmed } as never);
  if (error && !String(error.message).toLowerCase().includes("duplicate")) throw error;
  return trimmed;
}

export async function listAdditionalCharges(opts?: {
  from?: string;
  to?: string;
  depositNumber?: string;
}): Promise<AdditionalCharge[]> {
  let q = supabase
    .from("additional_charges")
    .select("*")
    .order("charge_date", { ascending: false });
  if (opts?.from) q = q.gte("charge_date", opts.from);
  if (opts?.to) q = q.lte("charge_date", opts.to);
  if (opts?.depositNumber) q = q.eq("deposit_number", opts.depositNumber);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as AdditionalCharge[];
}

export async function createAdditionalCharges(items: NewCharge[]): Promise<void> {
  if (items.length === 0) return;
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Non autenticato");
  const rows = items.map((it) => ({ ...it, user_id: userId }));
  const { error } = await supabase
    .from("additional_charges")
    .insert(rows as unknown as never);
  if (error) throw error;
}

export async function updateAdditionalCharge(
  id: string,
  patch: Partial<NewCharge>,
): Promise<void> {
  const { error } = await supabase
    .from("additional_charges")
    .update(patch as unknown as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteAdditionalCharge(id: string): Promise<void> {
  const { error } = await supabase.from("additional_charges").delete().eq("id", id);
  if (error) throw error;
}

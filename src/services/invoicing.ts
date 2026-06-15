import { supabase } from "@/integrations/supabase/client";

export type InvoicingChargeKind = "transport" | "logistics";

export interface InvoicingCharge {
  kind: InvoicingChargeKind;
  description: string;
  amount: number;
}

export interface InvoicingParams {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;
  depositNumber?: string;
  charges: InvoicingCharge[];
}

export type InvoicingStatus = "pending" | "running" | "completed" | "failed";

export interface InvoicingJob {
  id: string;
  user_id: string;
  date_from: string;
  date_to: string;
  deposit_number: string | null;
  extra_charges: InvoicingCharge[];
  status: InvoicingStatus;
  log: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface StartInvoicingResult {
  jobId: string;
  /** Risolve quando il processo simulato termina (log finale salvato). */
  done: Promise<void>;
}

/**
 * Avvia una fatturazione. Versione demo: processo simulato lato client.
 * `onLog` riceve ogni riga di log in tempo reale per mostrarla a schermo.
 *
 * 👉 Migrazione al backend reale: sostituire il corpo con una fetch SSE/WS
 *    che invoca `onLog` per ogni messaggio del server.
 */
export async function startInvoicing(
  params: InvoicingParams,
  onLog?: (line: string) => void,
): Promise<StartInvoicingResult> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Non autenticato");

  const { data: job, error } = await supabase
    .from("invoicing_jobs")
    .insert({
      user_id: userId,
      date_from: params.dateFrom,
      date_to: params.dateTo,
      deposit_number: params.depositNumber || null,
      extra_charges: params.charges as unknown as never,
      status: "running",
    })
    .select("id")
    .single();
  if (error) throw error;

  const done = simulateBackendProcess(job.id, params, onLog).catch((e) => {
    console.error(e);
  });
  return { jobId: job.id, done };
}

async function simulateBackendProcess(
  jobId: string,
  params: InvoicingParams,
  onLog?: (line: string) => void,
) {
  const lines: string[] = [];
  const push = (msg: string) => {
    const line = `[${new Date().toLocaleTimeString("it-IT")}] ${msg}`;
    lines.push(line);
    onLog?.(line);
  };

  push("Avvio processo di fatturazione...");
  push(`Periodo: ${params.dateFrom} → ${params.dateTo}`);
  push(`Deposito: ${params.depositNumber || "TUTTI"}`);
  push(`Addebiti aggiuntivi: ${params.charges.length}`);

  await wait(900);
  push("Connessione al gestionale...");
  await wait(700);
  push("Caricamento movimenti del periodo...");
  await wait(1000);
  push("Aggregazione per cliente e deposito...");
  await wait(800);
  push("Applicazione tariffe e addebiti aggiuntivi...");
  for (const c of params.charges) {
    push(`  + [${c.kind}] ${c.description}: € ${c.amount.toFixed(2)}`);
    await wait(150);
  }
  await wait(600);
  push("Generazione file Excel...");
  await wait(800);
  push("File salvato in: /server/fatturazione/export/YYYYMMDD-HHMM.xlsx");
  push("✅ Processo completato con successo.");

  await supabase
    .from("invoicing_jobs")
    .update({
      status: "completed",
      log: lines.join("\n"),
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getInvoicingJob(id: string): Promise<InvoicingJob | null> {
  const { data, error } = await supabase
    .from("invoicing_jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as InvoicingJob | null;
}

export async function listInvoicingJobs(limit = 20): Promise<InvoicingJob[]> {
  const { data, error } = await supabase
    .from("invoicing_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as InvoicingJob[];
}

export async function deleteInvoicingJob(id: string): Promise<void> {
  const { error } = await supabase.from("invoicing_jobs").delete().eq("id", id);
  if (error) throw error;
}

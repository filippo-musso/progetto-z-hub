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

/**
 * Avvia una fatturazione. Per la versione demo, il "processo" viene simulato
 * lato client: crea un job, lo marca come running, attende qualche secondo
 * e poi lo completa con un log finto.
 *
 * 👉 Per migrare al backend reale: sostituire il corpo di questa funzione con
 *    una `fetch(${VITE_API_BASE_URL}/invoicing/start, { ... })` mantenendo la
 *    stessa firma (parametri + ritorno = id del job).
 */
export async function startInvoicing(params: InvoicingParams): Promise<string> {
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

  // Simulazione asincrona del processo backend.
  simulateBackendProcess(job.id, params).catch(console.error);
  return job.id;
}

async function simulateBackendProcess(jobId: string, params: InvoicingParams) {
  const lines: string[] = [];
  const push = (msg: string) =>
    lines.push(`[${new Date().toLocaleTimeString("it-IT")}] ${msg}`);

  push("Avvio processo di fatturazione...");
  push(`Periodo: ${params.dateFrom} → ${params.dateTo}`);
  push(`Deposito: ${params.depositNumber || "TUTTI"}`);
  push(`Addebiti aggiuntivi: ${params.charges.length}`);

  await wait(1000);
  push("Caricamento dati dal gestionale...");
  await wait(1200);
  push("Calcolo totali e applicazione addebiti...");
  for (const c of params.charges) {
    push(`  + [${c.kind}] ${c.description}: € ${c.amount.toFixed(2)}`);
  }
  await wait(1000);
  push("Generazione file Excel...");
  await wait(800);
  push("File salvato in: /server/fatturazione/export/YYYYMMDD-HHMM.xlsx");
  push("Processo completato con successo.");

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

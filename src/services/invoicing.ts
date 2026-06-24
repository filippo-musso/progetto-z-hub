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
  /** Risolve quando il processo termina (log finale salvato). */
  done: Promise<void>;
}

export interface InvoicingProgress {
  /** 0-100 */
  percent: number;
  /** Messaggio testuale (es. "Elaborata spedizione 12 di 5000") */
  message: string;
  /** "elaborazione" | "completato" | "errore" */
  status: "elaborazione" | "completato" | "errore";
}

export interface StartInvoicingHooks {
  onLog?: (line: string) => void;
  onProgress?: (p: InvoicingProgress) => void;
}

/**
 * Avvia una fatturazione. Versione demo: processo simulato lato client.
 * In produzione il backend espone `POST /calcolo-massivo-stream` che ritorna
 * un `text/event-stream` con messaggi SSE `data: {JSON}\n\n` dove JSON ha
 * forma `{ stato, percentuale, messaggio, risultati? }`.
 *
 * 👉 Migrazione al backend reale: sostituire il corpo con una fetch streaming
 *    che parsifica le righe SSE e invoca `onProgress` / `onLog`.
 */
export async function startInvoicing(
  params: InvoicingParams,
  hooksOrOnLog?: StartInvoicingHooks | ((line: string) => void),
): Promise<StartInvoicingResult> {
  const hooks: StartInvoicingHooks =
    typeof hooksOrOnLog === "function" ? { onLog: hooksOrOnLog } : hooksOrOnLog ?? {};

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

  const done = simulateBackendProcess(job.id, params, hooks).catch((e) => {
    console.error(e);
  });
  return { jobId: job.id, done };
}

async function simulateBackendProcess(
  jobId: string,
  params: InvoicingParams,
  hooks: StartInvoicingHooks,
) {
  const lines: string[] = [];
  const push = (msg: string) => {
    const line = `[${new Date().toLocaleTimeString("it-IT")}] ${msg}`;
    lines.push(line);
    hooks.onLog?.(line);
  };
  const progress = (percent: number, message: string) => {
    hooks.onProgress?.({ percent, message, status: "elaborazione" });
  };

  push("Avvio processo di fatturazione...");
  push(`Periodo: ${params.dateFrom} → ${params.dateTo}`);
  push(`Deposito: ${params.depositNumber || "TUTTI"}`);
  push(`Addebiti aggiuntivi: ${params.charges.length}`);
  progress(2, "Inizializzazione...");

  await wait(700);
  push("Connessione al gestionale...");
  progress(8, "Connessione al gestionale");
  await wait(600);
  push("Caricamento movimenti del periodo...");
  progress(20, "Caricamento movimenti");
  await wait(900);
  push("Aggregazione per cliente e deposito...");
  progress(40, "Aggregazione dati");
  await wait(700);

  push("Applicazione tariffe e addebiti aggiuntivi...");
  const total = Math.max(params.charges.length, 1);
  for (let i = 0; i < params.charges.length; i++) {
    const c = params.charges[i];
    push(`  + [${c.kind}] ${c.description}: € ${c.amount.toFixed(2)}`);
    const p = 50 + Math.round(((i + 1) / total) * 35);
    progress(p, `Elaborata spedizione ${i + 1} di ${total}`);
    await wait(120);
  }
  if (params.charges.length === 0) progress(85, "Nessun addebito");

  await wait(500);
  push("Generazione file Excel...");
  progress(92, "Generazione file Excel");
  await wait(700);
  push("File salvato in: /server/fatturazione/export/YYYYMMDD-HHMM.xlsx");
  push("✅ Processo completato con successo.");
  hooks.onProgress?.({ percent: 100, message: "Elaborazione terminata", status: "completato" });

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

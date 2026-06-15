import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  startInvoicing,
  listInvoicingJobs,
  deleteInvoicingJob,
  type InvoicingCharge,
  type InvoicingChargeKind,
  type InvoicingJob,
} from "@/services/invoicing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Play,
  Loader2,
  Copy,
  Download,
  FileText,
  X,
  Terminal,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/fatturazione")({
  component: FatturazionePage,
});

function FatturazionePage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Fatturazione
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Avvia il processo di fatturazione per un periodo e visualizza la cronologia
        </p>
      </div>

      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="new">Nuova fatturazione</TabsTrigger>
          <TabsTrigger value="history">Cronologia</TabsTrigger>
        </TabsList>
        <TabsContent value="new" className="mt-4">
          <NewInvoicingForm />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <HistoryList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function previousMonthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last = new Date(now.getFullYear(), now.getMonth(), 0);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { from: fmt(first), to: fmt(last) };
}

function NewInvoicingForm() {
  const defaults = useMemo(previousMonthRange, []);
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [depositNumber, setDepositNumber] = useState("");
  const [charges, setCharges] = useState<InvoicingCharge[]>([]);
  const queryClient = useQueryClient();

  // Console flottante
  const [logOpen, setLogOpen] = useState(false);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [logRunning, setLogRunning] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      setLogLines([]);
      setLogRunning(true);
      setLogOpen(true);
      const { done } = await startInvoicing(
        {
          dateFrom,
          dateTo,
          depositNumber: depositNumber.trim() || undefined,
          charges,
        },
        (line) => setLogLines((prev) => [...prev, line]),
      );
      await done;
    },
    onSuccess: () => {
      setLogRunning(false);
      toast.success("Fatturazione completata");
      queryClient.invalidateQueries({ queryKey: ["invoicing-jobs"] });
      setCharges([]);
    },
    onError: (e) => {
      setLogRunning(false);
      toast.error(e instanceof Error ? e.message : "Errore");
    },
  });

  const addCharge = (kind: InvoicingChargeKind) =>
    setCharges((c) => [...c, { kind, description: "", amount: 0 }]);

  const updateCharge = (i: number, patch: Partial<InvoicingCharge>) =>
    setCharges((c) => c.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const removeCharge = (i: number) =>
    setCharges((c) => c.filter((_, idx) => idx !== i));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  const renderChargeSection = (kind: InvoicingChargeKind, title: string) => {
    const items = charges.map((c, i) => ({ c, i })).filter((x) => x.c.kind === kind);
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">{title}</h4>
          <Button type="button" size="sm" variant="outline" onClick={() => addCharge(kind)}>
            <Plus className="h-3 w-3 mr-1" /> Aggiungi
          </Button>
        </div>
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground italic">Nessun addebito</p>
        )}
        {items.map(({ c, i }) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-7">
              <Input
                placeholder="Descrizione"
                value={c.description}
                onChange={(e) => updateCharge(i, { description: e.target.value })}
                required
              />
            </div>
            <div className="col-span-4">
              <Input
                type="number"
                step="0.01"
                placeholder="Importo €"
                value={c.amount}
                onChange={(e) => updateCharge(i, { amount: Number(e.target.value) })}
                required
              />
            </div>
            <div className="col-span-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => removeCharge(i)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <form onSubmit={submit}>
        <Card>
          <CardHeader>
            <CardTitle>Parametri</CardTitle>
            <CardDescription>
              Inserisci periodo, deposito (opzionale) e addebiti aggiuntivi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Data inizio</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">Data fine</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dep">Numero deposito</Label>
                <Input
                  id="dep"
                  placeholder="Tutti i depositi"
                  value={depositNumber}
                  onChange={(e) => setDepositNumber(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">Addebiti specifici aggiuntivi</h3>
              <div className="grid gap-6 md:grid-cols-2">
                {renderChargeSection("transport", "Trasporto")}
                {renderChargeSection("logistics", "Logistica")}
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Avvia Fatturazione
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <FloatingLogWindow
        open={logOpen}
        running={logRunning}
        lines={logLines}
        onClose={() => setLogOpen(false)}
      />
    </>
  );
}

function FloatingLogWindow({
  open,
  running,
  lines,
  onClose,
}: {
  open: boolean;
  running: boolean;
  lines: string[];
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (el) (el as HTMLElement).scrollTop = (el as HTMLElement).scrollHeight;
  }, [lines]);

  if (!open) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[min(560px,calc(100vw-3rem))] animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
        <div
          className={cn(
            "flex items-center justify-between gap-2 px-4 py-2.5 border-b",
            "bg-gradient-to-r from-primary/10 to-primary/5",
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              {running ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5" />
                Log fatturazione
                {running ? (
                  <Badge variant="outline" className="text-[10px] py-0">in corso</Badge>
                ) : (
                  <Badge className="text-[10px] py-0 bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30">
                    completata
                  </Badge>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                Il log verrà salvato nella cronologia
              </div>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            onClick={onClose}
            aria-label="Chiudi"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea ref={scrollRef} className="h-64 bg-zinc-950">
          <pre className="text-xs font-mono whitespace-pre-wrap p-4 text-green-300 leading-relaxed">
            {lines.length === 0 ? "In attesa..." : lines.join("\n")}
            {running && <span className="inline-block w-2 h-3 bg-green-300 ml-0.5 animate-pulse" />}
          </pre>
        </ScrollArea>
      </div>
    </div>
  );
}

function HistoryList() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["invoicing-jobs"],
    queryFn: () => listInvoicingJobs(50),
    refetchInterval: 3000,
  });

  if (isLoading) return <p className="text-muted-foreground">Caricamento…</p>;
  if (!jobs || jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Nessuna fatturazione eseguita finora
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((j) => (
        <JobCard key={j.id} job={j} />
      ))}
    </div>
  );
}

function JobCard({ job }: { job: InvoicingJob }) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteInvoicingJob(job.id),
    onSuccess: () => {
      toast.success("Fatturazione eliminata");
      queryClient.invalidateQueries({ queryKey: ["invoicing-jobs"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Errore"),
  });

  const statusBadge = {
    pending: <Badge variant="outline">In coda</Badge>,
    running: (
      <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30">
        <Loader2 className="h-3 w-3 animate-spin mr-1" /> In corso
      </Badge>
    ),
    completed: (
      <Badge className="bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30">
        Completata
      </Badge>
    ),
    failed: <Badge variant="destructive">Fallita</Badge>,
  }[job.status] ?? null;

  const copyLog = () => {
    if (!job.log) return;
    navigator.clipboard.writeText(job.log);
    toast.success("Log copiato");
  };

  const downloadLog = () => {
    if (!job.log) return;
    const blob = new Blob([job.log], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fatturazione-${job.id.slice(0, 8)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const charges = Array.isArray(job.extra_charges) ? job.extra_charges : [];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {statusBadge}
              <span className="font-medium text-sm">
                {job.date_from} → {job.date_to}
              </span>
              {job.deposit_number && (
                <Badge variant="outline">Deposito {job.deposit_number}</Badge>
              )}
              {charges.length > 0 && (
                <Badge variant="secondary">
                  {charges.length} addebit{charges.length === 1 ? "o" : "i"}
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Avviata: {new Date(job.created_at).toLocaleString("it-IT")}
              {job.completed_at && (
                <> · Completata: {new Date(job.completed_at).toLocaleString("it-IT")}</>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(job.log || charges.length > 0) && (
              <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
                {open ? "Nascondi dettagli" : "Vedi dettagli"}
              </Button>
            )}
            {isAdmin && (
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmDelete(true)}
                aria-label="Elimina"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {open && (
          <div className="mt-4 space-y-4">
            {charges.length > 0 && (
              <div className="rounded-md border bg-muted/30 p-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                  Addebiti specifici
                </div>
                <ul className="space-y-1 text-sm">
                  {charges.map((c, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span>
                        <Badge variant="outline" className="mr-2 text-[10px]">
                          {c.kind === "transport" ? "Trasporto" : "Logistica"}
                        </Badge>
                        {c.description}
                      </span>
                      <span className="font-mono">€ {Number(c.amount).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {job.log && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase text-muted-foreground">
                    Log esecuzione
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={copyLog}>
                      <Copy className="h-3 w-3 mr-1" /> Copia
                    </Button>
                    <Button size="sm" variant="ghost" onClick={downloadLog}>
                      <Download className="h-3 w-3 mr-1" /> Scarica
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-64 rounded-md border bg-zinc-950 p-3">
                  <pre className="text-xs font-mono whitespace-pre-wrap text-green-300 leading-relaxed">
                    {job.log}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa fatturazione?</AlertDialogTitle>
            <AlertDialogDescription>
              L'operazione è irreversibile. Verranno rimossi parametri e log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

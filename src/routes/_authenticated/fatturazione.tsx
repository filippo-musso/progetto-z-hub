import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  startInvoicing,
  listInvoicingJobs,
  deleteInvoicingJob,
  type InvoicingJob,
} from "@/services/invoicing";
import {
  listAdditionalCharges,
  createAdditionalCharges,
  updateAdditionalCharge,
  deleteAdditionalCharge,
  CHARGE_ITEMS,
  type AdditionalCharge,
  type ChargeKind,
  type ChargeSign,
  type NewCharge,
} from "@/services/additional-charges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  ChevronsUpDown,
  Check,
  Save,
  RefreshCw,
  Package,
  Truck,
  TrendingUp,
  TrendingDown,
  Calendar as CalendarIcon,
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
          Avvia il processo di fatturazione, gestisci gli addebiti aggiuntivi e visualizza la cronologia
        </p>
      </div>

      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="new">Nuova fatturazione</TabsTrigger>
          <TabsTrigger value="charges">Addebiti aggiuntivi</TabsTrigger>
          <TabsTrigger value="history">Cronologia</TabsTrigger>
        </TabsList>
        <TabsContent value="new" className="mt-4">
          <NewInvoicingForm />
        </TabsContent>
        <TabsContent value="charges" className="mt-4">
          <AdditionalChargesTab />
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

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ============== NUOVA FATTURAZIONE ==============

function NewInvoicingForm() {
  const defaults = useMemo(previousMonthRange, []);
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [depositNumber, setDepositNumber] = useState("");
  const queryClient = useQueryClient();

  // Console flottante
  const [logOpen, setLogOpen] = useState(false);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [logRunning, setLogRunning] = useState(false);

  // Addebiti caricati dal periodo
  const [loadedCharges, setLoadedCharges] = useState<AdditionalCharge[] | null>(null);

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
          charges: [],
        },
        (line) => setLogLines((prev) => [...prev, line]),
      );
      await done;
    },
    onSuccess: () => {
      setLogRunning(false);
      toast.success("Fatturazione completata");
      queryClient.invalidateQueries({ queryKey: ["invoicing-jobs"] });
    },
    onError: (e) => {
      setLogRunning(false);
      toast.error(e instanceof Error ? e.message : "Errore");
    },
  });

  const loadChargesMutation = useMutation({
    mutationFn: () =>
      listAdditionalCharges({
        from: dateFrom,
        to: dateTo,
        depositNumber: depositNumber.trim() || undefined,
      }),
    onSuccess: (data) => {
      setLoadedCharges(data);
      toast.success(`${data.length} addebit${data.length === 1 ? "o" : "i"} caricat${data.length === 1 ? "o" : "i"}`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Errore"),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <>
      <form onSubmit={submit}>
        <Card>
          <CardHeader>
            <CardTitle>Parametri</CardTitle>
            <CardDescription>
              Inserisci periodo e deposito (opzionale), poi avvia la fatturazione
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

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Button type="submit" size="lg" disabled={mutation.isPending} className="bg-primary">
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Avvia Fatturazione
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => loadChargesMutation.mutate()}
                disabled={loadChargesMutation.isPending}
              >
                {loadChargesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Carica addebiti del periodo
              </Button>
            </div>

            {loadedCharges && (
              <LoadedChargesPreview
                charges={loadedCharges}
                onClose={() => setLoadedCharges(null)}
              />
            )}
          </CardContent>
        </Card>
      </form>

      <div className="mt-6">
        <PendingChargesEditor />
      </div>

      <FloatingLogWindow
        open={logOpen}
        running={logRunning}
        lines={logLines}
        onClose={() => setLogOpen(false)}
      />
    </>
  );
}

// ============== PREVIEW ADDEBITI CARICATI ==============

function LoadedChargesPreview({
  charges,
  onClose,
}: {
  charges: AdditionalCharge[];
  onClose: () => void;
}) {
  const byDeposit = useMemo(() => {
    const m = new Map<string, AdditionalCharge[]>();
    for (const c of charges) {
      const k = c.deposit_number || "(senza deposito)";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(c);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [charges]);

  const totalNet = charges.reduce(
    (s, c) => s + (c.sign === "credit" ? -c.total : c.total),
    0,
  );

  return (
    <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-transparent p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary/15 text-primary flex items-center justify-center">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold">Addebiti del periodo</div>
            <div className="text-xs text-muted-foreground">
              {charges.length} voc{charges.length === 1 ? "e" : "i"} · {byDeposit.length} deposit{byDeposit.length === 1 ? "o" : "i"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Totale netto</div>
            <div className={cn("font-mono font-semibold text-lg", totalNet >= 0 ? "text-foreground" : "text-emerald-600 dark:text-emerald-400")}>
              € {totalNet.toFixed(2)}
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Chiudi">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {charges.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-6 text-center">
          Nessun addebito aggiuntivo nel periodo selezionato
        </p>
      ) : (
        <div className="space-y-3">
          {byDeposit.map(([dep, items]) => (
            <DepositChargesGroup key={dep} deposit={dep} items={items} />
          ))}
        </div>
      )}
    </div>
  );
}

function DepositChargesGroup({ deposit, items }: { deposit: string; items: AdditionalCharge[] }) {
  const subtotal = items.reduce(
    (s, c) => s + (c.sign === "credit" ? -c.total : c.total),
    0,
  );
  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">Dep. {deposit}</Badge>
          <span className="text-xs text-muted-foreground">{items.length} voc{items.length === 1 ? "e" : "i"}</span>
        </div>
        <div className={cn("font-mono font-semibold text-sm", subtotal >= 0 ? "text-foreground" : "text-emerald-600 dark:text-emerald-400")}>
          € {subtotal.toFixed(2)}
        </div>
      </div>
      <div className="divide-y">
        {items.map((c) => (
          <ChargeRowReadonly key={c.id} c={c} />
        ))}
      </div>
    </div>
  );
}

function ChargeRowReadonly({ c }: { c: AdditionalCharge }) {
  const isCredit = c.sign === "credit";
  const isLogistics = c.kind === "logistics";
  return (
    <div className="grid grid-cols-12 gap-2 items-center px-3 py-2 text-sm hover:bg-muted/30">
      <div className="col-span-2 flex items-center gap-1.5">
        {isLogistics ? (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px]">
            <Package className="h-3 w-3 mr-1" /> Logistica
          </Badge>
        ) : (
          <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 text-[10px]">
            <Truck className="h-3 w-3 mr-1" /> Trasporto
          </Badge>
        )}
      </div>
      <div className="col-span-2 text-xs text-muted-foreground font-mono">
        {c.charge_date}
      </div>
      <div className="col-span-1">
        {isCredit ? (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]">
            <TrendingDown className="h-3 w-3 mr-1" /> Storno
          </Badge>
        ) : (
          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 text-[10px]">
            <TrendingUp className="h-3 w-3 mr-1" /> Addebito
          </Badge>
        )}
      </div>
      <div className="col-span-4 font-medium truncate">{c.item}</div>
      <div className="col-span-1 text-xs text-right font-mono">{Number(c.quantity)} × € {Number(c.unit_price).toFixed(2)}</div>
      <div className="col-span-1 text-right">
        {c.istat ? (
          <Badge variant="outline" className="text-[10px]">ISTAT</Badge>
        ) : (
          <span className="text-[10px] text-muted-foreground">no ISTAT</span>
        )}
      </div>
      <div className={cn("col-span-1 text-right font-mono font-semibold", isCredit && "text-emerald-600 dark:text-emerald-400")}>
        {isCredit ? "−" : ""}€ {Number(c.total).toFixed(2)}
      </div>
    </div>
  );
}

// ============== EDITOR ADDEBITI DA CONFERMARE ==============

interface DraftCharge extends NewCharge {
  _key: string;
}

function makeDraft(): DraftCharge {
  return {
    _key: crypto.randomUUID(),
    kind: "transport",
    charge_date: todayStr(),
    sign: "debit",
    item: "",
    unit_price: 0,
    quantity: 1,
    total: 0,
    istat: false,
    deposit_number: "",
    notes: null,
  };
}

function PendingChargesEditor() {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<DraftCharge[]>([]);

  const update = (key: string, patch: Partial<DraftCharge>) =>
    setDrafts((arr) =>
      arr.map((d) => {
        if (d._key !== key) return d;
        const merged = { ...d, ...patch };
        merged.total = Number((Number(merged.unit_price) * Number(merged.quantity)).toFixed(2));
        return merged;
      }),
    );

  const remove = (key: string) => setDrafts((arr) => arr.filter((d) => d._key !== key));

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const invalid = drafts.find(
        (d) => !d.item.trim() || !d.deposit_number.trim() || !d.charge_date,
      );
      if (invalid) throw new Error("Compila voce, deposito e data per tutte le righe");
      const rows: NewCharge[] = drafts.map(({ _key, ...rest }) => rest);
      await createAdditionalCharges(rows);
    },
    onSuccess: () => {
      toast.success(`${drafts.length} addebit${drafts.length === 1 ? "o salvato" : "i salvati"}`);
      setDrafts([]);
      queryClient.invalidateQueries({ queryKey: ["additional-charges"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Errore"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          Inserisci addebiti aggiuntivi
        </CardTitle>
        <CardDescription>
          Gli addebiti vengono salvati separatamente dalla fatturazione e successivamente
          inclusi in base alla data. Verranno raggruppati per mese nella scheda{" "}
          <span className="font-medium">Addebiti aggiuntivi</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {drafts.length === 0 && (
          <p className="text-sm text-muted-foreground italic text-center py-4">
            Nessuna riga. Clicca "Aggiungi riga" per iniziare.
          </p>
        )}

        {drafts.length > 0 && (
          <div className="hidden lg:grid grid-cols-12 gap-2 text-[11px] uppercase font-semibold text-muted-foreground px-2">
            <div className="col-span-1">Tipo</div>
            <div className="col-span-2">Data</div>
            <div className="col-span-1">Segno</div>
            <div className="col-span-2">Voce</div>
            <div className="col-span-1">P. unit. €</div>
            <div className="col-span-1">Q.tà</div>
            <div className="col-span-1">Totale</div>
            <div className="col-span-1">ISTAT</div>
            <div className="col-span-1">Deposito</div>
            <div className="col-span-1"></div>
          </div>
        )}

        <div className="space-y-2">
          {drafts.map((d) => (
            <ChargeRowEditor
              key={d._key}
              row={d}
              onChange={(p) => update(d._key, p)}
              onRemove={() => remove(d._key)}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDrafts((a) => [...a, makeDraft()])}
          >
            <Plus className="h-4 w-4 mr-1" /> Aggiungi riga
          </Button>
          <Button
            type="button"
            disabled={drafts.length === 0 || confirmMutation.isPending}
            onClick={() => confirmMutation.mutate()}
            className="bg-primary"
          >
            {confirmMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Conferma {drafts.length > 0 ? `${drafts.length} ` : ""}addebit{drafts.length === 1 ? "o" : "i"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ChargeRowEditor({
  row,
  onChange,
  onRemove,
}: {
  row: DraftCharge;
  onChange: (p: Partial<DraftCharge>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-12 gap-2 items-center p-2 rounded-md border bg-card">
      <div className="lg:col-span-1">
        <Select value={row.kind} onValueChange={(v) => onChange({ kind: v as ChargeKind })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="transport">Trasporto</SelectItem>
            <SelectItem value="logistics">Logistica</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="lg:col-span-2">
        <Input
          type="date"
          value={row.charge_date}
          onChange={(e) => onChange({ charge_date: e.target.value })}
          className="h-9"
        />
      </div>
      <div className="lg:col-span-1">
        <Select value={row.sign} onValueChange={(v) => onChange({ sign: v as ChargeSign })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="debit">Addebito</SelectItem>
            <SelectItem value="credit">Storno</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="lg:col-span-2">
        <ItemCombobox value={row.item} onChange={(v) => onChange({ item: v })} />
      </div>
      <div className="lg:col-span-1">
        <Input
          type="number"
          step="0.01"
          value={row.unit_price}
          onChange={(e) => onChange({ unit_price: Number(e.target.value) })}
          className="h-9 text-right font-mono"
        />
      </div>
      <div className="lg:col-span-1">
        <Input
          type="number"
          step="0.01"
          value={row.quantity}
          onChange={(e) => onChange({ quantity: Number(e.target.value) })}
          className="h-9 text-right font-mono"
        />
      </div>
      <div className="lg:col-span-1">
        <div className="h-9 px-3 rounded-md border bg-muted/40 flex items-center justify-end font-mono text-sm font-semibold">
          € {row.total.toFixed(2)}
        </div>
      </div>
      <div className="lg:col-span-1">
        <Select
          value={row.istat ? "istat" : "no"}
          onValueChange={(v) => onChange({ istat: v === "istat" })}
        >
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="istat">ISTAT</SelectItem>
            <SelectItem value="no">No ISTAT</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="lg:col-span-1">
        <Input
          placeholder="Dep."
          value={row.deposit_number}
          onChange={(e) => onChange({ deposit_number: e.target.value })}
          className="h-9 font-mono"
        />
      </div>
      <div className="lg:col-span-1 flex justify-end">
        <Button type="button" size="icon" variant="ghost" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

function ItemCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className="h-9 w-full justify-between font-normal"
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || "Seleziona voce..."}
          </span>
          <ChevronsUpDown className="h-3 w-3 opacity-50 shrink-0 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[240px] pointer-events-auto" align="start">
        <Command>
          <CommandInput
            placeholder="Cerca o digita..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => {
                  onChange(search);
                  setOpen(false);
                  setSearch("");
                }}
              >
                Usa "{search}"
              </button>
            </CommandEmpty>
            <CommandGroup>
              {CHARGE_ITEMS.map((it) => (
                <CommandItem
                  key={it}
                  value={it}
                  onSelect={() => {
                    onChange(it);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check className={cn("mr-2 h-3 w-3", value === it ? "opacity-100" : "opacity-0")} />
                  {it}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ============== TAB ADDEBITI AGGIUNTIVI (per mese) ==============

const MONTHS_IT = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function AdditionalChargesTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["additional-charges"],
    queryFn: () => listAdditionalCharges(),
  });

  const byMonth = useMemo(() => {
    if (!data) return [] as Array<{ key: string; label: string; items: AdditionalCharge[] }>;
    const m = new Map<string, AdditionalCharge[]>();
    for (const c of data) {
      const [y, mo] = c.charge_date.split("-");
      const k = `${y}-${mo}`;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(c);
    }
    return Array.from(m.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, items]) => {
        const [y, mo] = key.split("-");
        return { key, label: `${MONTHS_IT[Number(mo) - 1]} ${y}`, items };
      });
  }, [data]);

  if (isLoading) return <p className="text-muted-foreground">Caricamento…</p>;

  if (!byMonth.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Nessun addebito aggiuntivo. Aggiungili dalla scheda "Nuova fatturazione".
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <Accordion type="multiple" defaultValue={[byMonth[0].key]}>
          {byMonth.map((m) => {
            const total = m.items.reduce(
              (s, c) => s + (c.sign === "credit" ? -c.total : c.total),
              0,
            );
            return (
              <AccordionItem key={m.key} value={m.key}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                        <CalendarIcon className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{m.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.items.length} voc{m.items.length === 1 ? "e" : "i"}
                        </div>
                      </div>
                    </div>
                    <div className={cn("font-mono font-semibold", total < 0 && "text-emerald-600 dark:text-emerald-400")}>
                      € {total.toFixed(2)}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1">
                    {m.items.map((c) => (
                      <EditableChargeRow key={c.id} charge={c} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}

function EditableChargeRow({ charge }: { charge: AdditionalCharge }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [draft, setDraft] = useState<NewCharge>({
    kind: charge.kind,
    charge_date: charge.charge_date,
    sign: charge.sign,
    item: charge.item,
    unit_price: Number(charge.unit_price),
    quantity: Number(charge.quantity),
    total: Number(charge.total),
    istat: charge.istat,
    deposit_number: charge.deposit_number,
    notes: charge.notes,
  });

  const update = (p: Partial<NewCharge>) => {
    setDraft((d) => {
      const merged = { ...d, ...p };
      merged.total = Number((Number(merged.unit_price) * Number(merged.quantity)).toFixed(2));
      return merged;
    });
  };

  const saveMutation = useMutation({
    mutationFn: () => updateAdditionalCharge(charge.id, draft),
    onSuccess: () => {
      toast.success("Addebito aggiornato");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["additional-charges"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Errore"),
  });

  const delMutation = useMutation({
    mutationFn: () => deleteAdditionalCharge(charge.id),
    onSuccess: () => {
      toast.success("Addebito eliminato");
      queryClient.invalidateQueries({ queryKey: ["additional-charges"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Errore"),
  });

  if (editing) {
    return (
      <div className="rounded-md border bg-muted/30 p-2 space-y-2">
        <ChargeRowEditor
          row={{ ...draft, _key: charge.id }}
          onChange={update}
          onRemove={() => setEditing(false)}
        />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Annulla</Button>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
            Salva
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <div className="flex-1">
        <ChargeRowReadonly c={charge} />
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(true)}>
          <FileText className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setConfirmDel(true)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo addebito?</AlertDialogTitle>
            <AlertDialogDescription>L'operazione è irreversibile.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => delMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============== CONSOLE FLOTTANTE ==============

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

// ============== CRONOLOGIA ==============

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

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
import {
  REGIONI_ITALIANE,
  type Regione,
  type OpzioniSpedizione,
  type CalcolaTariffaResponse,
  calcolaTutti,
  calcolaCostoCliente,
  DEPOSITI_MOCK,
  pesoTassabile,
} from "@/services/transport";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Truck,
  Calculator,
  Trophy,
  Package,
  MapPin,
  Settings2,
  Building2,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/nuovo-costo-trasporto")({
  component: NuovoCostoTrasportoPage,
});

const fmtEUR = (n: number) =>
  n.toLocaleString("it-IT", { style: "currency", currency: "EUR" });

function NuovoCostoTrasportoPage() {
  const [peso, setPeso] = useState<string>("");
  const [regione, setRegione] = useState<Regione | "">("");
  const [cap, setCap] = useState("");
  const [localita, setLocalita] = useState("");
  const [provincia, setProvincia] = useState("");
  const [codiceDeposito, setCodiceDeposito] = useState("");
  const [opzioni, setOpzioni] = useState<OpzioniSpedizione>({
    sponda: false,
    espressa: false,
    telefonica: false,
    tassativa: false,
    mezzoPiccolo: false,
    facchinaggio: false,
    allRisk: false,
    valoreAssicurato: undefined,
  });

  const [risultati, setRisultati] = useState<CalcolaTariffaResponse[] | null>(null);
  const [inputUsato, setInputUsato] = useState<{
    regione: Regione;
    deposito?: string;
  } | null>(null);
  const [preventivo, setPreventivo] = useState<string>("");

  const canCalc = peso && Number(peso) > 0 && regione;

  function handleCalc() {
    if (!canCalc) return;
    const r = calcolaTutti({
      pesoKg: Number(peso),
      regione: regione as Regione,
      cap: cap || undefined,
      localita: localita || undefined,
      provincia: provincia || undefined,
      codiceDeposito: codiceDeposito || undefined,
      opzioni,
    });
    setRisultati(r);
    setInputUsato({
      regione: regione as Regione,
      deposito: codiceDeposito.trim() || undefined,
    });
    setPreventivo("");
  }

  const miglior = useMemo(() => {
    if (!risultati || risultati.length === 0) return null;
    return risultati.reduce((a, b) => (a.costo_totale <= b.costo_totale ? a : b));
  }, [risultati]);

  const cliente =
    inputUsato?.deposito && miglior
      ? calcolaCostoCliente(miglior.costo_totale, inputUsato.deposito)
      : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary" />
          Nuovo costo trasporto
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Confronta le tariffe dei vettori e calcola il costo al cliente
        </p>
      </div>

      <div className="grid lg:grid-cols-[420px_1fr] gap-6 items-start">
        {/* FORM */}
        <Card className="shadow-[var(--shadow-md)]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              Dati spedizione
            </CardTitle>
            <CardDescription>Compila i campi e calcola</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                <Package className="h-3 w-3" />
                Peso totale (kg)
              </Label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="es. 250"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                <MapPin className="h-3 w-3" />
                Regione *
              </Label>
              <RegioneCombobox value={regione} onChange={setRegione} />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">CAP</Label>
                <Input value={cap} onChange={(e) => setCap(e.target.value)} placeholder="—" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-[11px] text-muted-foreground">Località</Label>
                <Input
                  value={localita}
                  onChange={(e) => setLocalita(e.target.value)}
                  placeholder="—"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Provincia</Label>
              <Input
                value={provincia}
                onChange={(e) => setProvincia(e.target.value.toUpperCase())}
                placeholder="es. MI"
                maxLength={2}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                <Building2 className="h-3 w-3" />
                Codice deposito (opzionale)
              </Label>
              <Input
                value={codiceDeposito}
                onChange={(e) => setCodiceDeposito(e.target.value)}
                placeholder="es. 001"
              />
              <p className="text-[11px] text-muted-foreground">
                Se inserito calcoliamo anche il costo al cliente
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground font-medium">
                <Settings2 className="h-3 w-3" />
                Opzioni spedizione
              </Label>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                <OptionCheck
                  label="Consegna con sponda"
                  checked={opzioni.sponda}
                  onChange={(v) => setOpzioni((o) => ({ ...o, sponda: v }))}
                />
                <OptionCheck
                  label="Consegna espressa"
                  checked={opzioni.espressa}
                  onChange={(v) => setOpzioni((o) => ({ ...o, espressa: v }))}
                />
                <OptionCheck
                  label="Prenotazione telefonica"
                  checked={opzioni.telefonica}
                  onChange={(v) => setOpzioni((o) => ({ ...o, telefonica: v }))}
                />
                <OptionCheck
                  label="Consegna tassativa"
                  checked={opzioni.tassativa}
                  onChange={(v) => setOpzioni((o) => ({ ...o, tassativa: v }))}
                />
                <OptionCheck
                  label="Mezzo piccolo"
                  checked={opzioni.mezzoPiccolo}
                  onChange={(v) => setOpzioni((o) => ({ ...o, mezzoPiccolo: v }))}
                />
                <OptionCheck
                  label="Facchinaggio"
                  checked={opzioni.facchinaggio}
                  onChange={(v) => setOpzioni((o) => ({ ...o, facchinaggio: v }))}
                />
                <div className="col-span-2">
                  <OptionCheck
                    label="Assicurazione All Risk"
                    checked={opzioni.allRisk}
                    onChange={(v) =>
                      setOpzioni((o) => ({
                        ...o,
                        allRisk: v,
                        valoreAssicurato: v ? o.valoreAssicurato : undefined,
                      }))
                    }
                  />
                  {opzioni.allRisk && (
                    <div className="mt-2 ml-6">
                      <Label className="text-[11px] text-muted-foreground">
                        Valore da assicurare (€)
                      </Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={opzioni.valoreAssicurato ?? ""}
                        onChange={(e) =>
                          setOpzioni((o) => ({
                            ...o,
                            valoreAssicurato: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={handleCalc}
              disabled={!canCalc}
              className="w-full bg-[var(--gradient-brand)] shadow-[var(--shadow-md)] h-11"
              size="lg"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calcola tariffa
            </Button>
          </CardContent>
        </Card>

        {/* OUTPUT */}
        <div className="space-y-6 min-w-0">
          {!risultati ? (
            <EmptyState />
          ) : (
            <>
              <SectionCostoNostro risultati={risultati} miglior={miglior!} />
              {inputUsato?.deposito && (
                <SectionCostoCliente
                  miglior={miglior!}
                  deposito={inputUsato.deposito}
                  cliente={cliente}
                  preventivo={preventivo}
                  setPreventivo={setPreventivo}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-16 flex flex-col items-center text-center gap-3">
        <div className="h-14 w-14 rounded-2xl bg-[var(--gradient-soft)] flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="font-medium">Nessun calcolo ancora</p>
          <p className="text-sm text-muted-foreground mt-1">
            Inserisci peso e regione, poi premi <span className="font-medium">Calcola</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionCostoNostro({
  risultati,
  miglior,
}: {
  risultati: CalcolaTariffaResponse[];
  miglior: CalcolaTariffaResponse;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            Costo trasporto per Progetto Z
          </h2>
          <p className="text-xs text-muted-foreground">
            Confronto fra i vettori — il più conveniente è evidenziato
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <MapPin className="h-3 w-3" />
          {miglior.regione}
        </Badge>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {risultati.map((r) => {
          const isBest = r.vettore === miglior.vettore;
          return (
            <Card
              key={r.vettore}
              className={cn(
                "relative overflow-hidden transition",
                isBest
                  ? "border-emerald-500/60 ring-2 ring-emerald-500/30 shadow-[0_8px_30px_-12px_rgba(16,185,129,0.45)]"
                  : "opacity-90",
              )}
            >
              {isBest && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded-bl-lg flex items-center gap-1 uppercase tracking-wide">
                  <Trophy className="h-3 w-3" />
                  Migliore
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{r.vettore}</CardTitle>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span>
                    Peso tass.{" "}
                    <span className="text-foreground font-medium">{r.peso_tassabile} kg</span>
                  </span>
                  <span>•</span>
                  <span>
                    €/q{" "}
                    <span className="text-foreground font-medium">
                      {r.tariffa_quintale.toFixed(2)}
                    </span>
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1.5">
                  {Object.entries(r.addebiti).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium tabular-nums">{fmtEUR(v)}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Costo totale
                  </span>
                  <span
                    className={cn(
                      "text-2xl font-bold tabular-nums",
                      isBest ? "text-emerald-600" : "text-foreground",
                    )}
                  >
                    {fmtEUR(r.costo_totale)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function SectionCostoCliente({
  miglior,
  deposito,
  cliente,
  preventivo,
  setPreventivo,
}: {
  miglior: CalcolaTariffaResponse;
  deposito: string;
  cliente: ReturnType<typeof calcolaCostoCliente>;
  preventivo: string;
  setPreventivo: (v: string) => void;
}) {
  const prev = Number(preventivo);
  const hasPreventivo = preventivo !== "" && !isNaN(prev) && prev > 0;
  const importoUsato = hasPreventivo ? prev : cliente?.costoCliente ?? 0;
  const margine = importoUsato - miglior.costo_totale;
  const ricaricoPct =
    miglior.costo_totale > 0 ? (margine / miglior.costo_totale) * 100 : 0;
  const marginePct = importoUsato > 0 ? (margine / importoUsato) * 100 : 0;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Costo trasporto per il cliente
          </h2>
          <p className="text-xs text-muted-foreground">
            Deposito{" "}
            <span className="font-medium text-foreground">{deposito}</span>
            {cliente && <> — {cliente.deposito}</>}
          </p>
        </div>
      </div>

      {!cliente ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Codice deposito{" "}
              <span className="font-mono font-medium">{deposito}</span> non trovato.
              <br />
              Codici demo disponibili: {Object.keys(DEPOSITI_MOCK).join(", ")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-[var(--shadow-md)] bg-[var(--gradient-soft)] border-primary/20">
          <CardContent className="pt-6 space-y-5">
            <div className="grid sm:grid-cols-3 gap-4">
              <Stat
                label="Costo a noi"
                value={fmtEUR(miglior.costo_totale)}
                sub={miglior.vettore}
              />
              <Stat
                label="Costo al cliente"
                value={fmtEUR(cliente.costoCliente)}
                sub={`Listino +${cliente.markupPct}%`}
                accent
              />
              <Stat
                label="Importo applicato"
                value={fmtEUR(importoUsato)}
                sub={hasPreventivo ? "Da preventivo" : "Listino"}
              />
            </div>

            <Separator />

            <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3" />
                  Preventivo personalizzato (€)
                </Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  className="mt-1.5 bg-background"
                  placeholder={`Default ${fmtEUR(cliente.costoCliente)}`}
                  value={preventivo}
                  onChange={(e) => setPreventivo(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Cambia l'importo per ricalcolare margine e ricarico
                </p>
              </div>

              <div className="hidden sm:block h-12 w-px bg-border self-center" />

              <div className="grid grid-cols-2 gap-3">
                <MarginCard
                  label="Margine"
                  value={fmtEUR(margine)}
                  pct={marginePct}
                  positive={margine >= 0}
                />
                <MarginCard
                  label="Ricarico"
                  value={`${ricaricoPct.toFixed(1)}%`}
                  pct={ricaricoPct}
                  positive={ricaricoPct >= 0}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-background/70 rounded-xl p-4 border">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </div>
      <div
        className={cn(
          "text-xl font-bold tabular-nums mt-1",
          accent && "text-primary",
        )}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function MarginCard({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  pct: number;
  positive: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl p-3 border bg-background/70",
        positive ? "border-emerald-500/30" : "border-destructive/30",
      )}
    >
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
        {label}
      </div>
      <div
        className={cn(
          "text-lg font-bold tabular-nums",
          positive ? "text-emerald-600" : "text-destructive",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function OptionCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 text-sm cursor-pointer select-none rounded-md px-2 py-1.5 transition",
        checked ? "bg-primary/10 text-foreground" : "hover:bg-muted/60",
      )}
    >
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} />
      <span>{label}</span>
    </label>
  );
}

/* ---------------- Combobox Regione ---------------- */

function RegioneCombobox({
  value,
  onChange,
}: {
  value: Regione | "";
  onChange: (v: Regione) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) setQuery(value);
  }, [value]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return REGIONI_ITALIANE.slice(0, 8);
    return REGIONI_ITALIANE.filter((r) => r.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  function commit(r: Regione) {
    onChange(r);
    setQuery(r);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = suggestions[highlight];
      if (sel) commit(sel);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Digita o scegli una regione..."
        className="text-base"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">
          {suggestions.map((r, i) => (
            <button
              key={r}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commit(r)}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition",
                i === highlight ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              <MapPin className="h-3.5 w-3.5 opacity-70" />
              <span>{r}</span>
              {value === r && (
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  selezionata
                </Badge>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// avoid unused warnings for pesoTassabile re-export possibility
void pesoTassabile;

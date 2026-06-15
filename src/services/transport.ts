// Mock service per il calcolo del costo di trasporto.
// In futuro qui verrà chiamato il backend reale.

export const REGIONI_ITALIANE = [
  "Abruzzo",
  "Basilicata",
  "Calabria",
  "Campania",
  "Emilia-Romagna",
  "Friuli-Venezia Giulia",
  "Lazio",
  "Liguria",
  "Lombardia",
  "Marche",
  "Molise",
  "Piemonte",
  "Puglia",
  "Sardegna",
  "Sicilia",
  "Toscana",
  "Trentino-Alto Adige",
  "Umbria",
  "Valle d'Aosta",
  "Veneto",
] as const;

export type Regione = (typeof REGIONI_ITALIANE)[number];

export type OpzioniSpedizione = {
  sponda: boolean;
  espressa: boolean;
  telefonica: boolean;
  tassativa: boolean;
  mezzoPiccolo: boolean;
  facchinaggio: boolean;
  allRisk: boolean;
  valoreAssicurato?: number; // EUR, usato solo se allRisk
};

export type CalcoloInput = {
  pesoKg: number;
  regione: Regione;
  cap?: string;
  localita?: string;
  provincia?: string;
  codiceDeposito?: string;
  opzioni: OpzioniSpedizione;
};

export type CalcolaTariffaResponse = {
  vettore: string;
  regione: string;
  peso_tassabile: number;
  tariffa_quintale: number;
  addebiti: Record<string, number>;
  costo_totale: number;
};

// Vettori mock
export type Vettore = {
  id: string;
  nome: string;
  baseQuintale: Record<Regione, number>; // €/q
  dirittoFisso: number;
  supplementoCarburantePct: number; // % sul costo base
  variazioneIstatPct: number; // %
};

function buildBase(min: number, max: number): Record<Regione, number> {
  const map = {} as Record<Regione, number>;
  REGIONI_ITALIANE.forEach((r, i) => {
    // Distribuzione deterministica fra min e max
    const t = i / (REGIONI_ITALIANE.length - 1);
    map[r] = Math.round((min + (max - min) * t) * 100) / 100;
  });
  return map;
}

export const VETTORI: Vettore[] = [
  {
    id: "arco",
    nome: "Arco Spedizioni",
    baseQuintale: buildBase(14, 38),
    dirittoFisso: 4.5,
    supplementoCarburantePct: 7.5,
    variazioneIstatPct: 2.1,
  },
  {
    id: "susa",
    nome: "Susa Trasporti",
    baseQuintale: buildBase(15.5, 35),
    dirittoFisso: 5.2,
    supplementoCarburantePct: 6.8,
    variazioneIstatPct: 2.5,
  },
];

// Depositi mock per simulare il calcolo cliente
export const DEPOSITI_MOCK: Record<string, { nome: string; markupPct: number }> = {
  "001": { nome: "Cliente Rossi SRL", markupPct: 22 },
  "002": { nome: "Bianchi Logistica", markupPct: 18 },
  "010": { nome: "Verdi & Co", markupPct: 30 },
};

export function pesoTassabile(pesoKg: number): number {
  if (pesoKg <= 0) return 0;
  // arrotonda allo scaglione di 50kg superiore
  return Math.ceil(pesoKg / 50) * 50;
}

function isCapDisagiato(cap?: string): boolean {
  if (!cap) return false;
  // mock: alcuni CAP isole/montagna
  const n = parseInt(cap, 10);
  if (isNaN(n)) return false;
  return (
    (n >= 7000 && n <= 9999) || // Sardegna
    (n >= 90000 && n <= 98168) // Sicilia
  );
}

export function calcolaTariffa(
  vettore: Vettore,
  input: CalcoloInput,
): CalcolaTariffaResponse {
  const peso_t = pesoTassabile(input.pesoKg);
  const tariffa_q = vettore.baseQuintale[input.regione];
  const quintali = peso_t / 100;
  const costoBase = Math.round(tariffa_q * quintali * 100) / 100;

  const addebiti: Record<string, number> = {
    "Costo base": costoBase,
    "Diritto fisso": vettore.dirittoFisso,
    "Supplemento carburante": round2(costoBase * (vettore.supplementoCarburantePct / 100)),
    "Variazione ISTAT": round2(costoBase * (vettore.variazioneIstatPct / 100)),
  };

  const o = input.opzioni;
  if (o.sponda) addebiti["Consegna con sponda"] = 18;
  if (o.espressa) addebiti["Consegna espressa"] = round2(costoBase * 0.15);
  if (o.telefonica) addebiti["Prenotazione telefonica"] = 4;
  if (o.tassativa) addebiti["Consegna tassativa"] = 12;
  if (o.mezzoPiccolo) addebiti["Mezzo piccolo"] = 25;
  if (o.facchinaggio) addebiti["Facchinaggio"] = round2(peso_t * 0.08);
  if (o.allRisk && o.valoreAssicurato && o.valoreAssicurato > 0) {
    addebiti["Assicurazione All Risk"] = round2(o.valoreAssicurato * 0.004);
  }
  if (isCapDisagiato(input.cap)) {
    addebiti["Località disagiata"] = round2(costoBase * 0.12 + 8);
  }

  const totale = round2(Object.values(addebiti).reduce((a, b) => a + b, 0));

  return {
    vettore: vettore.nome,
    regione: input.regione,
    peso_tassabile: peso_t,
    tariffa_quintale: tariffa_q,
    addebiti,
    costo_totale: totale,
  };
}

export function calcolaTutti(input: CalcoloInput): CalcolaTariffaResponse[] {
  return VETTORI.map((v) => calcolaTariffa(v, input));
}

export function calcolaCostoCliente(
  costoMigliore: number,
  codiceDeposito: string,
): { deposito: string; markupPct: number; costoCliente: number } | null {
  const dep = DEPOSITI_MOCK[codiceDeposito];
  if (!dep) return null;
  const costoCliente = round2(costoMigliore * (1 + dep.markupPct / 100));
  return { deposito: dep.nome, markupPct: dep.markupPct, costoCliente };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

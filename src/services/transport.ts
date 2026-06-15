// Mock service per il calcolo del costo di trasporto.
// In futuro qui verrà chiamato il backend reale.
// NOTA: tutti i prezzi sono iva esclusa.

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

// Tariffario "generico" usato sia per i vettori che per i contratti cliente.
export type Tariffario = {
  baseQuintale: Record<Regione, number>; // €/q (nolo)
  dirittoFisso: number;
  supplementoCarburantePct: number; // % sul nolo
  variazioneIstatPct: number; // % sul nolo
  // sovrapprezzi unitari per opzione
  costoSponda: number;
  costoEspressaPct: number;
  costoTelefonica: number;
  costoTassativa: number;
  costoMezzoPiccolo: number;
  costoFacchinaggioPerKg: number;
  costoAllRiskPct: number; // % sul valore assicurato
  costoDisagiataPct: number; // % sul nolo
  costoDisagiataFlat: number;
};

export type Vettore = {
  id: string;
  nome: string;
  tariffario: Tariffario;
};

function buildBase(min: number, max: number): Record<Regione, number> {
  const map = {} as Record<Regione, number>;
  REGIONI_ITALIANE.forEach((r, i) => {
    const t = i / (REGIONI_ITALIANE.length - 1);
    map[r] = Math.round((min + (max - min) * t) * 100) / 100;
  });
  return map;
}

export const VETTORI: Vettore[] = [
  {
    id: "arco",
    nome: "Arco Spedizioni",
    tariffario: {
      baseQuintale: buildBase(14, 38),
      dirittoFisso: 4.5,
      supplementoCarburantePct: 7.5,
      variazioneIstatPct: 2.1,
      costoSponda: 18,
      costoEspressaPct: 15,
      costoTelefonica: 4,
      costoTassativa: 12,
      costoMezzoPiccolo: 25,
      costoFacchinaggioPerKg: 0.08,
      costoAllRiskPct: 0.4,
      costoDisagiataPct: 12,
      costoDisagiataFlat: 8,
    },
  },
  {
    id: "susa",
    nome: "Susa Trasporti",
    tariffario: {
      baseQuintale: buildBase(15.5, 35),
      dirittoFisso: 5.2,
      supplementoCarburantePct: 6.8,
      variazioneIstatPct: 2.5,
      costoSponda: 20,
      costoEspressaPct: 14,
      costoTelefonica: 4.5,
      costoTassativa: 13,
      costoMezzoPiccolo: 28,
      costoFacchinaggioPerKg: 0.09,
      costoAllRiskPct: 0.45,
      costoDisagiataPct: 11,
      costoDisagiataFlat: 10,
    },
  },
];

// Depositi mock: ogni deposito ha il proprio tariffario contrattuale (prezzi cliente).
export type Deposito = {
  codice: string;
  nome: string;
  tariffario: Tariffario;
};

export const DEPOSITI_MOCK: Record<string, Deposito> = {
  "001": {
    codice: "001",
    nome: "Cliente Rossi SRL",
    tariffario: {
      baseQuintale: buildBase(20, 52),
      dirittoFisso: 6.5,
      supplementoCarburantePct: 9.5,
      variazioneIstatPct: 2.8,
      costoSponda: 25,
      costoEspressaPct: 18,
      costoTelefonica: 6,
      costoTassativa: 18,
      costoMezzoPiccolo: 35,
      costoFacchinaggioPerKg: 0.12,
      costoAllRiskPct: 0.55,
      costoDisagiataPct: 14,
      costoDisagiataFlat: 12,
    },
  },
  "002": {
    codice: "002",
    nome: "Bianchi Logistica",
    tariffario: {
      baseQuintale: buildBase(18, 48),
      dirittoFisso: 6,
      supplementoCarburantePct: 9,
      variazioneIstatPct: 2.5,
      costoSponda: 22,
      costoEspressaPct: 17,
      costoTelefonica: 5,
      costoTassativa: 16,
      costoMezzoPiccolo: 32,
      costoFacchinaggioPerKg: 0.11,
      costoAllRiskPct: 0.5,
      costoDisagiataPct: 13,
      costoDisagiataFlat: 10,
    },
  },
  "010": {
    codice: "010",
    nome: "Verdi & Co",
    tariffario: {
      baseQuintale: buildBase(22, 56),
      dirittoFisso: 7,
      supplementoCarburantePct: 10,
      variazioneIstatPct: 3,
      costoSponda: 28,
      costoEspressaPct: 20,
      costoTelefonica: 7,
      costoTassativa: 20,
      costoMezzoPiccolo: 38,
      costoFacchinaggioPerKg: 0.14,
      costoAllRiskPct: 0.6,
      costoDisagiataPct: 15,
      costoDisagiataFlat: 14,
    },
  },
};

export function pesoTassabile(pesoKg: number): number {
  if (pesoKg <= 0) return 0;
  return Math.ceil(pesoKg / 50) * 50;
}

function isCapDisagiato(cap?: string): boolean {
  if (!cap) return false;
  const n = parseInt(cap, 10);
  if (isNaN(n)) return false;
  return (n >= 7000 && n <= 9999) || (n >= 90000 && n <= 98168);
}

function calcolaSuTariffario(
  nome: string,
  tariffario: Tariffario,
  input: CalcoloInput,
): CalcolaTariffaResponse {
  const peso_t = pesoTassabile(input.pesoKg);
  const tariffa_q = tariffario.baseQuintale[input.regione];
  const quintali = peso_t / 100;
  const nolo = round2(tariffa_q * quintali);

  const addebiti: Record<string, number> = {
    Nolo: nolo,
    "Diritto fisso": tariffario.dirittoFisso,
    "Supplemento carburante": round2(nolo * (tariffario.supplementoCarburantePct / 100)),
    "Variazione ISTAT": round2(nolo * (tariffario.variazioneIstatPct / 100)),
  };

  const o = input.opzioni;
  if (o.sponda) addebiti["Consegna con sponda"] = tariffario.costoSponda;
  if (o.espressa) addebiti["Consegna espressa"] = round2(nolo * (tariffario.costoEspressaPct / 100));
  if (o.telefonica) addebiti["Prenotazione telefonica"] = tariffario.costoTelefonica;
  if (o.tassativa) addebiti["Consegna tassativa"] = tariffario.costoTassativa;
  if (o.mezzoPiccolo) addebiti["Mezzo piccolo"] = tariffario.costoMezzoPiccolo;
  if (o.facchinaggio) addebiti["Facchinaggio"] = round2(peso_t * tariffario.costoFacchinaggioPerKg);
  if (o.allRisk && o.valoreAssicurato && o.valoreAssicurato > 0) {
    addebiti["Assicurazione All Risk"] = round2(
      o.valoreAssicurato * (tariffario.costoAllRiskPct / 100),
    );
  }
  if (isCapDisagiato(input.cap)) {
    addebiti["Località disagiata"] = round2(
      nolo * (tariffario.costoDisagiataPct / 100) + tariffario.costoDisagiataFlat,
    );
  }

  const totale = round2(Object.values(addebiti).reduce((a, b) => a + b, 0));

  return {
    vettore: nome,
    regione: input.regione,
    peso_tassabile: peso_t,
    tariffa_quintale: tariffa_q,
    addebiti,
    costo_totale: totale,
  };
}

export function calcolaTariffa(
  vettore: Vettore,
  input: CalcoloInput,
): CalcolaTariffaResponse {
  return calcolaSuTariffario(vettore.nome, vettore.tariffario, input);
}

export function calcolaTutti(input: CalcoloInput): CalcolaTariffaResponse[] {
  return VETTORI.map((v) => calcolaTariffa(v, input));
}

export type CostoClienteDettaglio = {
  deposito: Deposito;
  dettaglio: CalcolaTariffaResponse;
};

export function calcolaCostoClienteDettaglio(
  input: CalcoloInput,
): CostoClienteDettaglio | null {
  const codice = input.codiceDeposito?.trim();
  if (!codice) return null;
  const dep = DEPOSITI_MOCK[codice];
  if (!dep) return null;
  const dettaglio = calcolaSuTariffario(dep.nome, dep.tariffario, input);
  return { deposito: dep, dettaglio };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

import {
  FileText,
  ClipboardCheck,
  Send,
  Tag,
  Radio,
  LayoutDashboard,
  LifeBuoy,
  Users,
  Inbox,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { AppRole } from "@/types/auth";

export type ModuleStatus = "active" | "coming_soon";

export interface ModuleDef {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  to: string;
  status: ModuleStatus;
  /** Ruoli abilitati. Vuoto = tutti gli utenti autenticati. */
  roles?: AppRole[];
}

/** Moduli operativi (visibili in home + sidebar). */
export const MODULES: ModuleDef[] = [
  {
    id: "fatturazione",
    label: "Fatturazione",
    description: "Genera fatture per periodo e deposito",
    icon: FileText,
    to: "/fatturazione",
    status: "active",
  },
  {
    id: "nuovo-costo-trasporto",
    label: "Nuovo costo trasporto",
    description: "Calcola il costo di un trasporto per regione e deposito",
    icon: Truck,
    to: "/nuovo-costo-trasporto",
    status: "active",
  },
  {
    id: "controllo-fatture",
    label: "Controllo Fatture",
    description: "Verifica fatture emesse",
    icon: ClipboardCheck,
    to: "/controllo-fatture",
    status: "coming_soon",
  },
  {
    id: "invio-documenti",
    label: "Invio Documenti",
    description: "Invio documenti a clienti / fornitori",
    icon: Send,
    to: "/invio-documenti",
    status: "coming_soon",
  },
  {
    id: "etichette-corrieri",
    label: "Etichette Corrieri",
    description: "Stampa etichette per spedizioni",
    icon: Tag,
    to: "/etichette-corrieri",
    status: "coming_soon",
  },
  {
    id: "invio-telematico",
    label: "Invio Telematico",
    description: "Trasmissione telematica documenti",
    icon: Radio,
    to: "/invio-telematico",
    status: "coming_soon",
  },
];

/** Voci di navigazione principali (sopra ai moduli). */
export const TOP_NAV = {
  id: "home",
  label: "Home",
  icon: LayoutDashboard,
  to: "/",
};

/** Voci nella sezione "Amministrazione" (solo admin). */
export const ADMIN_NAV: ModuleDef[] = [
  {
    id: "admin-utenti",
    label: "Gestione utenti",
    description: "Crea e gestisci gli utenti",
    icon: Users,
    to: "/admin/utenti",
    status: "active",
    roles: ["admin"],
  },
  {
    id: "admin-supporto",
    label: "Richieste supporto",
    description: "Visualizza le richieste ricevute",
    icon: Inbox,
    to: "/admin/supporto",
    status: "active",
    roles: ["admin"],
  },
];

export const SUPPORT_NAV = {
  id: "supporto",
  label: "Supporto",
  icon: LifeBuoy,
  to: "/supporto",
};

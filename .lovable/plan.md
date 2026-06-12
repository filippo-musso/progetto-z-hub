
# Piano — Web App Aziendale Modulare

## Obiettivo
Frontend di una web app aziendale modulare con login, dashboard a sidebar e moduli (si parte da Fatturazione). Backend di prova su Lovable Cloud, ma tutto il codice di accesso ai dati sarà isolato in un **service layer** sostituibile con le tue API quando porterai il tutto sul tuo server.

## Identità visiva
- Logo: il tuo `Logo_Blue.png` (caricato come asset).
- Palette "Navy professionale": bianco/grigio chiaro + blu logo (#1e4a8c) come primario, navy scuro (#0f1b3d) per testi/header.
- Tipografia: Inter (UI pulita, leggibile, business).
- Interfaccia in italiano, ma con i18n predisposto.

## Layout
- **Sidebar laterale fissa** a sinistra, comprimibile (icon-only).
  - Logo in alto, voce "Home" sempre in cima, lista moduli, in fondo profilo/logout e voce "Supporto".
  - Sezione "Amministrazione" visibile solo agli admin.
- **Header** in alto con: titolo modulo corrente, breadcrumb, toggle sidebar, menu utente.
- **Contenuto** a destra: schermata del modulo selezionato.

## Schermata Home (richiamabile sempre)
È la pagina di atterraggio dopo il login e raggiungibile in qualsiasi momento (logo sidebar + voce "Home"). Struttura pensata per crescere:
- **Header di benvenuto**: saluto con nome utente, ruolo, data e ora correnti (live).
- **Area widget** (griglia responsive, oggi con placeholder pronti per essere riempiti in futuro):
  - Widget "Informazioni utente" (nome, ruolo, ultimo accesso)
  - Widget "Data e ora"
  - Slot per widget statistiche futuri (es. fatture del mese, spedizioni, ecc.) — mostrati come card "Disponibile a breve" finché non li implementiamo.
- **Griglia moduli**: tutte le card dei moduli aziendali.
  - Moduli **attivi**: cliccabili, colorati, con icona e descrizione → portano al modulo.
  - Moduli **in costruzione**: card disabilitate (grigie, cursore not-allowed, badge "In costruzione"), non cliccabili.
- **Box Supporto** in fondo alla home + voce dedicata in sidebar:
  - Form di contatto (oggetto, messaggio, eventuale allegato in futuro) che invia una richiesta al backend.
  - Recapiti (email/telefono) configurabili.
  - Le richieste sono salvate (tabella `support_requests`) e visibili agli admin.

## Autenticazione
- Pagina `/auth` con form **username + password**.
- Sessione persistente, logout, cambio password.
- Pagine protette sotto `_authenticated/` (redirect a `/auth` se non loggato).
- Ruoli: `admin`, `ufficio`, `magazzino`, `cliente` (estendibile). Tabella `user_roles` separata + funzione `has_role`. Permessi per modulo li decideremo modulo per modulo.

## Modulo Fatturazione (primo modulo reale)
Form "Avvia fatturazione" con:
- Data inizio, Data fine
- Numero deposito (opzionale; vuoto = tutti)
- Addebiti aggiuntivi divisi in **Trasporto** e **Logistica** (righe descrizione + importo, aggiungi/rimuovi)
- Pulsante **"Avvia Fatturazione"**

Comportamento:
- Chiama l'endpoint backend (mock su Lovable Cloud per ora) che simula il processo e restituisce un log.
- Mostra stato job (in corso / completato / errore) con spinner.
- Pannello **log** scrollabile + copia/download.
- **Cronologia esecuzioni** con stato, data, riapertura log.

Tutto l'I/O passa da `src/services/invoicing.ts` → quando passerete al vostro backend basterà cambiare l'implementazione.

## Altri moduli (in costruzione, non cliccabili)
Visibili in sidebar (disabilitati con badge) e in home come card disabilitate:
- Controllo Fatture
- Invio Documenti
- Etichette Corrieri
- Invio Telematico

## Area Amministrazione (solo admin)
- Gestione utenti (crea, modifica, disattiva, reset password)
- Assegnazione ruoli
- Richieste di supporto ricevute
- (in seguito) log di sistema, impostazioni globali

## Migrabilità al tuo backend
Tutto l'I/O verso il backend passa da `src/services/*.ts`:
- Una funzione per ogni operazione (`login`, `startInvoicing`, `listUsers`, `sendSupportRequest`, ecc.).
- Tipi TypeScript condivisi in `src/types/`.
- Base URL via `VITE_API_BASE_URL`.
- Versione demo: usa Lovable Cloud; produzione: cambi solo l'interno delle funzioni, le firme restano identiche.

## Dettagli tecnici
- Stack: TanStack Start + React + Tailwind v4 + shadcn/ui.
- Sidebar: `shadcn/sidebar` collassabile.
- Routing: `_authenticated/index.tsx` (Home), `_authenticated/fatturazione.tsx`, placeholder per gli altri, `_authenticated/supporto.tsx`, `_authenticated/admin/utenti.tsx`, `_authenticated/admin/supporto.tsx`.
- Tabelle DB (Lovable Cloud): `profiles`, `user_roles`, `invoicing_jobs`, `support_requests`.
- i18n: `src/i18n/it.ts` + helper `t("chiave")`, pronto per altre lingue.
- Definizione moduli centralizzata in `src/config/modules.ts` (id, label, icona, route, ruoli abilitati, `status: "active" | "coming_soon"`) → sidebar e home leggono da qui, così aggiungere/abilitare un modulo è una sola riga.

## Fase 1 — cosa costruisco
1. Tema (palette navy, logo, Inter) + i18n IT.
2. Auth username/password + ruoli + `/auth`.
3. Shell sidebar + header.
4. Home con widget base (utente, data/ora), griglia moduli (attivi vs in costruzione), box supporto.
5. Modulo Fatturazione completo (form + job + log + cronologia) con backend mock.
6. Pagina Supporto (form di contatto) + vista admin delle richieste.
7. Admin "Gestione utenti" base.

## Fuori scope ora
- Logica reale di fatturazione/Excel (sta sul tuo backend).
- Integrazioni corrieri, SDI.
- Widget statistiche reali (slot pronti, dati veri arriveranno coi prossimi moduli).
- Permessi fini per modulo (definiti insieme quando costruiamo ciascun modulo).

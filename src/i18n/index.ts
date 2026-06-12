import { it, type Dict } from "./it";

// Helper minimalista: t("auth.title") → stringa.
// In futuro: switch lingua / fallback / interpolazione.
const dict: Dict = it;

type Path<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends object
    ? Path<T[K], `${P}${P extends "" ? "" : "."}${K}`>
    : `${P}${P extends "" ? "" : "."}${K}`;
}[keyof T & string];

export type TKey = Path<Dict>;

export function t(key: TKey): string {
  const parts = key.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in cur) cur = cur[p];
    else return key;
  }
  return typeof cur === "string" ? cur : key;
}

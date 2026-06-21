import * as React from "react";
import { cn } from "@/lib/utils";

export type NumberInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange"
> & {
  value: number | string | null | undefined;
  onChange?: (value: number | null) => void;
  allowNegative?: boolean;
};

function toDisplay(v: number | string | null | undefined): string {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "number") {
    return Number.isFinite(v) ? String(v).replace(".", ",") : "";
  }
  return String(v).replace(".", ",");
}

function parse(s: string): number | null {
  const cleaned = s.replace(",", ".").trim();
  if (cleaned === "" || cleaned === "-" || cleaned === "." || cleaned === "-.") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * NumberInput — campo numerico standard del progetto.
 * - Niente freccette su/giù (è un text input con inputMode="decimal").
 * - Al focus seleziona tutto il contenuto.
 * - Il punto viene convertito automaticamente in virgola (decimale italiano).
 * - Accetta solo cifre, separatore decimale e opzionalmente il segno meno.
 * Da usare SEMPRE al posto di `<Input type="number" />`.
 */
export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    { className, value, onChange, allowNegative = false, onFocus, onBlur, onKeyDown, ...props },
    ref,
  ) => {
    const [text, setText] = React.useState<string>(() => toDisplay(value));
    const focusedRef = React.useRef(false);

    React.useEffect(() => {
      if (!focusedRef.current) setText(toDisplay(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value.replace(/\./g, ",");
      const allowedRe = allowNegative ? /[^0-9,\-]/g : /[^0-9,]/g;
      raw = raw.replace(allowedRe, "");
      const firstComma = raw.indexOf(",");
      if (firstComma !== -1) {
        raw =
          raw.slice(0, firstComma + 1) +
          raw.slice(firstComma + 1).replace(/,/g, "");
      }
      if (allowNegative) {
        const neg = raw.startsWith("-");
        raw = (neg ? "-" : "") + raw.replace(/-/g, "");
      }
      setText(raw);
      onChange?.(parse(raw));
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onChange={handleChange}
        onFocus={(e) => {
          focusedRef.current = true;
          // select all so typing replaces previous value
          requestAnimationFrame(() => {
            try {
              e.target.select();
            } catch {
              /* noop */
            }
          });
          onFocus?.(e);
        }}
        onBlur={(e) => {
          focusedRef.current = false;
          setText(toDisplay(parse(text)));
          onBlur?.(e);
        }}
        onKeyDown={onKeyDown}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        {...props}
      />
    );
  },
);
NumberInput.displayName = "NumberInput";


CREATE TABLE public.additional_charges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('transport','logistics')),
  charge_date DATE NOT NULL,
  sign TEXT NOT NULL CHECK (sign IN ('debit','credit')),
  item TEXT NOT NULL,
  unit_price NUMERIC(12,4) NOT NULL DEFAULT 0,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 1,
  total NUMERIC(14,4) NOT NULL DEFAULT 0,
  istat BOOLEAN NOT NULL DEFAULT false,
  deposit_number TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.additional_charges TO authenticated;
GRANT ALL ON public.additional_charges TO service_role;

ALTER TABLE public.additional_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Addebiti: utente vede i propri" ON public.additional_charges
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Addebiti: admin vede tutti" ON public.additional_charges
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Addebiti: utente crea i propri" ON public.additional_charges
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Addebiti: utente aggiorna i propri" ON public.additional_charges
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Addebiti: admin aggiorna" ON public.additional_charges
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Addebiti: utente elimina i propri" ON public.additional_charges
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Addebiti: admin elimina" ON public.additional_charges
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER additional_charges_set_updated_at
  BEFORE UPDATE ON public.additional_charges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_additional_charges_date ON public.additional_charges (charge_date);
CREATE INDEX idx_additional_charges_deposit ON public.additional_charges (deposit_number);

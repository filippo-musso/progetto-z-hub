CREATE TABLE public.charge_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.charge_items TO authenticated;
GRANT ALL ON public.charge_items TO service_role;

ALTER TABLE public.charge_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read charge items"
  ON public.charge_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert charge items"
  ON public.charge_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Seed initial items
INSERT INTO public.charge_items (name) VALUES
  ('Scansione'),('Imballaggio'),('Preventivo'),('Riconsegna'),('Ritiro'),
  ('Etichettatura'),('Picking'),('Stoccaggio'),('Movimentazione'),('Pallet'),
  ('Documentazione doganale'),('Assicurazione merce'),('Sosta'),
  ('Facchinaggio'),('Sponda idraulica')
ON CONFLICT (name) DO NOTHING;
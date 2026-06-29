CREATE TABLE IF NOT EXISTS public.edi_import_lines (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ean            text NOT NULL,
  fournisseur_id int,
  prix_achat     numeric(10,4),
  stock          int,
  date_reappro   text,
  ref_fseur      text,
  source_file    text,
  imported_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edi_import_lines_ean ON edi_import_lines(ean);
CREATE INDEX IF NOT EXISTS idx_edi_import_lines_imported_at ON edi_import_lines(imported_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.edi_import_lines TO authenticated;
GRANT ALL ON public.edi_import_lines TO service_role;
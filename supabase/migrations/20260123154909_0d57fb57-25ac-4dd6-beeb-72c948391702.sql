-- Table pour l'historique des propositions exportées
CREATE TABLE public.proposal_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  client_name TEXT,
  template_id UUID REFERENCES public.pdf_templates(id) ON DELETE SET NULL,
  template_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  row_count INTEGER DEFAULT 0,
  options_count INTEGER DEFAULT 0,
  pdf_html_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS pour accès public (pas d'auth dans ce projet)
ALTER TABLE public.proposal_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read proposal_exports" 
ON public.proposal_exports FOR SELECT USING (true);

CREATE POLICY "Public insert proposal_exports" 
ON public.proposal_exports FOR INSERT WITH CHECK (true);

CREATE POLICY "Public delete proposal_exports" 
ON public.proposal_exports FOR DELETE USING (true);

-- Index pour performance
CREATE INDEX idx_proposal_exports_created_at ON public.proposal_exports(created_at DESC);
-- Créer une table pour stocker les templates PDF
CREATE TABLE public.pdf_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer une table pour les versions de template
CREATE TABLE public.template_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.pdf_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'publie', 'archive')),
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(template_id, version_number)
);

-- Enable Row Level Security (accès public en lecture pour tous)
ALTER TABLE public.pdf_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_versions ENABLE ROW LEVEL SECURITY;

-- Politique : tout le monde peut lire les templates
CREATE POLICY "Templates are publicly readable"
ON public.pdf_templates
FOR SELECT
USING (true);

-- Politique : tout le monde peut lire les versions
CREATE POLICY "Template versions are publicly readable"
ON public.template_versions
FOR SELECT
USING (true);

-- Politique : tout le monde peut créer/modifier/supprimer les templates (mode admin simplifié)
CREATE POLICY "Anyone can insert templates"
ON public.pdf_templates
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update templates"
ON public.pdf_templates
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete templates"
ON public.pdf_templates
FOR DELETE
USING (true);

-- Politique : tout le monde peut créer/modifier/supprimer les versions
CREATE POLICY "Anyone can insert versions"
ON public.template_versions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update versions"
ON public.template_versions
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete versions"
ON public.template_versions
FOR DELETE
USING (true);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_pdf_templates_updated_at
BEFORE UPDATE ON public.pdf_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
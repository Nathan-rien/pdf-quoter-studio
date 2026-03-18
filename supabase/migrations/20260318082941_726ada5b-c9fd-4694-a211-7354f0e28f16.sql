
-- Ajouter sort_order aux projets
ALTER TABLE public.gantt_projects ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Initialiser les sort_order existants
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) * 10 AS rn
  FROM public.gantt_projects
)
UPDATE public.gantt_projects SET sort_order = numbered.rn FROM numbered WHERE gantt_projects.id = numbered.id;

-- Table jalons
CREATE TABLE public.gantt_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.gantt_projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  date date NOT NULL,
  description text,
  status public.gantt_status NOT NULL DEFAULT 'not_started',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gantt_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read gantt_milestones"
  ON public.gantt_milestones FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert gantt_milestones"
  ON public.gantt_milestones FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update gantt_milestones"
  ON public.gantt_milestones FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete gantt_milestones"
  ON public.gantt_milestones FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.gantt_milestones;

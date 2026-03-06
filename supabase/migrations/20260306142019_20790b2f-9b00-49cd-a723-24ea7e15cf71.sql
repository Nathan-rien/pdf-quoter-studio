
-- Enums
CREATE TYPE public.gantt_status AS ENUM ('not_started', 'in_progress', 'done');
CREATE TYPE public.gantt_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.gantt_dependency_type AS ENUM ('finish_to_start', 'start_to_start');

-- Projects
CREATE TABLE public.gantt_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  owner text,
  status gantt_status NOT NULL DEFAULT 'not_started',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gantt_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read gantt_projects" ON public.gantt_projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert gantt_projects" ON public.gantt_projects FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update gantt_projects" ON public.gantt_projects FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete gantt_projects" ON public.gantt_projects FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Tasks
CREATE TABLE public.gantt_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.gantt_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status gantt_status NOT NULL DEFAULT 'not_started',
  priority gantt_priority NOT NULL DEFAULT 'medium',
  owner text,
  sort_order integer NOT NULL DEFAULT 0
);
ALTER TABLE public.gantt_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read gantt_tasks" ON public.gantt_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert gantt_tasks" ON public.gantt_tasks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update gantt_tasks" ON public.gantt_tasks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete gantt_tasks" ON public.gantt_tasks FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Subtasks
CREATE TABLE public.gantt_subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.gantt_tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status gantt_status NOT NULL DEFAULT 'not_started',
  sort_order integer NOT NULL DEFAULT 0
);
ALTER TABLE public.gantt_subtasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read gantt_subtasks" ON public.gantt_subtasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert gantt_subtasks" ON public.gantt_subtasks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update gantt_subtasks" ON public.gantt_subtasks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete gantt_subtasks" ON public.gantt_subtasks FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Dependencies
CREATE TABLE public.gantt_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_task_id uuid NOT NULL REFERENCES public.gantt_tasks(id) ON DELETE CASCADE,
  target_task_id uuid NOT NULL REFERENCES public.gantt_tasks(id) ON DELETE CASCADE,
  dependency_type gantt_dependency_type NOT NULL DEFAULT 'finish_to_start',
  UNIQUE(source_task_id, target_task_id)
);
ALTER TABLE public.gantt_dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read gantt_dependencies" ON public.gantt_dependencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert gantt_dependencies" ON public.gantt_dependencies FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update gantt_dependencies" ON public.gantt_dependencies FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete gantt_dependencies" ON public.gantt_dependencies FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.gantt_projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gantt_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gantt_subtasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gantt_dependencies;

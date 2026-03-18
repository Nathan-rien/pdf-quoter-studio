-- Make milestone_id nullable (projects no longer depend on axes)
ALTER TABLE public.gantt_projects ALTER COLUMN milestone_id DROP NOT NULL;

-- Add global_sort_order to all 4 gantt tables
ALTER TABLE public.gantt_milestones ADD COLUMN IF NOT EXISTS global_sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.gantt_projects ADD COLUMN IF NOT EXISTS global_sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.gantt_tasks ADD COLUMN IF NOT EXISTS global_sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.gantt_subtasks ADD COLUMN IF NOT EXISTS global_sort_order integer NOT NULL DEFAULT 0;

-- Initialize global_sort_order from existing sort_order values
UPDATE public.gantt_milestones SET global_sort_order = sort_order WHERE global_sort_order = 0;
UPDATE public.gantt_projects SET global_sort_order = sort_order + 1000 WHERE global_sort_order = 0;
UPDATE public.gantt_tasks SET global_sort_order = sort_order + 2000 WHERE global_sort_order = 0;
UPDATE public.gantt_subtasks SET global_sort_order = sort_order + 3000 WHERE global_sort_order = 0;
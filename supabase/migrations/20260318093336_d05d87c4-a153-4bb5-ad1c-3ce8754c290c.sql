ALTER TABLE public.gantt_projects
ALTER COLUMN milestone_id SET NOT NULL;

ALTER TABLE public.gantt_milestones
DROP COLUMN project_id;
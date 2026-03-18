-- Make project_id nullable on milestones (milestone becomes root element)
ALTER TABLE gantt_milestones ALTER COLUMN project_id DROP NOT NULL;

-- Add milestone_id to projects (project belongs to milestone)
ALTER TABLE gantt_projects ADD COLUMN milestone_id uuid REFERENCES gantt_milestones(id) ON DELETE SET NULL;
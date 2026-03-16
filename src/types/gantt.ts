export type GanttStatus = 'not_started' | 'in_progress' | 'done';
export type GanttPriority = 'low' | 'medium' | 'high' | 'critical';
export type GanttDependencyType = 'finish_to_start' | 'start_to_start';
export type ZoomLevel = 'day' | 'week' | 'month' | 'year';

export interface GanttProject {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  owner: string | null;
  status: GanttStatus;
  created_by: string | null;
  created_at: string;
}

export interface GanttTask {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: GanttStatus;
  priority: GanttPriority;
  owner: string | null;
  sort_order: number;
}

export interface GanttSubtask {
  id: string;
  task_id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: GanttStatus;
  sort_order: number;
}

export interface GanttDependency {
  id: string;
  source_task_id: string;
  target_task_id: string;
  dependency_type: GanttDependencyType;
}

export interface GanttRow {
  type: 'project' | 'task' | 'subtask';
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: GanttStatus;
  priority?: GanttPriority;
  owner?: string | null;
  projectId?: string;
  taskId?: string;
  depth: number;
}

export const STATUS_LABELS: Record<GanttStatus, string> = {
  not_started: 'À lancer',
  in_progress: 'En cours',
  done: 'Terminé',
};

export const PRIORITY_LABELS: Record<GanttPriority, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  critical: 'Critique',
};

import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STATUS_LABELS, PRIORITY_LABELS } from '@/types/gantt';
import type { GanttRow } from '@/types/gantt';
import { Badge } from '@/components/ui/badge';

interface GanttSidebarProps {
  rows: GanttRow[];
  expandedProjects: Set<string>;
  expandedTasks: Set<string>;
  onToggleProject: (id: string) => void;
  onToggleTask: (id: string) => void;
  onEditProject: (id: string) => void;
  onEditTask: (id: string) => void;
  onEditSubtask: (id: string) => void;
  onAddTask: (projectId: string) => void;
  onAddSubtask: (taskId: string) => void;
  onDeleteProject: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onDeleteSubtask: (id: string) => void;
}

const ROW_HEIGHT = 40;

const statusColor = (status: string) => {
  switch (status) {
    case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'done': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default: return 'bg-muted text-muted-foreground';
  }
};

export function GanttSidebar({
  rows, expandedProjects, expandedTasks,
  onToggleProject, onToggleTask,
  onEditProject, onEditTask, onEditSubtask,
  onAddTask, onAddSubtask,
  onDeleteProject, onDeleteTask, onDeleteSubtask,
}: GanttSidebarProps) {
  return (
    <div className="w-72 min-w-72 border-r border-border flex-shrink-0 overflow-y-auto">
      <div className="h-10 border-b border-border flex items-center px-3 bg-muted/50">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Projets / Tâches</span>
      </div>
      {rows.length === 0 && (
        <div className="p-4 text-sm text-muted-foreground text-center">
          Aucun projet. Créez-en un pour commencer.
        </div>
      )}
      {rows.map((row) => (
        <div
          key={`${row.type}-${row.id}`}
          className={cn(
            'flex items-center gap-1 px-2 border-b border-border/50 group hover:bg-accent/50 transition-colors',
            row.type === 'project' && 'bg-muted/30 font-medium',
          )}
          style={{ height: ROW_HEIGHT, paddingLeft: 8 + row.depth * 20 }}
        >
          {/* Expand toggle */}
          {(row.type === 'project' || row.type === 'task') ? (
            <button
              className="p-0.5 rounded hover:bg-accent"
              onClick={() => row.type === 'project' ? onToggleProject(row.id) : onToggleTask(row.id)}
            >
              {(row.type === 'project' ? expandedProjects.has(row.id) : expandedTasks.has(row.id))
                ? <ChevronDown className="h-3.5 w-3.5" />
                : <ChevronRight className="h-3.5 w-3.5" />
              }
            </button>
          ) : <span className="w-5" />}

          {/* Color dot */}
          <span className={cn(
            'w-2 h-2 rounded-full flex-shrink-0',
            row.type === 'project' ? 'bg-blue-500' : row.type === 'task' ? 'bg-violet-500' : 'bg-amber-500'
          )} />

          <span className="text-sm truncate flex-1">{row.title}</span>

          <Badge variant="outline" className={cn('text-[10px] px-1 py-0 h-4 hidden group-hover:flex', statusColor(row.status))}>
            {STATUS_LABELS[row.status]}
          </Badge>

          {/* Actions */}
          <div className="hidden group-hover:flex items-center gap-0.5">
            {row.type === 'project' && (
              <Button variant="ghost" size="iconSm" className="h-5 w-5" onClick={() => onAddTask(row.id)}>
                <Plus className="h-3 w-3" />
              </Button>
            )}
            {row.type === 'task' && (
              <Button variant="ghost" size="iconSm" className="h-5 w-5" onClick={() => onAddSubtask(row.id)}>
                <Plus className="h-3 w-3" />
              </Button>
            )}
            <Button variant="ghost" size="iconSm" className="h-5 w-5" onClick={() => {
              if (row.type === 'project') onEditProject(row.id);
              else if (row.type === 'task') onEditTask(row.id);
              else onEditSubtask(row.id);
            }}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="iconSm" className="h-5 w-5 text-destructive" onClick={() => {
              if (row.type === 'project') onDeleteProject(row.id);
              else if (row.type === 'task') onDeleteTask(row.id);
              else onDeleteSubtask(row.id);
            }}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

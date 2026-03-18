import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, Diamond, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STATUS_LABELS } from '@/types/gantt';
import type { GanttRow } from '@/types/gantt';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable, type DropResult, type DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';

interface GanttSidebarProps {
  rows: GanttRow[];
  expandedMilestones: Set<string>;
  expandedProjects: Set<string>;
  expandedTasks: Set<string>;
  onToggleMilestone: (id: string) => void;
  onToggleProject: (id: string) => void;
  onToggleTask: (id: string) => void;
  onEditMilestone: (id: string) => void;
  onEditProject: (id: string) => void;
  onEditTask: (id: string) => void;
  onEditSubtask: (id: string) => void;
  onAddProject: (milestoneId: string) => void;
  onAddTask: (projectId: string) => void;
  onAddSubtask: (taskId: string) => void;
  onDeleteMilestone: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onDeleteSubtask: (id: string) => void;
  getOwnerName: (id: string | null | undefined) => string;
  onDragEnd: (result: DropResult) => void;
  headerHeight: number;
}

const ROW_HEIGHT = 40;

const statusColor = (status: string) => {
  switch (status) {
    case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'done': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default: return 'bg-muted text-muted-foreground';
  }
};

function RowContent({
  row,
  dragHandleProps,
  isDraggable,
  expandedMilestones, expandedProjects, expandedTasks,
  onToggleMilestone, onToggleProject, onToggleTask,
  onEditMilestone, onEditProject, onEditTask, onEditSubtask,
  onAddProject, onAddTask, onAddSubtask,
  onDeleteMilestone, onDeleteProject, onDeleteTask, onDeleteSubtask,
  getOwnerName,
}: {
  row: GanttRow;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  isDraggable?: boolean;
  expandedMilestones: Set<string>;
  expandedProjects: Set<string>;
  expandedTasks: Set<string>;
  onToggleMilestone: (id: string) => void;
  onToggleProject: (id: string) => void;
  onToggleTask: (id: string) => void;
  onEditMilestone: (id: string) => void;
  onEditProject: (id: string) => void;
  onEditTask: (id: string) => void;
  onEditSubtask: (id: string) => void;
  onAddProject: (milestoneId: string) => void;
  onAddTask: (projectId: string) => void;
  onAddSubtask: (taskId: string) => void;
  onDeleteMilestone: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onDeleteSubtask: (id: string) => void;
  getOwnerName: (id: string | null | undefined) => string;
}) {
  const ownerName = getOwnerName(row.owner);

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 border-b border-border/50 group hover:bg-accent/50 transition-colors',
        row.type === 'milestone' && 'bg-orange-50/30 dark:bg-orange-950/20 font-medium',
        row.type === 'project' && 'bg-muted/30',
      )}
      style={{ height: ROW_HEIGHT, paddingLeft: 8 + row.depth * 20 }}
    >
      {isDraggable ? (
        <button
          type="button"
          className="p-0.5 rounded hover:bg-accent cursor-grab active:cursor-grabbing"
          {...dragHandleProps}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground/50" />
        </button>
      ) : (
        <span className="w-4" />
      )}

      {(row.type === 'milestone' || row.type === 'project' || row.type === 'task') ? (
        <button
          className="p-0.5 rounded hover:bg-accent"
          onClick={() => {
            if (row.type === 'milestone') onToggleMilestone(row.id);
            else if (row.type === 'project') onToggleProject(row.id);
            else onToggleTask(row.id);
          }}
        >
          {(row.type === 'milestone' ? expandedMilestones.has(row.id) :
            row.type === 'project' ? expandedProjects.has(row.id) :
            expandedTasks.has(row.id))
            ? <ChevronDown className="h-3.5 w-3.5" />
            : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
      ) : <span className="w-5" />}

      {row.type === 'milestone' ? (
        <Diamond className="h-3.5 w-3.5 text-orange-500 fill-orange-500 flex-shrink-0" />
      ) : (
        <span className={cn(
          'w-2 h-2 rounded-full flex-shrink-0',
          row.type === 'project' ? 'bg-blue-500' : row.type === 'task' ? 'bg-violet-500' : 'bg-amber-500',
        )} />
      )}

      <div className="flex flex-col flex-1 min-w-0">
        <span className={cn('text-sm truncate', row.type === 'milestone' && 'font-semibold')}>{row.title}</span>
        {ownerName && (
          <span className="text-[10px] text-muted-foreground truncate">{ownerName}</span>
        )}
        {row.type === 'milestone' && row.date && (
          <span className="text-[10px] text-orange-600 dark:text-orange-400 truncate">{row.date}</span>
        )}
      </div>

      <Badge variant="outline" className={cn('text-[10px] px-1 py-0 h-4 hidden group-hover:flex', statusColor(row.status))}>
        {STATUS_LABELS[row.status]}
      </Badge>

      <div className="hidden group-hover:flex items-center gap-0.5">
        {row.type === 'milestone' && (
          <Button variant="ghost" size="iconSm" className="h-5 w-5" onClick={() => onAddProject(row.id)} title="Ajouter un projet">
            <Plus className="h-3 w-3" />
          </Button>
        )}
        {row.type === 'project' && (
          <Button variant="ghost" size="iconSm" className="h-5 w-5" onClick={() => onAddTask(row.id)} title="Ajouter une tâche">
            <Plus className="h-3 w-3" />
          </Button>
        )}
        {row.type === 'task' && (
          <Button variant="ghost" size="iconSm" className="h-5 w-5" onClick={() => onAddSubtask(row.id)} title="Ajouter une sous-tâche">
            <Plus className="h-3 w-3" />
          </Button>
        )}
        <Button variant="ghost" size="iconSm" className="h-5 w-5" onClick={() => {
          if (row.type === 'milestone') onEditMilestone(row.id);
          else if (row.type === 'project') onEditProject(row.id);
          else if (row.type === 'task') onEditTask(row.id);
          else onEditSubtask(row.id);
        }}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="iconSm" className="h-5 w-5 text-destructive" onClick={() => {
          if (row.type === 'milestone') onDeleteMilestone(row.id);
          else if (row.type === 'project') onDeleteProject(row.id);
          else if (row.type === 'task') onDeleteTask(row.id);
          else onDeleteSubtask(row.id);
        }}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function GanttSidebar({
  rows, expandedMilestones, expandedProjects, expandedTasks,
  onToggleMilestone, onToggleProject, onToggleTask,
  onEditMilestone, onEditProject, onEditTask, onEditSubtask,
  onAddProject, onAddTask, onAddSubtask,
  onDeleteMilestone, onDeleteProject, onDeleteTask, onDeleteSubtask,
  getOwnerName, onDragEnd, headerHeight,
}: GanttSidebarProps) {

  // Build a milestone drag index: only milestones are draggable
  let milestoneIndex = -1;

  const sharedProps = {
    expandedMilestones, expandedProjects, expandedTasks,
    onToggleMilestone, onToggleProject, onToggleTask,
    onEditMilestone, onEditProject, onEditTask, onEditSubtask,
    onAddProject, onAddTask, onAddSubtask,
    onDeleteMilestone, onDeleteProject, onDeleteTask, onDeleteSubtask,
    getOwnerName,
  };

  return (
    <div className="w-72 min-w-72 border-r border-border flex-shrink-0 flex flex-col">
      {/* Header synchronized with timeline */}
      <div
        className="border-b border-border flex items-end px-3 bg-muted/50 flex-shrink-0"
        style={{ height: headerHeight }}
      >
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-2">Jalons / Projets / Tâches</span>
      </div>

      {rows.length === 0 && (
        <div className="p-4 text-sm text-muted-foreground text-center">
          Aucun jalon. Créez-en un pour commencer.
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="milestones-root" type="MILESTONE">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex-1 overflow-y-auto"
            >
              {rows.map((row) => {
                if (row.type === 'milestone') {
                  milestoneIndex++;
                  const currentIdx = milestoneIndex;
                  return (
                    <Draggable
                      key={`milestone-${row.id}`}
                      draggableId={`milestone-${row.id}`}
                      index={currentIdx}
                    >
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={cn(snapshot.isDragging && 'opacity-80 shadow-lg z-50')}
                        >
                          <RowContent
                            row={row}
                            isDraggable
                            dragHandleProps={dragProvided.dragHandleProps}
                            {...sharedProps}
                          />
                        </div>
                      )}
                    </Draggable>
                  );
                }

                // Non-milestone rows: render flat, outside any Draggable
                return (
                  <div key={`${row.type}-${row.id}`}>
                    <RowContent row={row} {...sharedProps} />
                  </div>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

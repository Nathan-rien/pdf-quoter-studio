import { cn } from '@/lib/utils';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STATUS_LABELS } from '@/types/gantt';
import type { GanttRow } from '@/types/gantt';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable, type DropResult, type DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';

interface GanttSidebarProps {
  rows: GanttRow[];
  width: number;
  onEditMilestone: (id: string) => void;
  onEditProject: (id: string) => void;
  onEditTask: (id: string) => void;
  onEditSubtask: (id: string) => void;
  onAddProject: () => void;
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
  row, dragHandleProps,
  onEditMilestone, onEditProject, onEditTask, onEditSubtask,
  onAddProject, onAddTask, onAddSubtask,
  onDeleteMilestone, onDeleteProject, onDeleteTask, onDeleteSubtask,
  getOwnerName,
}: {
  row: GanttRow;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  onEditMilestone: (id: string) => void;
  onEditProject: (id: string) => void;
  onEditTask: (id: string) => void;
  onEditSubtask: (id: string) => void;
  onAddProject: () => void;
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
        row.type === 'milestone' && 'bg-orange-50/50 dark:bg-orange-950/30 border-l-4 border-l-orange-500',
        row.type === 'project' && 'bg-muted/30',
      )}
      style={{ height: ROW_HEIGHT, paddingLeft: row.type === 'milestone' ? 8 : 8 + row.depth * 20 }}
    >
      <button
        type="button"
        className="p-0.5 rounded hover:bg-accent cursor-grab active:cursor-grabbing"
        {...dragHandleProps}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground/50" />
      </button>

      {row.type === 'milestone' ? (
        // Axe: bold section title, no chevron
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-bold uppercase tracking-wide text-orange-700 dark:text-orange-400 truncate">{row.title}</span>
        </div>
      ) : (
        <>
          <span className={cn(
            'w-2 h-2 rounded-full flex-shrink-0',
            row.type === 'project' ? 'bg-blue-500' : row.type === 'task' ? 'bg-violet-500' : 'bg-amber-500',
          )} />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm truncate">{row.title}</span>
            {ownerName && (
              <span className="text-[10px] text-muted-foreground truncate">{ownerName}</span>
            )}
          </div>
        </>
      )}

      {row.type !== 'milestone' && (
        <Badge variant="outline" className={cn('text-[10px] px-1 py-0 h-4 hidden group-hover:flex', statusColor(row.status))}>
          {STATUS_LABELS[row.status]}
        </Badge>
      )}

      <div className="hidden group-hover:flex items-center gap-0.5">
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
  rows,
  onEditMilestone, onEditProject, onEditTask, onEditSubtask,
  onAddProject, onAddTask, onAddSubtask,
  onDeleteMilestone, onDeleteProject, onDeleteTask, onDeleteSubtask,
  getOwnerName, onDragEnd, headerHeight,
}: GanttSidebarProps) {

  const sharedProps = {
    onEditMilestone, onEditProject, onEditTask, onEditSubtask,
    onAddProject, onAddTask, onAddSubtask,
    onDeleteMilestone, onDeleteProject, onDeleteTask, onDeleteSubtask,
    getOwnerName,
  };

  return (
    <div className="border-r border-border flex-shrink-0 flex flex-col" style={{ width, minWidth: width }}>
      <div
        className="border-b border-border flex items-end px-3 bg-muted/50 flex-shrink-0"
        style={{ height: headerHeight }}
      >
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pb-2">Axes / Projets / Tâches</span>
      </div>

      {rows.length === 0 && (
        <div className="p-4 text-sm text-muted-foreground text-center">
          Aucun élément. Créez un axe ou un projet pour commencer.
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="gantt-sidebar" type="GANTT_ROW">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex-1 overflow-y-auto"
            >
              {rows.map((row, index) => (
                <Draggable
                  key={`${row.type}-${row.id}`}
                  draggableId={`${row.type}-${row.id}`}
                  index={index}
                >
                  {(dragProvided, snapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className={cn(snapshot.isDragging && 'opacity-80 shadow-lg z-50 bg-card rounded')}
                    >
                      <RowContent
                        row={row}
                        dragHandleProps={dragProvided.dragHandleProps}
                        {...sharedProps}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

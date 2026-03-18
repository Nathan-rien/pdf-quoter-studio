import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, Diamond, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STATUS_LABELS } from '@/types/gantt';
import type { GanttRow } from '@/types/gantt';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

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
  rows, expandedMilestones, expandedProjects, expandedTasks,
  onToggleMilestone, onToggleProject, onToggleTask,
  onEditMilestone, onEditProject, onEditTask, onEditSubtask,
  onAddProject, onAddTask, onAddSubtask,
  onDeleteMilestone, onDeleteProject, onDeleteTask, onDeleteSubtask,
  getOwnerName, onDragEnd,
}: GanttSidebarProps) {
  const milestones = rows.filter((row) => row.type === 'milestone');

  const renderRowContent = (row: GanttRow, isDraggable: boolean) => {
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
          <GripVertical className="h-3 w-3 text-muted-foreground/50 cursor-grab active:cursor-grabbing flex-shrink-0" />
        ) : (
          <span className="w-3" />
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
              : <ChevronRight className="h-3.5 w-3.5" />
            }
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
  };

  return (
    <div className="w-72 min-w-72 border-r border-border flex-shrink-0 flex flex-col">
      <div className="h-10 border-b border-border flex items-center px-3 bg-muted/50 flex-shrink-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Jalons / Projets / Tâches</span>
      </div>

      {milestones.length === 0 && (
        <div className="p-4 text-sm text-muted-foreground text-center">
          Aucun jalon. Créez-en un pour commencer.
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="milestones-root" type="MILESTONE">
          {(milestoneDropProvided) => (
            <div
              ref={milestoneDropProvided.innerRef}
              {...milestoneDropProvided.droppableProps}
              className="flex-1 overflow-y-auto"
            >
              {milestones.map((milestone, milestoneIndex) => {
                const projects = rows.filter(
                  (row) => row.type === 'project' && row.milestoneId === milestone.id,
                );

                return (
                  <div key={`milestone-block-${milestone.id}`}>
                    <Draggable draggableId={`milestone-${milestone.id}`} index={milestoneIndex}>
                      {(milestoneDragProvided, snapshot) => (
                        <div
                          ref={milestoneDragProvided.innerRef}
                          {...milestoneDragProvided.draggableProps}
                          {...milestoneDragProvided.dragHandleProps}
                          className={cn(snapshot.isDragging && 'opacity-80 shadow-lg z-50')}
                        >
                          {renderRowContent(milestone, true)}
                        </div>
                      )}
                    </Draggable>

                    {expandedMilestones.has(milestone.id) && (
                      <Droppable droppableId={`projects-in-${milestone.id}`} type="PROJECT">
                        {(projectDropProvided) => (
                          <div ref={projectDropProvided.innerRef} {...projectDropProvided.droppableProps}>
                            {projects.map((project, projectIndex) => {
                              const tasks = rows.filter(
                                (row) => row.type === 'task' && row.projectId === project.id,
                              );

                              return (
                                <div key={`project-block-${project.id}`}>
                                  <Draggable draggableId={`project-${project.id}`} index={projectIndex}>
                                    {(projectDragProvided, snapshot) => (
                                      <div
                                        ref={projectDragProvided.innerRef}
                                        {...projectDragProvided.draggableProps}
                                        {...projectDragProvided.dragHandleProps}
                                        className={cn(snapshot.isDragging && 'opacity-80 shadow-lg z-50')}
                                      >
                                        {renderRowContent(project, true)}
                                      </div>
                                    )}
                                  </Draggable>

                                  {expandedProjects.has(project.id) && (
                                    <Droppable droppableId={`tasks-in-${project.id}`} type="TASK">
                                      {(taskDropProvided) => (
                                        <div ref={taskDropProvided.innerRef} {...taskDropProvided.droppableProps}>
                                          {tasks.map((task, taskIndex) => {
                                            const subtasks = rows.filter(
                                              (row) => row.type === 'subtask' && row.taskId === task.id,
                                            );

                                            return (
                                              <div key={`task-block-${task.id}`}>
                                                <Draggable draggableId={`task-${task.id}`} index={taskIndex}>
                                                  {(taskDragProvided, snapshot) => (
                                                    <div
                                                      ref={taskDragProvided.innerRef}
                                                      {...taskDragProvided.draggableProps}
                                                      {...taskDragProvided.dragHandleProps}
                                                      className={cn(snapshot.isDragging && 'opacity-80 shadow-lg z-50')}
                                                    >
                                                      {renderRowContent(task, true)}
                                                    </div>
                                                  )}
                                                </Draggable>

                                                {expandedTasks.has(task.id) && subtasks.map((subtask) => (
                                                  <div key={`subtask-${subtask.id}`}>
                                                    {renderRowContent(subtask, false)}
                                                  </div>
                                                ))}
                                              </div>
                                            );
                                          })}
                                          {taskDropProvided.placeholder}
                                        </div>
                                      )}
                                    </Droppable>
                                  )}
                                </div>
                              );
                            })}
                            {projectDropProvided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    )}
                  </div>
                );
              })}
              {milestoneDropProvided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

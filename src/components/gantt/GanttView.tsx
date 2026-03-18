import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useGanttData } from '@/hooks/useGanttData';
import { useCommerciaux } from '@/hooks/useCommerciaux';
import { GanttSidebar } from './GanttSidebar';
import { GanttTimeline } from './GanttTimeline';
import { GanttFilters } from './GanttFilters';
import { GanttNavigation } from './GanttNavigation';
import { ProjectDialog } from './ProjectDialog';
import { TaskDialog } from './TaskDialog';
import { SubtaskDialog } from './SubtaskDialog';
import { DependencyDialog } from './DependencyDialog';
import { MilestoneDialog } from './MilestoneDialog';
import type { GanttRow, ZoomLevel } from '@/types/gantt';
import type { DropResult } from '@hello-pangea/dnd';
import { addDays, addWeeks, addMonths, startOfWeek, startOfMonth, startOfYear, subDays, subWeeks, subMonths } from 'date-fns';
import { Loader2 } from 'lucide-react';

export function GanttView() {
  const data = useGanttData();
  const { commerciaux, getCommercialById } = useCommerciaux();
  const [zoom, setZoom] = useState<ZoomLevel>('week');
  const [viewStart, setViewStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [initialExpanded, setInitialExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const [milestoneDialog, setMilestoneDialog] = useState<{ open: boolean; milestone?: any }>({ open: false });
  const [projectDialog, setProjectDialog] = useState<{ open: boolean; project?: any; milestoneId?: string }>({ open: false });
  const [taskDialog, setTaskDialog] = useState<{ open: boolean; task?: any; projectId?: string }>({ open: false });
  const [subtaskDialog, setSubtaskDialog] = useState<{ open: boolean; subtask?: any; taskId?: string }>({ open: false });
  const [depDialog, setDepDialog] = useState(false);

  useEffect(() => {
    if (!initialExpanded && !data.loading && data.milestones.length > 0) {
      setExpandedMilestones(new Set(data.milestones.map(m => m.id)));
      setExpandedProjects(new Set(data.projects.map(p => p.id)));
      setInitialExpanded(true);
    }
  }, [data.loading, data.milestones, data.projects, initialExpanded]);

  const timelineRef = useRef<HTMLDivElement>(null);

  const getOwnerName = (ownerId: string | null | undefined): string => {
    if (!ownerId) return '';
    const c = getCommercialById(ownerId);
    return c ? c.nom : ownerId;
  };

  const toggleMilestone = (id: string) => {
    setExpandedMilestones(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const toggleProject = (id: string) => {
    setExpandedProjects(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const toggleTask = (id: string) => {
    setExpandedTasks(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  // Build flat row list
  const rows = useMemo<GanttRow[]>(() => {
    const result: GanttRow[] = [];
    const lowerSearch = search.toLowerCase();
    const sortedMilestones = [...data.milestones].sort((a, b) => a.sort_order - b.sort_order);

    for (const milestone of sortedMilestones) {
      if (filterStatus && filterStatus !== 'all' && milestone.status !== filterStatus) continue;
      if (lowerSearch && !milestone.title.toLowerCase().includes(lowerSearch)) {
        const msProjects = data.projects.filter(p => p.milestone_id === milestone.id);
        const anyMatch = msProjects.some(p => {
          if (p.title.toLowerCase().includes(lowerSearch)) return true;
          if (getOwnerName(p.owner).toLowerCase().includes(lowerSearch)) return true;
          return data.tasks.filter(t => t.project_id === p.id).some(t =>
            t.title.toLowerCase().includes(lowerSearch) || getOwnerName(t.owner).toLowerCase().includes(lowerSearch),
          );
        });
        if (!anyMatch) continue;
      }

      result.push({
        type: 'milestone', id: milestone.id, title: milestone.title,
        start_date: milestone.date, end_date: milestone.date,
        status: milestone.status, depth: 0, date: milestone.date,
      });

      if (!expandedMilestones.has(milestone.id)) continue;

      const milestoneProjects = data.projects
        .filter(p => p.milestone_id === milestone.id)
        .filter(p => {
          if (filterProject && filterProject !== 'all' && p.id !== filterProject) return false;
          if (filterOwner && filterOwner !== 'all' && p.owner !== filterOwner) return false;
          if (filterStatus && filterStatus !== 'all' && p.status !== filterStatus) return false;
          return true;
        })
        .sort((a, b) => a.sort_order - b.sort_order);

      for (const project of milestoneProjects) {
        result.push({
          type: 'project', id: project.id, title: project.title,
          start_date: project.start_date, end_date: project.end_date,
          status: project.status, owner: project.owner,
          milestoneId: milestone.id, depth: 1,
        });

        if (!expandedProjects.has(project.id)) continue;

        const projectTasks = data.tasks
          .filter(t => {
            if (t.project_id !== project.id) return false;
            if (filterPriority && filterPriority !== 'all' && t.priority !== filterPriority) return false;
            if (filterOwner && filterOwner !== 'all' && t.owner !== filterOwner) return false;
            if (filterStatus && filterStatus !== 'all' && t.status !== filterStatus) return false;
            return true;
          })
          .sort((a, b) => a.sort_order - b.sort_order);

        for (const task of projectTasks) {
          result.push({
            type: 'task', id: task.id, title: task.title,
            start_date: task.start_date, end_date: task.end_date,
            status: task.status, priority: task.priority, owner: task.owner,
            projectId: task.project_id, milestoneId: milestone.id, depth: 2,
          });

          if (!expandedTasks.has(task.id)) continue;

          const taskSubtasks = data.subtasks
            .filter(s => s.task_id === task.id)
            .sort((a, b) => a.sort_order - b.sort_order);

          for (const sub of taskSubtasks) {
            result.push({
              type: 'subtask', id: sub.id, title: sub.title,
              start_date: sub.start_date, end_date: sub.end_date,
              status: sub.status, taskId: sub.task_id, depth: 3,
            });
          }
        }
      }
    }
    return result;
  }, [data.projects, data.tasks, data.subtasks, data.milestones, expandedMilestones, expandedProjects, expandedTasks, search, filterProject, filterOwner, filterStatus, filterPriority]);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    if (sourceIndex === destinationIndex) return;

    const draggedRow = rows[sourceIndex];
    if (!draggedRow) return;

    const withoutDragged = rows.filter((_, index) => index !== sourceIndex);
    const safeDestinationIndex = Math.max(0, Math.min(destinationIndex, withoutDragged.length));

    const rowsAfterDrop = [...withoutDragged];
    rowsAfterDrop.splice(safeDestinationIndex, 0, draggedRow);

    const findMilestoneAbove = (list: GanttRow[], fromIndex: number): string | null => {
      for (let i = fromIndex - 1; i >= 0; i--) {
        if (list[i].type === 'milestone') return list[i].id;
      }
      return null;
    };

    const findProjectAbove = (list: GanttRow[], fromIndex: number): string | null => {
      for (let i = fromIndex - 1; i >= 0; i--) {
        if (list[i].type === 'project') return list[i].id;
        if (list[i].type === 'milestone') return null;
      }
      return null;
    };

    const findTaskAbove = (list: GanttRow[], fromIndex: number): string | null => {
      for (let i = fromIndex - 1; i >= 0; i--) {
        if (list[i].type === 'task') return list[i].id;
        if (list[i].type === 'project' || list[i].type === 'milestone') return null;
      }
      return null;
    };

    const getProjectsUnderMilestone = (list: GanttRow[], milestoneId: string): string[] => {
      const ids: string[] = [];
      let currentMilestoneId: string | null = null;

      for (const row of list) {
        if (row.type === 'milestone') {
          currentMilestoneId = row.id;
          continue;
        }

        if (row.type === 'project' && currentMilestoneId === milestoneId) {
          ids.push(row.id);
        }
      }

      return ids;
    };

    const getTasksUnderProject = (list: GanttRow[], projectId: string): string[] => {
      const ids: string[] = [];
      let currentProjectId: string | null = null;

      for (const row of list) {
        if (row.type === 'milestone') {
          currentProjectId = null;
          continue;
        }

        if (row.type === 'project') {
          currentProjectId = row.id;
          continue;
        }

        if (row.type === 'task' && currentProjectId === projectId) {
          ids.push(row.id);
        }
      }

      return ids;
    };

    const getSubtasksUnderTask = (list: GanttRow[], taskId: string): string[] => {
      const ids: string[] = [];
      let currentTaskId: string | null = null;

      for (const row of list) {
        if (row.type === 'milestone' || row.type === 'project') {
          currentTaskId = null;
          continue;
        }

        if (row.type === 'task') {
          currentTaskId = row.id;
          continue;
        }

        if (row.type === 'subtask' && currentTaskId === taskId) {
          ids.push(row.id);
        }
      }

      return ids;
    };

    if (draggedRow.type === 'milestone') {
      const milestoneIdsWithoutDragged = withoutDragged.filter((row) => row.type === 'milestone').map((row) => row.id);
      const milestoneInsertIndex = withoutDragged
        .slice(0, safeDestinationIndex)
        .filter((row) => row.type === 'milestone').length;

      const nextMilestoneIds = [...milestoneIdsWithoutDragged];
      nextMilestoneIds.splice(milestoneInsertIndex, 0, draggedRow.id);

      void data.reorderMilestones(nextMilestoneIds);
      return;
    }

    if (draggedRow.type === 'project') {
      const newMilestoneId = findMilestoneAbove(rowsAfterDrop, safeDestinationIndex);
      if (!newMilestoneId) return;

      const orderedProjectIds = getProjectsUnderMilestone(rowsAfterDrop, newMilestoneId);

      void (async () => {
        if (draggedRow.milestoneId !== newMilestoneId) {
          const moved = await data.moveProjectToMilestone(draggedRow.id, newMilestoneId);
          if (!moved) return;
        }
        await data.reorderProjects(orderedProjectIds);
      })();
      return;
    }

    if (draggedRow.type === 'task') {
      const newProjectId = findProjectAbove(rowsAfterDrop, safeDestinationIndex);
      if (!newProjectId) return;

      const orderedTaskIds = getTasksUnderProject(rowsAfterDrop, newProjectId);

      void (async () => {
        if (draggedRow.projectId !== newProjectId) {
          const moved = await data.moveTaskToProject(draggedRow.id, newProjectId);
          if (!moved) return;
        }
        await data.reorderTasks(orderedTaskIds);
      })();
      return;
    }

    if (draggedRow.type === 'subtask') {
      const newTaskId = findTaskAbove(rowsAfterDrop, safeDestinationIndex);
      if (!newTaskId) return;

      const orderedSubtaskIds = getSubtasksUnderTask(rowsAfterDrop, newTaskId);

      void (async () => {
        if (draggedRow.taskId !== newTaskId) {
          const moved = await data.moveSubtaskToTask(draggedRow.id, newTaskId);
          if (!moved) return;
        }
        await data.reorderSubtasks(orderedSubtaskIds);
      })();
    }
  }, [data, rows]);

  const navigate = (dir: 'prev' | 'next' | 'today') => {
    if (dir === 'today') {
      if (zoom === 'year') setViewStart(startOfYear(new Date()));
      else if (zoom === 'month') setViewStart(startOfMonth(new Date()));
      else setViewStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    } else if (dir === 'prev') {
      setViewStart(prev =>
        zoom === 'day' ? subDays(prev, 7) : zoom === 'week' ? subWeeks(prev, 4) :
        zoom === 'month' ? subMonths(prev, 3) : subMonths(prev, 6));
    } else {
      setViewStart(prev =>
        zoom === 'day' ? addDays(prev, 7) : zoom === 'week' ? addWeeks(prev, 4) :
        zoom === 'month' ? addMonths(prev, 3) : addMonths(prev, 6));
    }
  };

  const headerHeight = zoom === 'day' || zoom === 'week' ? 84 : 60;

  if (data.loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <GanttFilters
        search={search} onSearchChange={setSearch}
        projects={data.projects} filterProject={filterProject} onFilterProjectChange={setFilterProject}
        commerciaux={commerciaux} filterOwner={filterOwner} onFilterOwnerChange={setFilterOwner}
        filterStatus={filterStatus} onFilterStatusChange={setFilterStatus}
        filterPriority={filterPriority} onFilterPriorityChange={setFilterPriority}
        onCreateMilestone={() => setMilestoneDialog({ open: true })}
        onCreateDependency={() => setDepDialog(true)}
      />

      <GanttNavigation zoom={zoom} onZoomChange={setZoom} onNavigate={navigate} />

      <div className="border border-border rounded-lg bg-card overflow-hidden flex flex-1 min-h-0">
        <GanttSidebar
          rows={rows}
          expandedMilestones={expandedMilestones}
          expandedProjects={expandedProjects}
          expandedTasks={expandedTasks}
          headerHeight={headerHeight}
          onToggleMilestone={toggleMilestone}
          onToggleProject={toggleProject}
          onToggleTask={toggleTask}
          onEditMilestone={(id) => { const m = data.milestones.find(m => m.id === id); setMilestoneDialog({ open: true, milestone: m }); }}
          onEditProject={(id) => setProjectDialog({ open: true, project: data.projects.find(p => p.id === id) })}
          onEditTask={(id) => { const t = data.tasks.find(t => t.id === id); setTaskDialog({ open: true, task: t }); }}
          onEditSubtask={(id) => { const s = data.subtasks.find(s => s.id === id); setSubtaskDialog({ open: true, subtask: s }); }}
          onAddProject={(milestoneId) => setProjectDialog({ open: true, milestoneId })}
          onAddTask={(projectId) => setTaskDialog({ open: true, projectId })}
          onAddSubtask={(taskId) => setSubtaskDialog({ open: true, taskId })}
          onDeleteMilestone={data.deleteMilestone}
          onDeleteProject={data.deleteProject}
          onDeleteTask={data.deleteTask}
          onDeleteSubtask={data.deleteSubtask}
          getOwnerName={getOwnerName}
          onDragEnd={handleDragEnd}
        />
        <GanttTimeline
          ref={timelineRef}
          rows={rows}
          zoom={zoom}
          viewStart={viewStart}
          onUpdateDates={(type, id, start, end) => {
            if (type === 'milestone') data.updateMilestone(id, { date: start });
            else if (type === 'project') data.updateProject(id, { start_date: start, end_date: end });
            else if (type === 'task') data.updateTask(id, { start_date: start, end_date: end });
            else data.updateSubtask(id, { start_date: start, end_date: end });
          }}
          dependencies={data.dependencies}
          tasks={data.tasks}
          getOwnerName={getOwnerName}
        />
      </div>

      <MilestoneDialog
        open={milestoneDialog.open}
        onOpenChange={(open) => setMilestoneDialog({ open })}
        milestone={milestoneDialog.milestone}
        onSave={async (d): Promise<boolean> => {
          const ok = milestoneDialog.milestone
            ? await data.updateMilestone(milestoneDialog.milestone.id, d)
            : await data.createMilestone(d as any);
          if (ok) setMilestoneDialog({ open: false });
          return !!ok;
        }}
      />
      <ProjectDialog
        open={projectDialog.open}
        onOpenChange={(open) => setProjectDialog({ open })}
        project={projectDialog.project}
        milestoneId={projectDialog.milestoneId}
        milestones={data.milestones}
        commerciaux={commerciaux}
        onSave={async (d): Promise<boolean> => {
          const ok = projectDialog.project
            ? await data.updateProject(projectDialog.project.id, d)
            : await data.createProject(d as any);
          if (ok) {
            if (projectDialog.milestoneId) setExpandedMilestones(prev => new Set([...prev, projectDialog.milestoneId!]));
            setProjectDialog({ open: false });
          }
          return !!ok;
        }}
      />
      <TaskDialog
        open={taskDialog.open}
        onOpenChange={(open) => setTaskDialog({ open })}
        task={taskDialog.task}
        projectId={taskDialog.projectId}
        projects={data.projects}
        commerciaux={commerciaux}
        onSave={async (d): Promise<boolean> => {
          const ok = taskDialog.task
            ? await data.updateTask(taskDialog.task.id, d)
            : await data.createTask(d as any);
          if (ok) setTaskDialog({ open: false });
          return !!ok;
        }}
      />
      <SubtaskDialog
        open={subtaskDialog.open}
        onOpenChange={(open) => setSubtaskDialog({ open })}
        subtask={subtaskDialog.subtask}
        taskId={subtaskDialog.taskId}
        onSave={async (d): Promise<boolean> => {
          const ok = subtaskDialog.subtask
            ? await data.updateSubtask(subtaskDialog.subtask.id, d)
            : await data.createSubtask(d as any);
          if (ok) setSubtaskDialog({ open: false });
          return !!ok;
        }}
      />
      <DependencyDialog
        open={depDialog}
        onOpenChange={setDepDialog}
        tasks={data.tasks}
        projects={data.projects}
        onSave={async (d): Promise<boolean> => {
          const ok = await data.createDependency(d);
          if (ok) setDepDialog(false);
          return !!ok;
        }}
      />
    </div>
  );
}

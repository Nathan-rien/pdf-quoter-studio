import { useState, useMemo, useRef, useCallback } from 'react';
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
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [initialExpanded, setInitialExpanded] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Dialogs
  const [projectDialog, setProjectDialog] = useState<{ open: boolean; project?: any }>({ open: false });
  const [taskDialog, setTaskDialog] = useState<{ open: boolean; task?: any; projectId?: string }>({ open: false });
  const [subtaskDialog, setSubtaskDialog] = useState<{ open: boolean; subtask?: any; taskId?: string }>({ open: false });
  const [milestoneDialog, setMilestoneDialog] = useState<{ open: boolean; milestone?: any; projectId?: string }>({ open: false });
  const [depDialog, setDepDialog] = useState(false);

  // Auto-expand all projects on initial load
  useEffect(() => {
    if (!initialExpanded && !data.loading && data.projects.length > 0) {
      setExpandedProjects(new Set(data.projects.map(p => p.id)));
      setInitialExpanded(true);
    }
  }, [data.loading, data.projects, initialExpanded]);

  const timelineRef = useRef<HTMLDivElement>(null);

  const getOwnerName = (ownerId: string | null | undefined): string => {
    if (!ownerId) return '';
    const c = getCommercialById(ownerId);
    return c ? c.nom : ownerId;
  };

  const toggleProject = (id: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleTask = (id: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Drag & Drop handler
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) return;

    const draggedId = result.draggableId;
    const [draggedType, ...idParts] = draggedId.split('-');
    const actualId = idParts.join('-');

    if (draggedType === 'project') {
      // Reorder projects
      const projectRows = rows.filter(r => r.type === 'project');
      const projectIds = projectRows.map(r => r.id);
      
      // Find source and dest within project rows
      const sourceRow = rows[result.source.index];
      const destRow = rows[result.destination.index];
      
      if (sourceRow?.type === 'project' && destRow?.type === 'project') {
        const srcIdx = projectIds.indexOf(sourceRow.id);
        const dstIdx = projectIds.indexOf(destRow.id);
        if (srcIdx !== -1 && dstIdx !== -1) {
          const newOrder = [...projectIds];
          newOrder.splice(srcIdx, 1);
          newOrder.splice(dstIdx, 0, sourceRow.id);
          data.reorderProjects(newOrder);
        }
      }
    } else if (draggedType === 'task') {
      // Get the task being dragged
      const task = data.tasks.find(t => t.id === actualId);
      if (!task) return;
      
      // Reorder tasks within the same project
      const projectTasks = data.tasks
        .filter(t => t.project_id === task.project_id)
        .sort((a, b) => a.sort_order - b.sort_order);
      const taskIds = projectTasks.map(t => t.id);
      const srcIdx = taskIds.indexOf(actualId);
      
      // Calculate destination index within project tasks
      const sourceRow = rows[result.source.index];
      const destRow = rows[result.destination.index];
      if (sourceRow?.type === 'task' && destRow?.type === 'task') {
        const dstIdx = taskIds.indexOf(destRow.id);
        if (srcIdx !== -1 && dstIdx !== -1) {
          const newOrder = [...taskIds];
          newOrder.splice(srcIdx, 1);
          newOrder.splice(dstIdx, 0, actualId);
          data.reorderTasks(newOrder);
        }
      }
    } else if (draggedType === 'milestone') {
      const milestone = data.milestones.find(m => m.id === actualId);
      if (!milestone) return;

      const projectMilestones = data.milestones
        .filter(m => m.project_id === milestone.project_id)
        .sort((a, b) => a.sort_order - b.sort_order);
      const milestoneIds = projectMilestones.map(m => m.id);
      const srcIdx = milestoneIds.indexOf(actualId);

      const sourceRow = rows[result.source.index];
      const destRow = rows[result.destination.index];
      if (sourceRow?.type === 'milestone' && destRow?.type === 'milestone') {
        const dstIdx = milestoneIds.indexOf(destRow.id);
        if (srcIdx !== -1 && dstIdx !== -1) {
          const newOrder = [...milestoneIds];
          newOrder.splice(srcIdx, 1);
          newOrder.splice(dstIdx, 0, actualId);
          data.reorderMilestones(newOrder);
        }
      }
    }
  }, [data]);

  // Build flat row list
  const rows = useMemo<GanttRow[]>(() => {
    const result: GanttRow[] = [];
    const lowerSearch = search.toLowerCase();

    const filteredProjects = data.projects.filter(p => {
      if (filterProject && filterProject !== 'all' && p.id !== filterProject) return false;
      if (filterOwner && filterOwner !== 'all' && p.owner !== filterOwner) return false;
      if (filterStatus && filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (lowerSearch) {
        const ownerName = getOwnerName(p.owner).toLowerCase();
        if (!p.title.toLowerCase().includes(lowerSearch) && !ownerName.includes(lowerSearch)) {
          const projectTasks = data.tasks.filter(t => t.project_id === p.id);
          const anyTaskMatch = projectTasks.some(t => {
            const taskOwnerName = getOwnerName(t.owner).toLowerCase();
            return t.title.toLowerCase().includes(lowerSearch) || taskOwnerName.includes(lowerSearch);
          });
          if (!anyTaskMatch) return false;
        }
      }
      return true;
    });

    for (const project of filteredProjects) {
      result.push({ type: 'project', id: project.id, title: project.title, start_date: project.start_date, end_date: project.end_date, status: project.status, owner: project.owner, depth: 0 });

      if (expandedProjects.has(project.id)) {
        // Milestones first
        const projectMilestones = data.milestones
          .filter(m => m.project_id === project.id)
          .sort((a, b) => a.sort_order - b.sort_order);

        for (const ms of projectMilestones) {
          result.push({ type: 'milestone', id: ms.id, title: ms.title, start_date: ms.date, end_date: ms.date, status: ms.status, projectId: ms.project_id, depth: 1, date: ms.date });
        }

        // Then tasks
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
          result.push({ type: 'task', id: task.id, title: task.title, start_date: task.start_date, end_date: task.end_date, status: task.status, priority: task.priority, owner: task.owner, projectId: task.project_id, depth: 1 });

          if (expandedTasks.has(task.id)) {
            const taskSubtasks = data.subtasks
              .filter(s => s.task_id === task.id)
              .sort((a, b) => a.sort_order - b.sort_order);

            for (const sub of taskSubtasks) {
              result.push({ type: 'subtask', id: sub.id, title: sub.title, start_date: sub.start_date, end_date: sub.end_date, status: sub.status, taskId: sub.task_id, depth: 2 });
            }
          }
        }
      }
    }
    return result;
  }, [data.projects, data.tasks, data.subtasks, data.milestones, expandedProjects, expandedTasks, search, filterProject, filterOwner, filterStatus, filterPriority, commerciaux]);

  const navigate = (dir: 'prev' | 'next' | 'today') => {
    if (dir === 'today') {
      if (zoom === 'year') setViewStart(startOfYear(new Date()));
      else if (zoom === 'month') setViewStart(startOfMonth(new Date()));
      else setViewStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    } else if (dir === 'prev') {
      setViewStart(prev =>
        zoom === 'day' ? subDays(prev, 7) :
        zoom === 'week' ? subWeeks(prev, 4) :
        zoom === 'month' ? subMonths(prev, 3) :
        subMonths(prev, 6)
      );
    } else {
      setViewStart(prev =>
        zoom === 'day' ? addDays(prev, 7) :
        zoom === 'week' ? addWeeks(prev, 4) :
        zoom === 'month' ? addMonths(prev, 3) :
        addMonths(prev, 6)
      );
    }
  };

  if (data.loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GanttFilters
        search={search}
        onSearchChange={setSearch}
        projects={data.projects}
        filterProject={filterProject}
        onFilterProjectChange={setFilterProject}
        commerciaux={commerciaux}
        filterOwner={filterOwner}
        onFilterOwnerChange={setFilterOwner}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterPriority={filterPriority}
        onFilterPriorityChange={setFilterPriority}
        onCreateProject={() => setProjectDialog({ open: true })}
        onCreateDependency={() => setDepDialog(true)}
      />

      <GanttNavigation zoom={zoom} onZoomChange={setZoom} onNavigate={navigate} />

      <div className="border border-border rounded-lg bg-card overflow-hidden flex" style={{ minHeight: 400 }}>
        <GanttSidebar
          rows={rows}
          expandedProjects={expandedProjects}
          expandedTasks={expandedTasks}
          onToggleProject={toggleProject}
          onToggleTask={toggleTask}
          onEditProject={(id) => setProjectDialog({ open: true, project: data.projects.find(p => p.id === id) })}
          onEditTask={(id) => { const t = data.tasks.find(t => t.id === id); setTaskDialog({ open: true, task: t }); }}
          onEditSubtask={(id) => { const s = data.subtasks.find(s => s.id === id); setSubtaskDialog({ open: true, subtask: s }); }}
          onEditMilestone={(id) => { const m = data.milestones.find(m => m.id === id); setMilestoneDialog({ open: true, milestone: m }); }}
          onAddTask={(projectId) => setTaskDialog({ open: true, projectId })}
          onAddSubtask={(taskId) => setSubtaskDialog({ open: true, taskId })}
          onAddMilestone={(projectId) => setMilestoneDialog({ open: true, projectId })}
          onDeleteProject={data.deleteProject}
          onDeleteTask={data.deleteTask}
          onDeleteSubtask={data.deleteSubtask}
          onDeleteMilestone={data.deleteMilestone}
          getOwnerName={getOwnerName}
          onDragEnd={handleDragEnd}
        />
        <GanttTimeline
          ref={timelineRef}
          rows={rows}
          zoom={zoom}
          viewStart={viewStart}
          onUpdateDates={(type, id, start, end) => {
            if (type === 'project') data.updateProject(id, { start_date: start, end_date: end });
            else if (type === 'task') data.updateTask(id, { start_date: start, end_date: end });
            else if (type === 'milestone') data.updateMilestone(id, { date: start });
            else data.updateSubtask(id, { start_date: start, end_date: end });
          }}
          dependencies={data.dependencies}
          tasks={data.tasks}
          getOwnerName={getOwnerName}
        />
      </div>

      <ProjectDialog
        open={projectDialog.open}
        onOpenChange={(open) => setProjectDialog({ open })}
        project={projectDialog.project}
        commerciaux={commerciaux}
        onSave={async (d): Promise<boolean> => {
          const ok = projectDialog.project
            ? await data.updateProject(projectDialog.project.id, d)
            : await data.createProject(d as any);
          if (ok) setProjectDialog({ open: false });
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
      <MilestoneDialog
        open={milestoneDialog.open}
        onOpenChange={(open) => setMilestoneDialog({ open })}
        milestone={milestoneDialog.milestone}
        projectId={milestoneDialog.projectId}
        onSave={async (d): Promise<boolean> => {
          const ok = milestoneDialog.milestone
            ? await data.updateMilestone(milestoneDialog.milestone.id, d)
            : await data.createMilestone(d as any);
          if (ok) {
            // Auto-expand the project to show the new milestone
            if (milestoneDialog.projectId) {
              setExpandedProjects(prev => new Set([...prev, milestoneDialog.projectId!]));
            }
            setMilestoneDialog({ open: false });
          }
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

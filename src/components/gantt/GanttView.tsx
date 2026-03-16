import { useState, useMemo, useRef } from 'react';
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
import type { GanttRow, ZoomLevel } from '@/types/gantt';
import { addDays, addWeeks, addMonths, startOfWeek, startOfMonth, startOfYear, subDays, subWeeks, subMonths } from 'date-fns';
import { Loader2 } from 'lucide-react';

export function GanttView() {
  const data = useGanttData();
  const { commerciaux, getCommercialById } = useCommerciaux();
  const [zoom, setZoom] = useState<ZoomLevel>('week');
  const [viewStart, setViewStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
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
  const [depDialog, setDepDialog] = useState(false);

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
  }, [data.projects, data.tasks, data.subtasks, expandedProjects, expandedTasks, search, filterProject, filterOwner, filterStatus, filterPriority, commerciaux]);

  const navigate = (dir: 'prev' | 'next' | 'today') => {
    if (dir === 'today') {
      setViewStart(zoom === 'month' ? startOfMonth(new Date()) : startOfWeek(new Date(), { weekStartsOn: 1 }));
    } else if (dir === 'prev') {
      setViewStart(prev => zoom === 'day' ? subDays(prev, 7) : zoom === 'week' ? subWeeks(prev, 4) : subMonths(prev, 3));
    } else {
      setViewStart(prev => zoom === 'day' ? addDays(prev, 7) : zoom === 'week' ? addWeeks(prev, 4) : addMonths(prev, 3));
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
          onAddTask={(projectId) => setTaskDialog({ open: true, projectId })}
          onAddSubtask={(taskId) => setSubtaskDialog({ open: true, taskId })}
          onDeleteProject={data.deleteProject}
          onDeleteTask={data.deleteTask}
          onDeleteSubtask={data.deleteSubtask}
          getOwnerName={getOwnerName}
        />
        <GanttTimeline
          ref={timelineRef}
          rows={rows}
          zoom={zoom}
          viewStart={viewStart}
          onUpdateDates={(type, id, start, end) => {
            if (type === 'project') data.updateProject(id, { start_date: start, end_date: end });
            else if (type === 'task') data.updateTask(id, { start_date: start, end_date: end });
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

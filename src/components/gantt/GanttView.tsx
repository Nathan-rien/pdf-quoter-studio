import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
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
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const [milestoneDialog, setMilestoneDialog] = useState<{ open: boolean; milestone?: any }>({ open: false });
  const [projectDialog, setProjectDialog] = useState<{ open: boolean; project?: any }>({ open: false });
  const [taskDialog, setTaskDialog] = useState<{ open: boolean; task?: any; projectId?: string }>({ open: false });
  const [subtaskDialog, setSubtaskDialog] = useState<{ open: boolean; subtask?: any; taskId?: string }>({ open: false });
  const [depDialog, setDepDialog] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);

  const timelineRef = useRef<HTMLDivElement>(null);
  const resizingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      e.preventDefault();
      setSidebarWidth(w => Math.max(200, Math.min(500, w + e.movementX)));
    };
    const handleMouseUp = () => { resizingRef.current = false; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const getOwnerName = (ownerId: string | null | undefined): string => {
    if (!ownerId) return '';
    const c = getCommercialById(ownerId);
    return c ? c.nom : ownerId;
  };

  // Build flat row list sorted by global_sort_order
  const rows = useMemo<GanttRow[]>(() => {
    const lowerSearch = search.toLowerCase();

    // Merge all items into a single flat list
    type FlatItem = { type: 'milestone' | 'project' | 'task' | 'subtask'; global_sort_order: number; data: any };
    const allItems: FlatItem[] = [
      ...data.milestones.map(m => ({ type: 'milestone' as const, global_sort_order: m.global_sort_order, data: m })),
      ...data.projects.map(p => ({ type: 'project' as const, global_sort_order: p.global_sort_order, data: p })),
      ...data.tasks.map(t => ({ type: 'task' as const, global_sort_order: t.global_sort_order, data: t })),
      ...data.subtasks.map(s => ({ type: 'subtask' as const, global_sort_order: s.global_sort_order, data: s })),
    ];

    allItems.sort((a, b) => a.global_sort_order - b.global_sort_order);

    const depthMap: Record<string, number> = { milestone: 0, project: 1, task: 2, subtask: 3 };

    const result: GanttRow[] = [];
    for (const item of allItems) {
      const d = item.data;

      // Filters
      if (item.type === 'project') {
        if (filterProject && filterProject !== 'all' && d.id !== filterProject) continue;
        if (filterOwner && filterOwner !== 'all' && d.owner !== filterOwner) continue;
        if (filterStatus && filterStatus !== 'all' && d.status !== filterStatus) continue;
      }
      if (item.type === 'task') {
        if (filterPriority && filterPriority !== 'all' && d.priority !== filterPriority) continue;
        if (filterOwner && filterOwner !== 'all' && d.owner !== filterOwner) continue;
        if (filterStatus && filterStatus !== 'all' && d.status !== filterStatus) continue;
      }
      if (item.type === 'milestone' && filterStatus && filterStatus !== 'all' && d.status !== filterStatus) continue;

      // Search filter
      if (lowerSearch) {
        const title = (d.title || '').toLowerCase();
        const ownerName = getOwnerName(d.owner).toLowerCase();
        if (!title.includes(lowerSearch) && !ownerName.includes(lowerSearch)) continue;
      }

      if (item.type === 'milestone') {
        result.push({
          type: 'milestone', id: d.id, title: d.title,
          start_date: d.date, end_date: d.date,
          status: d.status, depth: depthMap.milestone,
          date: d.date, global_sort_order: d.global_sort_order,
        });
      } else if (item.type === 'project') {
        result.push({
          type: 'project', id: d.id, title: d.title,
          start_date: d.start_date, end_date: d.end_date,
          status: d.status, owner: d.owner,
          depth: depthMap.project, global_sort_order: d.global_sort_order,
        });
      } else if (item.type === 'task') {
        result.push({
          type: 'task', id: d.id, title: d.title,
          start_date: d.start_date, end_date: d.end_date,
          status: d.status, priority: d.priority, owner: d.owner,
          projectId: d.project_id, depth: depthMap.task,
          global_sort_order: d.global_sort_order,
        });
      } else {
        result.push({
          type: 'subtask', id: d.id, title: d.title,
          start_date: d.start_date, end_date: d.end_date,
          status: d.status, taskId: d.task_id, depth: depthMap.subtask,
          global_sort_order: d.global_sort_order,
        });
      }
    }
    return result;
  }, [data.milestones, data.projects, data.tasks, data.subtasks, search, filterProject, filterOwner, filterStatus, filterPriority]);

  // Simple flat DnD handler
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const src = result.source.index;
    const dst = result.destination.index;
    if (src === dst) return;

    const reordered = [...rows];
    const [moved] = reordered.splice(src, 1);
    reordered.splice(dst, 0, moved);

    // Build ordered items list
    const orderedItems = reordered.map(r => ({ type: r.type, id: r.id }));
    void data.reorderAll(orderedItems);
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
        onCreateProject={() => setProjectDialog({ open: true })}
        onCreateDependency={() => setDepDialog(true)}
      />

      <GanttNavigation zoom={zoom} onZoomChange={setZoom} onNavigate={navigate} />

      <div className="border border-border rounded-lg bg-card overflow-hidden flex flex-1 min-h-0">
        <GanttSidebar
          rows={rows}
          headerHeight={headerHeight}
          onEditMilestone={(id) => { const m = data.milestones.find(m => m.id === id); setMilestoneDialog({ open: true, milestone: m }); }}
          onEditProject={(id) => setProjectDialog({ open: true, project: data.projects.find(p => p.id === id) })}
          onEditTask={(id) => { const t = data.tasks.find(t => t.id === id); setTaskDialog({ open: true, task: t }); }}
          onEditSubtask={(id) => { const s = data.subtasks.find(s => s.id === id); setSubtaskDialog({ open: true, subtask: s }); }}
          onAddProject={() => setProjectDialog({ open: true })}
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
            if (type === 'project') data.updateProject(id, { start_date: start, end_date: end });
            else if (type === 'task') data.updateTask(id, { start_date: start, end_date: end });
            else if (type === 'subtask') data.updateSubtask(id, { start_date: start, end_date: end });
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

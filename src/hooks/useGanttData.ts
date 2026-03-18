import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { GanttProject, GanttTask, GanttSubtask, GanttDependency, GanttMilestone, GanttStatus, GanttPriority, GanttDependencyType } from '@/types/gantt';

const applySortOrder = <T extends { id: string; sort_order: number }>(items: T[], orderedIds: string[]): T[] => {
  if (!orderedIds.length) return items;
  const orderMap = new Map(orderedIds.map((id, index) => [id, (index + 1) * 10]));
  return items.map((item) => {
    const nextOrder = orderMap.get(item.id);
    return typeof nextOrder === 'number' ? { ...item, sort_order: nextOrder } : item;
  });
};

export function useGanttData() {
  const [projects, setProjects] = useState<GanttProject[]>([]);
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [subtasks, setSubtasks] = useState<GanttSubtask[]>([]);
  const [dependencies, setDependencies] = useState<GanttDependency[]>([]);
  const [milestones, setMilestones] = useState<GanttMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const reorderingRef = useRef(false);

  const fetchAll = useCallback(async () => {
    if (reorderingRef.current) return;
    setLoading(true);
    const [pRes, tRes, sRes, dRes, mRes] = await Promise.all([
      supabase.from('gantt_projects').select('*').order('sort_order'),
      supabase.from('gantt_tasks').select('*').order('sort_order'),
      supabase.from('gantt_subtasks').select('*').order('sort_order'),
      supabase.from('gantt_dependencies').select('*'),
      supabase.from('gantt_milestones').select('*').order('sort_order'),
    ]);
    if (pRes.data) setProjects(pRes.data as unknown as GanttProject[]);
    if (tRes.data) setTasks(tRes.data as unknown as GanttTask[]);
    if (sRes.data) setSubtasks(sRes.data as unknown as GanttSubtask[]);
    if (dRes.data) setDependencies(dRes.data as unknown as GanttDependency[]);
    if (mRes.data) setMilestones(mRes.data as unknown as GanttMilestone[]);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const channel = supabase
      .channel('gantt-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gantt_projects' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gantt_tasks' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gantt_subtasks' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gantt_dependencies' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gantt_milestones' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  // CRUD Milestones
  const createMilestone = async (data: { title: string; date: string; description?: string; status?: GanttStatus }) => {
    const maxOrder = milestones.reduce((max, m) => Math.max(max, m.sort_order), 0);
    const { error } = await supabase.from('gantt_milestones').insert({ ...data, sort_order: maxOrder + 10 } as any);
    if (error) { toast.error('Erreur création jalon'); console.error(error); return false; }
    toast.success('Jalon créé');
    return true;
  };

  const updateMilestone = async (id: string, data: Partial<{ title: string; date: string; description: string | null; status: GanttStatus; sort_order: number }>) => {
    const { error } = await supabase.from('gantt_milestones').update(data as any).eq('id', id);
    if (error) { toast.error('Erreur mise à jour jalon'); return false; }
    return true;
  };

  const deleteDependenciesForTaskIds = async (taskIds: string[]) => {
    if (!taskIds.length) return true;

    const [sourceDepsDelete, targetDepsDelete] = await Promise.all([
      supabase.from('gantt_dependencies').delete().in('source_task_id', taskIds),
      supabase.from('gantt_dependencies').delete().in('target_task_id', taskIds),
    ]);

    return !sourceDepsDelete.error && !targetDepsDelete.error;
  };

  const deleteMilestone = async (id: string) => {
    const projectIds = projects.filter((project) => project.milestone_id === id).map((project) => project.id);
    const taskIds = tasks.filter((task) => projectIds.includes(task.project_id)).map((task) => task.id);

    if (taskIds.length) {
      const [subtasksDelete, dependenciesDeleted, tasksDelete] = await Promise.all([
        supabase.from('gantt_subtasks').delete().in('task_id', taskIds),
        deleteDependenciesForTaskIds(taskIds),
        supabase.from('gantt_tasks').delete().in('id', taskIds),
      ]);

      if (subtasksDelete.error || !dependenciesDeleted || tasksDelete.error) {
        toast.error('Erreur suppression jalon');
        return false;
      }
    }

    if (projectIds.length) {
      const { error: projectsDeleteError } = await supabase.from('gantt_projects').delete().in('id', projectIds);
      if (projectsDeleteError) {
        toast.error('Erreur suppression jalon');
        return false;
      }
    }

    const { error } = await supabase.from('gantt_milestones').delete().eq('id', id);
    if (error) {
      toast.error('Erreur suppression jalon');
      return false;
    }

    toast.success('Jalon supprimé');
    return true;
  };

  // CRUD Projects
  const createProject = async (data: { title: string; description?: string; start_date: string; end_date: string; owner?: string; milestone_id: string }) => {
    const user = (await supabase.auth.getUser()).data.user;
    const maxOrder = projects.filter((p) => p.milestone_id === data.milestone_id).reduce((max, p) => Math.max(max, p.sort_order), 0);
    const { error } = await supabase.from('gantt_projects').insert({ ...data, created_by: user?.id, sort_order: maxOrder + 10 } as any);
    if (error) { toast.error('Erreur création projet'); console.error(error); return false; }
    toast.success('Projet créé');
    return true;
  };

  const updateProject = async (id: string, data: Partial<{ title: string; description: string | null; start_date: string; end_date: string; owner: string | null; status: GanttStatus; sort_order: number; milestone_id: string }>) => {
    const { error } = await supabase.from('gantt_projects').update(data as any).eq('id', id);
    if (error) { toast.error('Erreur mise à jour projet'); return false; }
    return true;
  };

  const deleteProject = async (id: string) => {
    const taskIds = tasks.filter((task) => task.project_id === id).map((task) => task.id);

    if (taskIds.length) {
      const [subtasksDelete, dependenciesDeleted, tasksDelete] = await Promise.all([
        supabase.from('gantt_subtasks').delete().in('task_id', taskIds),
        deleteDependenciesForTaskIds(taskIds),
        supabase.from('gantt_tasks').delete().in('id', taskIds),
      ]);

      if (subtasksDelete.error || !dependenciesDeleted || tasksDelete.error) {
        toast.error('Erreur suppression projet');
        return false;
      }
    }

    const { error } = await supabase.from('gantt_projects').delete().eq('id', id);
    if (error) {
      toast.error('Erreur suppression projet');
      return false;
    }

    toast.success('Projet supprimé');
    return true;
  };

  // CRUD Tasks
  const createTask = async (data: { project_id: string; title: string; description?: string; start_date: string; end_date: string; status?: GanttStatus; priority?: GanttPriority; owner?: string }) => {
    const { error } = await supabase.from('gantt_tasks').insert(data as any);
    if (error) { toast.error('Erreur création tâche'); console.error(error); return false; }
    toast.success('Tâche créée');
    return true;
  };

  const updateTask = async (id: string, data: Partial<{ project_id: string; title: string; description: string | null; start_date: string; end_date: string; status: GanttStatus; priority: GanttPriority; owner: string | null; sort_order: number }>) => {
    const { error } = await supabase.from('gantt_tasks').update(data as any).eq('id', id);
    if (error) { toast.error('Erreur mise à jour tâche'); return false; }
    return true;
  };

  const deleteTask = async (id: string) => {
    const [subtasksDelete, dependenciesDeleted, taskDelete] = await Promise.all([
      supabase.from('gantt_subtasks').delete().eq('task_id', id),
      deleteDependenciesForTaskIds([id]),
      supabase.from('gantt_tasks').delete().eq('id', id),
    ]);

    if (subtasksDelete.error || !dependenciesDeleted || taskDelete.error) {
      toast.error('Erreur suppression tâche');
      return false;
    }

    toast.success('Tâche supprimée');
    return true;
  };

  // CRUD Subtasks
  const createSubtask = async (data: { task_id: string; title: string; start_date: string; end_date: string; status?: GanttStatus }) => {
    const { error } = await supabase.from('gantt_subtasks').insert(data as any);
    if (error) { toast.error('Erreur création sous-tâche'); console.error(error); return false; }
    toast.success('Sous-tâche créée');
    return true;
  };

  const updateSubtask = async (id: string, data: Partial<{ title: string; start_date: string; end_date: string; status: GanttStatus; sort_order: number; task_id: string }>) => {
    const { error } = await supabase.from('gantt_subtasks').update(data as any).eq('id', id);
    if (error) { toast.error('Erreur mise à jour sous-tâche'); return false; }
    return true;
  };

  const deleteSubtask = async (id: string) => {
    const { error } = await supabase.from('gantt_subtasks').delete().eq('id', id);
    if (error) { toast.error('Erreur suppression sous-tâche'); return false; }
    toast.success('Sous-tâche supprimée');
    return true;
  };

  const moveProjectToMilestone = async (projectId: string, milestoneId: string) => {
    const currentProject = projects.find((p) => p.id === projectId);
    if (!currentProject || currentProject.milestone_id === milestoneId) return true;
    reorderingRef.current = true;
    const previous = [...projects];
    try {
      setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, milestone_id: milestoneId } : p)));
      const { error } = await supabase.from('gantt_projects').update({ milestone_id: milestoneId } as any).eq('id', projectId);
      if (error) { setProjects(previous); toast.error('Erreur déplacement projet'); return false; }
      return true;
    } finally { reorderingRef.current = false; }
  };

  const moveTaskToProject = async (taskId: string, projectId: string) => {
    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask || currentTask.project_id === projectId) return true;
    reorderingRef.current = true;
    const previous = [...tasks];
    try {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, project_id: projectId } : t)));
      const { error } = await supabase.from('gantt_tasks').update({ project_id: projectId } as any).eq('id', taskId);
      if (error) { setTasks(previous); toast.error('Erreur déplacement tâche'); return false; }
      return true;
    } finally { reorderingRef.current = false; }
  };

  const moveSubtaskToTask = async (subtaskId: string, taskId: string) => {
    const current = subtasks.find((s) => s.id === subtaskId);
    if (!current || current.task_id === taskId) return true;
    reorderingRef.current = true;
    const previous = [...subtasks];
    try {
      setSubtasks((prev) => prev.map((s) => (s.id === subtaskId ? { ...s, task_id: taskId } : s)));
      const { error } = await supabase.from('gantt_subtasks').update({ task_id: taskId } as any).eq('id', subtaskId);
      if (error) { setSubtasks(previous); toast.error('Erreur déplacement sous-tâche'); return false; }
      return true;
    } finally { reorderingRef.current = false; }
  };

  // Dependencies
  const createDependency = async (data: { source_task_id: string; target_task_id: string; dependency_type?: GanttDependencyType }) => {
    const { error } = await supabase.from('gantt_dependencies').insert(data as any);
    if (error) { toast.error('Erreur création dépendance'); return false; }
    toast.success('Dépendance ajoutée');
    return true;
  };

  const deleteDependency = async (id: string) => {
    const { error } = await supabase.from('gantt_dependencies').delete().eq('id', id);
    if (error) { toast.error('Erreur suppression dépendance'); return false; }
    return true;
  };

  const reorderMilestones = async (orderedIds: string[]) => {
    if (!orderedIds.length) return true;
    reorderingRef.current = true;
    const previous = [...milestones];
    try {
      setMilestones((prev) => applySortOrder(prev, orderedIds));
      const results = await Promise.all(
        orderedIds.map((id, i) => supabase.from('gantt_milestones').update({ sort_order: (i + 1) * 10 } as any).eq('id', id)),
      );
      if (results.some((r) => r.error)) { setMilestones(previous); toast.error('Erreur réordonnancement jalons'); return false; }
      return true;
    } finally { reorderingRef.current = false; }
  };

  const reorderProjects = async (orderedIds: string[]) => {
    if (!orderedIds.length) return true;
    reorderingRef.current = true;
    const previous = [...projects];
    try {
      setProjects((prev) => applySortOrder(prev, orderedIds));
      const results = await Promise.all(
        orderedIds.map((id, i) => supabase.from('gantt_projects').update({ sort_order: (i + 1) * 10 } as any).eq('id', id)),
      );
      if (results.some((r) => r.error)) { setProjects(previous); toast.error('Erreur réordonnancement projets'); return false; }
      return true;
    } finally { reorderingRef.current = false; }
  };

  const reorderTasks = async (orderedIds: string[]) => {
    if (!orderedIds.length) return true;
    reorderingRef.current = true;
    const previous = [...tasks];
    try {
      setTasks((prev) => applySortOrder(prev, orderedIds));
      const results = await Promise.all(
        orderedIds.map((id, i) => supabase.from('gantt_tasks').update({ sort_order: (i + 1) * 10 } as any).eq('id', id)),
      );
      if (results.some((r) => r.error)) { setTasks(previous); toast.error('Erreur réordonnancement tâches'); return false; }
      return true;
    } finally { reorderingRef.current = false; }
  };

  const reorderSubtasks = async (orderedIds: string[]) => {
    if (!orderedIds.length) return true;
    reorderingRef.current = true;
    const previous = [...subtasks];
    try {
      setSubtasks((prev) => applySortOrder(prev, orderedIds));
      const results = await Promise.all(
        orderedIds.map((id, i) => supabase.from('gantt_subtasks').update({ sort_order: (i + 1) * 10 } as any).eq('id', id)),
      );
      if (results.some((r) => r.error)) { setSubtasks(previous); toast.error('Erreur réordonnancement sous-tâches'); return false; }
      return true;
    } finally { reorderingRef.current = false; }
  };

  return {
    projects, tasks, subtasks, dependencies, milestones, loading,
    createProject, updateProject, deleteProject,
    createTask, updateTask, deleteTask,
    createSubtask, updateSubtask, deleteSubtask,
    createMilestone, updateMilestone, deleteMilestone,
    moveProjectToMilestone, moveTaskToProject, moveSubtaskToTask,
    createDependency, deleteDependency,
    reorderMilestones, reorderProjects, reorderTasks, reorderSubtasks,
    refresh: fetchAll,
  };
}

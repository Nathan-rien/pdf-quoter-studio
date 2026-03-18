import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { GanttProject, GanttTask, GanttSubtask, GanttDependency, GanttMilestone, GanttStatus, GanttPriority, GanttDependencyType, GanttItemType } from '@/types/gantt';

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
      supabase.from('gantt_projects').select('*').order('global_sort_order'),
      supabase.from('gantt_tasks').select('*').order('global_sort_order'),
      supabase.from('gantt_subtasks').select('*').order('global_sort_order'),
      supabase.from('gantt_dependencies').select('*'),
      supabase.from('gantt_milestones').select('*').order('global_sort_order'),
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

  // Compute max global_sort_order across all items
  const getMaxGlobalOrder = () => {
    const all = [
      ...milestones.map(m => m.global_sort_order),
      ...projects.map(p => p.global_sort_order),
      ...tasks.map(t => t.global_sort_order),
      ...subtasks.map(s => s.global_sort_order),
    ];
    return all.length ? Math.max(...all) : 0;
  };

  // CRUD Milestones (now "Axes")
  const createMilestone = async (data: { title: string; description?: string; status?: GanttStatus }) => {
    const maxOrder = getMaxGlobalOrder();
    const { error } = await supabase.from('gantt_milestones').insert({
      title: data.title,
      date: new Date().toISOString().split('T')[0], // required by DB but not used
      description: data.description || null,
      status: data.status || 'not_started',
      sort_order: maxOrder + 10,
      global_sort_order: maxOrder + 10,
    } as any);
    if (error) { toast.error('Erreur création axe'); console.error(error); return false; }
    toast.success('Axe créé');
    return true;
  };

  const updateMilestone = async (id: string, data: Partial<{ title: string; description: string | null; status: GanttStatus }>) => {
    const { error } = await supabase.from('gantt_milestones').update(data as any).eq('id', id);
    if (error) { toast.error('Erreur mise à jour axe'); return false; }
    return true;
  };

  const deleteDependenciesForTaskIds = async (taskIds: string[]) => {
    if (!taskIds.length) return true;
    const [s, t] = await Promise.all([
      supabase.from('gantt_dependencies').delete().in('source_task_id', taskIds),
      supabase.from('gantt_dependencies').delete().in('target_task_id', taskIds),
    ]);
    return !s.error && !t.error;
  };

  const deleteMilestone = async (id: string) => {
    // Axes are just visual separators — just delete the milestone row
    const { error } = await supabase.from('gantt_milestones').delete().eq('id', id);
    if (error) { toast.error('Erreur suppression axe'); return false; }
    toast.success('Axe supprimé');
    return true;
  };

  // CRUD Projects
  const createProject = async (data: { title: string; description?: string; start_date: string; end_date: string; owner?: string }) => {
    const user = (await supabase.auth.getUser()).data.user;
    const maxOrder = getMaxGlobalOrder();
    const { error } = await supabase.from('gantt_projects').insert({
      ...data,
      created_by: user?.id,
      sort_order: maxOrder + 10,
      global_sort_order: maxOrder + 10,
    } as any);
    if (error) { toast.error('Erreur création projet'); console.error(error); return false; }
    toast.success('Projet créé');
    return true;
  };

  const updateProject = async (id: string, data: Partial<{ title: string; description: string | null; start_date: string; end_date: string; owner: string | null; status: GanttStatus }>) => {
    const { error } = await supabase.from('gantt_projects').update(data as any).eq('id', id);
    if (error) { toast.error('Erreur mise à jour projet'); return false; }
    return true;
  };

  const deleteProject = async (id: string) => {
    const taskIds = tasks.filter(t => t.project_id === id).map(t => t.id);
    if (taskIds.length) {
      await Promise.all([
        supabase.from('gantt_subtasks').delete().in('task_id', taskIds),
        deleteDependenciesForTaskIds(taskIds),
        supabase.from('gantt_tasks').delete().in('id', taskIds),
      ]);
    }
    const { error } = await supabase.from('gantt_projects').delete().eq('id', id);
    if (error) { toast.error('Erreur suppression projet'); return false; }
    toast.success('Projet supprimé');
    return true;
  };

  // CRUD Tasks
  const createTask = async (data: { project_id: string; title: string; description?: string; start_date: string; end_date: string; status?: GanttStatus; priority?: GanttPriority; owner?: string }) => {
    const maxOrder = getMaxGlobalOrder();
    const { error } = await supabase.from('gantt_tasks').insert({
      ...data,
      sort_order: maxOrder + 10,
      global_sort_order: maxOrder + 10,
    } as any);
    if (error) { toast.error('Erreur création tâche'); console.error(error); return false; }
    toast.success('Tâche créée');
    return true;
  };

  const updateTask = async (id: string, data: Partial<{ project_id: string; title: string; description: string | null; start_date: string; end_date: string; status: GanttStatus; priority: GanttPriority; owner: string | null }>) => {
    const { error } = await supabase.from('gantt_tasks').update(data as any).eq('id', id);
    if (error) { toast.error('Erreur mise à jour tâche'); return false; }
    return true;
  };

  const deleteTask = async (id: string) => {
    await Promise.all([
      supabase.from('gantt_subtasks').delete().eq('task_id', id),
      deleteDependenciesForTaskIds([id]),
      supabase.from('gantt_tasks').delete().eq('id', id),
    ]);
    toast.success('Tâche supprimée');
    return true;
  };

  // CRUD Subtasks
  const createSubtask = async (data: { task_id: string; title: string; start_date: string; end_date: string; status?: GanttStatus }) => {
    const maxOrder = getMaxGlobalOrder();
    const { error } = await supabase.from('gantt_subtasks').insert({
      ...data,
      sort_order: maxOrder + 10,
      global_sort_order: maxOrder + 10,
    } as any);
    if (error) { toast.error('Erreur création sous-tâche'); console.error(error); return false; }
    toast.success('Sous-tâche créée');
    return true;
  };

  const updateSubtask = async (id: string, data: Partial<{ title: string; start_date: string; end_date: string; status: GanttStatus; task_id: string }>) => {
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

  // Reorder all items by updating global_sort_order
  const reorderAll = async (orderedItems: { type: GanttItemType; id: string }[]) => {
    reorderingRef.current = true;
    try {
      const updates = orderedItems.map((item, index) => {
        const order = (index + 1) * 10;
        const table = item.type === 'milestone' ? 'gantt_milestones'
          : item.type === 'project' ? 'gantt_projects'
          : item.type === 'task' ? 'gantt_tasks'
          : 'gantt_subtasks';
        return supabase.from(table).update({ global_sort_order: order } as any).eq('id', item.id);
      });
      const results = await Promise.all(updates);
      if (results.some(r => r.error)) {
        toast.error('Erreur réordonnancement');
        await fetchAll();
        return false;
      }
      // Optimistic: update local state
      const orderMap = new Map(orderedItems.map((item, i) => [`${item.type}-${item.id}`, (i + 1) * 10]));
      setMilestones(prev => prev.map(m => ({ ...m, global_sort_order: orderMap.get(`milestone-${m.id}`) ?? m.global_sort_order })));
      setProjects(prev => prev.map(p => ({ ...p, global_sort_order: orderMap.get(`project-${p.id}`) ?? p.global_sort_order })));
      setTasks(prev => prev.map(t => ({ ...t, global_sort_order: orderMap.get(`task-${t.id}`) ?? t.global_sort_order })));
      setSubtasks(prev => prev.map(s => ({ ...s, global_sort_order: orderMap.get(`subtask-${s.id}`) ?? s.global_sort_order })));
      return true;
    } finally {
      reorderingRef.current = false;
    }
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

  return {
    projects, tasks, subtasks, dependencies, milestones, loading,
    createProject, updateProject, deleteProject,
    createTask, updateTask, deleteTask,
    createSubtask, updateSubtask, deleteSubtask,
    createMilestone, updateMilestone, deleteMilestone,
    createDependency, deleteDependency,
    reorderAll,
    refresh: fetchAll,
  };
}

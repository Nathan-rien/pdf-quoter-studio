import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { GanttProject, GanttTask, GanttSubtask, GanttDependency, GanttMilestone, GanttStatus, GanttPriority, GanttDependencyType } from '@/types/gantt';

export function useGanttData() {
  const [projects, setProjects] = useState<GanttProject[]>([]);
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [subtasks, setSubtasks] = useState<GanttSubtask[]>([]);
  const [dependencies, setDependencies] = useState<GanttDependency[]>([]);
  const [milestones, setMilestones] = useState<GanttMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const reorderingRef = useRef(false);

  const fetchAll = useCallback(async () => {
    if (reorderingRef.current) return; // Skip during reordering
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

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime subscriptions
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

  // CRUD Projects
  const createProject = async (data: { title: string; description?: string; start_date: string; end_date: string; owner?: string }) => {
    const user = (await supabase.auth.getUser()).data.user;
    const maxOrder = projects.reduce((max, p) => Math.max(max, p.sort_order), 0);
    const { error } = await supabase.from('gantt_projects').insert({ ...data, created_by: user?.id, sort_order: maxOrder + 10 } as any);
    if (error) { toast.error('Erreur création projet'); console.error(error); return false; }
    toast.success('Projet créé');
    return true;
  };

  const updateProject = async (id: string, data: Partial<{ title: string; description: string | null; start_date: string; end_date: string; owner: string | null; status: GanttStatus; sort_order: number }>) => {
    const { error } = await supabase.from('gantt_projects').update(data as any).eq('id', id);
    if (error) { toast.error('Erreur mise à jour projet'); return false; }
    return true;
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from('gantt_projects').delete().eq('id', id);
    if (error) { toast.error('Erreur suppression projet'); return false; }
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
    const { error } = await supabase.from('gantt_tasks').delete().eq('id', id);
    if (error) { toast.error('Erreur suppression tâche'); return false; }
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

  const updateSubtask = async (id: string, data: Partial<{ title: string; start_date: string; end_date: string; status: GanttStatus; sort_order: number }>) => {
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

  // CRUD Milestones
  const createMilestone = async (data: { project_id: string; title: string; date: string; description?: string; status?: GanttStatus }) => {
    const projectMilestones = milestones.filter(m => m.project_id === data.project_id);
    const maxOrder = projectMilestones.reduce((max, m) => Math.max(max, m.sort_order), 0);
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

  const deleteMilestone = async (id: string) => {
    const { error } = await supabase.from('gantt_milestones').delete().eq('id', id);
    if (error) { toast.error('Erreur suppression jalon'); return false; }
    toast.success('Jalon supprimé');
    return true;
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

  // Batch reorder helpers
  const reorderProjects = async (orderedIds: string[]) => {
    const previous = [...projects];
    setProjects(prev => {
      const map = new Map(prev.map(p => [p.id, p]));
      const reordered = orderedIds
        .map((id, i) => { const p = map.get(id); return p ? { ...p, sort_order: (i + 1) * 10 } : null; })
        .filter(Boolean) as GanttProject[];
      return [...reordered, ...prev.filter(p => !orderedIds.includes(p.id))];
    });
    const results = await Promise.all(orderedIds.map((id, i) => supabase.from('gantt_projects').update({ sort_order: (i + 1) * 10 } as any).eq('id', id)));
    if (results.some(r => r.error)) { setProjects(previous); toast.error('Erreur réordonnancement'); }
  };

  const reorderTasks = async (orderedIds: string[]) => {
    const previous = [...tasks];
    setTasks(prev => {
      const map = new Map(prev.map(t => [t.id, t]));
      const reordered = orderedIds
        .map((id, i) => { const t = map.get(id); return t ? { ...t, sort_order: (i + 1) * 10 } : null; })
        .filter(Boolean) as GanttTask[];
      return [...reordered, ...prev.filter(t => !orderedIds.includes(t.id))];
    });
    const results = await Promise.all(orderedIds.map((id, i) => supabase.from('gantt_tasks').update({ sort_order: (i + 1) * 10 } as any).eq('id', id)));
    if (results.some(r => r.error)) { setTasks(previous); toast.error('Erreur réordonnancement'); }
  };

  const reorderMilestones = async (orderedIds: string[]) => {
    const previous = [...milestones];
    setMilestones(prev => {
      const map = new Map(prev.map(m => [m.id, m]));
      const reordered = orderedIds
        .map((id, i) => { const m = map.get(id); return m ? { ...m, sort_order: (i + 1) * 10 } : null; })
        .filter(Boolean) as GanttMilestone[];
      return [...reordered, ...prev.filter(m => !orderedIds.includes(m.id))];
    });
    const results = await Promise.all(orderedIds.map((id, i) => supabase.from('gantt_milestones').update({ sort_order: (i + 1) * 10 } as any).eq('id', id)));
    if (results.some(r => r.error)) { setMilestones(previous); toast.error('Erreur réordonnancement'); }
  };

  return {
    projects, tasks, subtasks, dependencies, milestones, loading,
    createProject, updateProject, deleteProject,
    createTask, updateTask, deleteTask,
    createSubtask, updateSubtask, deleteSubtask,
    createMilestone, updateMilestone, deleteMilestone,
    createDependency, deleteDependency,
    reorderProjects, reorderTasks, reorderMilestones,
    refresh: fetchAll,
  };
}

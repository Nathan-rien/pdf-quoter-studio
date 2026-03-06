import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { GanttProject, GanttTask, GanttSubtask, GanttDependency, GanttStatus, GanttPriority, GanttDependencyType } from '@/types/gantt';

export function useGanttData() {
  const [projects, setProjects] = useState<GanttProject[]>([]);
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [subtasks, setSubtasks] = useState<GanttSubtask[]>([]);
  const [dependencies, setDependencies] = useState<GanttDependency[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [pRes, tRes, sRes, dRes] = await Promise.all([
      supabase.from('gantt_projects').select('*').order('created_at'),
      supabase.from('gantt_tasks').select('*').order('sort_order'),
      supabase.from('gantt_subtasks').select('*').order('sort_order'),
      supabase.from('gantt_dependencies').select('*'),
    ]);
    if (pRes.data) setProjects(pRes.data as unknown as GanttProject[]);
    if (tRes.data) setTasks(tRes.data as unknown as GanttTask[]);
    if (sRes.data) setSubtasks(sRes.data as unknown as GanttSubtask[]);
    if (dRes.data) setDependencies(dRes.data as unknown as GanttDependency[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('gantt-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gantt_projects' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gantt_tasks' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gantt_subtasks' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gantt_dependencies' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  // CRUD Projects
  const createProject = async (data: { title: string; description?: string; start_date: string; end_date: string; owner?: string }) => {
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from('gantt_projects').insert({ ...data, created_by: user?.id } as any);
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
    projects, tasks, subtasks, dependencies, loading,
    createProject, updateProject, deleteProject,
    createTask, updateTask, deleteTask,
    createSubtask, updateSubtask, deleteSubtask,
    createDependency, deleteDependency,
    refresh: fetchAll,
  };
}

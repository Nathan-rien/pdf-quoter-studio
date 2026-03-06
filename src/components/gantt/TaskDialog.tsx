import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATUS_LABELS, PRIORITY_LABELS } from '@/types/gantt';
import type { GanttTask, GanttProject, GanttStatus, GanttPriority } from '@/types/gantt';
import type { Commercial } from '@/data/commerciaux';
import { format } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: GanttTask;
  projectId?: string;
  projects: GanttProject[];
  commerciaux: Commercial[];
  onSave: (data: Partial<GanttTask>) => Promise<boolean>;
}

export function TaskDialog({ open, onOpenChange, task, projectId, projects, commerciaux, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState<GanttStatus>('not_started');
  const [priority, setPriority] = useState<GanttPriority>('medium');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(task?.title || '');
      setDescription(task?.description || '');
      setSelectedProject(task?.project_id || projectId || '');
      setStartDate(task?.start_date || format(new Date(), 'yyyy-MM-dd'));
      setEndDate(task?.end_date || format(new Date(), 'yyyy-MM-dd'));
      setOwner(task?.owner || '');
      setStatus(task?.status || 'not_started');
      setPriority(task?.priority || 'medium');
    }
  }, [open, task, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ project_id: selectedProject, title, description: description || null, start_date: startDate, end_date: endDate, owner: owner || null, status, priority });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? 'Modifier la tâche' : 'Ajouter une tâche'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Projet *</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger><SelectValue placeholder="Choisir un projet" /></SelectTrigger>
              <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Titre *</Label><Input value={title} onChange={e => setTitle(e.target.value)} required /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date début *</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required /></div>
            <div><Label>Date fin *</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Statut</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as GanttStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.entries(STATUS_LABELS) as [GanttStatus, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priorité</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as GanttPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.entries(PRIORITY_LABELS) as [GanttPriority, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Responsable</Label>
            <Select value={owner} onValueChange={setOwner}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un responsable" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {commerciaux.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={saving || !title || !selectedProject || !startDate || !endDate}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

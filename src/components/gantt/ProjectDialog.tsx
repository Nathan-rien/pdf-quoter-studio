import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATUS_LABELS } from '@/types/gantt';
import type { GanttProject, GanttMilestone, GanttStatus } from '@/types/gantt';
import type { Commercial } from '@/data/commerciaux';
import { format } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: GanttProject;
  milestoneId?: string;
  milestones: GanttMilestone[];
  commerciaux: Commercial[];
  onSave: (data: Partial<GanttProject>) => Promise<boolean>;
}

export function ProjectDialog({ open, onOpenChange, project, milestoneId, milestones, commerciaux, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState<GanttStatus>('not_started');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(project?.title || '');
      setDescription(project?.description || '');
      setStartDate(project?.start_date || format(new Date(), 'yyyy-MM-dd'));
      setEndDate(project?.end_date || format(new Date(), 'yyyy-MM-dd'));
      setOwner(project?.owner || '');
      setStatus(project?.status || 'not_started');
      setSelectedMilestoneId(project?.milestone_id || milestoneId || milestones[0]?.id || '');
    }
  }, [open, project, milestoneId, milestones]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestoneId) return;

    setSaving(true);
    await onSave({
      title,
      description: description || null,
      start_date: startDate,
      end_date: endDate,
      owner: owner || null,
      status,
      milestone_id: selectedMilestoneId,
    });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? 'Modifier le projet' : 'Créer un projet'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Titre *</Label><Input value={title} onChange={e => setTitle(e.target.value)} required /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date début *</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required /></div>
            <div><Label>Date fin *</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required /></div>
          </div>
          <div>
            <Label>Jalon parent *</Label>
            <Select value={selectedMilestoneId} onValueChange={setSelectedMilestoneId}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un jalon" /></SelectTrigger>
              <SelectContent>
                {milestones.map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
              </SelectContent>
            </Select>
            {milestones.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">Créez d'abord un jalon pour pouvoir créer un projet.</p>
            )}
          </div>
          <div>
            <Label>Responsable</Label>
            <Select value={owner || 'none'} onValueChange={(value) => setOwner(value === 'none' ? '' : value)}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un responsable" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {commerciaux.map(c => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {project && (
            <div>
              <Label>Statut</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as GanttStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(STATUS_LABELS) as [GanttStatus, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={saving || !title || !startDate || !endDate || !selectedMilestoneId || milestones.length === 0}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

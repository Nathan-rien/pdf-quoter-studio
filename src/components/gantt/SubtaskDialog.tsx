import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATUS_LABELS } from '@/types/gantt';
import type { GanttSubtask, GanttStatus } from '@/types/gantt';
import { format } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtask?: GanttSubtask;
  taskId?: string;
  onSave: (data: Partial<GanttSubtask>) => Promise<boolean>;
}

export function SubtaskDialog({ open, onOpenChange, subtask, taskId, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<GanttStatus>('not_started');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(subtask?.title || '');
      setStartDate(subtask?.start_date || format(new Date(), 'yyyy-MM-dd'));
      setEndDate(subtask?.end_date || format(new Date(), 'yyyy-MM-dd'));
      setStatus(subtask?.status || 'not_started');
    }
  }, [open, subtask]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ task_id: subtask?.task_id || taskId, title, start_date: startDate, end_date: endDate, status });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{subtask ? 'Modifier la sous-tâche' : 'Ajouter une sous-tâche'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Titre *</Label><Input value={title} onChange={e => setTitle(e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date début *</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required /></div>
            <div><Label>Date fin *</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required /></div>
          </div>
          <div>
            <Label>Statut</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as GanttStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.entries(STATUS_LABELS) as [GanttStatus, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={saving || !title || !startDate || !endDate}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

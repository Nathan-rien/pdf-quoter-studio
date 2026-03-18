import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATUS_LABELS } from '@/types/gantt';
import type { GanttMilestone, GanttStatus } from '@/types/gantt';
import { format } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone?: GanttMilestone;
  projectId?: string;
  onSave: (data: Partial<GanttMilestone>) => Promise<boolean>;
}

export function MilestoneDialog({ open, onOpenChange, milestone, projectId, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<GanttStatus>('not_started');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(milestone?.title || '');
      setDate(milestone?.date || format(new Date(), 'yyyy-MM-dd'));
      setDescription(milestone?.description || '');
      setStatus(milestone?.status || 'not_started');
    }
  }, [open, milestone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const data: any = { title, date, description: description || null, status };
    if (!milestone && projectId) data.project_id = projectId;
    await onSave(data);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{milestone ? 'Modifier le jalon' : 'Ajouter un jalon'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Titre *</Label><Input value={title} onChange={e => setTitle(e.target.value)} required /></div>
          <div><Label>Date *</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
          <div>
            <Label>Statut</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as GanttStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.entries(STATUS_LABELS) as [GanttStatus, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={saving || !title || !date}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

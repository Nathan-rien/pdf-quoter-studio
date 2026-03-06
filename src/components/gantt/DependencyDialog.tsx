import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GanttTask, GanttProject, GanttDependencyType } from '@/types/gantt';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: GanttTask[];
  projects: GanttProject[];
  onSave: (data: { source_task_id: string; target_task_id: string; dependency_type: GanttDependencyType }) => Promise<boolean>;
}

export function DependencyDialog({ open, onOpenChange, tasks, projects, onSave }: Props) {
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [type, setType] = useState<GanttDependencyType>('finish_to_start');
  const [saving, setSaving] = useState(false);

  const getProjectTitle = (projectId: string) => projects.find(p => p.id === projectId)?.title || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ source_task_id: source, target_task_id: target, dependency_type: type });
    setSaving(false);
    setSource('');
    setTarget('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une dépendance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Tâche source *</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>
                {tasks.map(t => (
                  <SelectItem key={t.id} value={t.id}>{getProjectTitle(t.project_id)} → {t.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tâche cible *</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>
                {tasks.filter(t => t.id !== source).map(t => (
                  <SelectItem key={t.id} value={t.id}>{getProjectTitle(t.project_id)} → {t.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as GanttDependencyType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="finish_to_start">Fin → Début</SelectItem>
                <SelectItem value="start_to_start">Début → Début</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={saving || !source || !target}>{saving ? 'Ajout...' : 'Ajouter'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

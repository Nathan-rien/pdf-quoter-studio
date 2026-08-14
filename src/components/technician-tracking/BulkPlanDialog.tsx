import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';

interface Ref {
  id: string;
  service_label: string;
  erp_reference: string | null;
  requires_intervention?: boolean | null;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  clientName: string;
  refs: Ref[];
}

function toLocalInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function BulkPlanDialog({ open, onOpenChange, clientName, refs }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();

  const defaultDate = useMemo(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return toLocalInput(d);
  }, [open]);

  const [selected, setSelected] = useState<Set<string>>(new Set(refs.map((r) => r.id)));
  const [dateLocal, setDateLocal] = useState<string>(defaultDate);
  const [durationHours, setDurationHours] = useState<string>('1');
  const [durationMinutes, setDurationMinutes] = useState<string>('0');
  const [technicianName, setTechnicianName] = useState<string>(
    user?.user_metadata?.full_name || user?.email || ''
  );
  const [commentaire, setCommentaire] = useState<string>('');

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allChecked = selected.size === refs.length;
  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(refs.map((r) => r.id)));
  };

  const mut = useMutation({
    mutationFn: async () => {
      const iso = new Date(dateLocal).toISOString();
      const totalMinutes = (Number(durationHours) || 0) * 60 + (Number(durationMinutes) || 0);
      const dur = totalMinutes > 0 ? totalMinutes : null;
      const name = technicianName.trim() || 'Technicien';
      const rows = Array.from(selected).map((refId) => ({
        reference_id: refId,
        date_intervention: iso,
        duree_estimee_minutes: dur,
        technician_name: name,
        technician_user_id: user?.id ?? null,
        commentaire: commentaire.trim() || null,
        statut: 'prevue' as const,
        created_by: user?.id ?? null,
      }));
      const { error } = await supabase.from('intervention_planning').insert(rows as any);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ['pl-interventions'] });
      toast({ title: `${n} intervention${n > 1 ? 's' : ''} planifiée${n > 1 ? 's' : ''}` });
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-4 w-4" /> Tout planifier — {clientName}
          </DialogTitle>
          <DialogDescription>
            Planifier plusieurs services à la même date, heure et technicien.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-md border">
            <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/40">
              <Checkbox checked={allChecked} onCheckedChange={toggleAll} id="bulk-all" />
              <label htmlFor="bulk-all" className="text-xs font-medium cursor-pointer">
                Tout sélectionner ({selected.size}/{refs.length})
              </label>
            </div>
            <ul className="max-h-56 overflow-auto divide-y divide-border">
              {refs.map((r) => (
                <li key={r.id} className="flex items-center gap-2 px-3 py-2">
                  <Checkbox
                    id={`bulk-${r.id}`}
                    checked={selected.has(r.id)}
                    onCheckedChange={() => toggle(r.id)}
                  />
                  <label htmlFor={`bulk-${r.id}`} className="flex-1 text-sm cursor-pointer">
                    {r.service_label}
                  </label>
                  <Badge
                    className={
                      r.erp_reference
                        ? 'bg-blue-100 text-blue-900 hover:bg-blue-100 border-transparent'
                        : 'bg-muted text-muted-foreground border-transparent'
                    }
                  >
                    JAJA : {r.erp_reference || 'non renseigné'}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Date & heure</label>
              <Input
                type="datetime-local"
                value={dateLocal}
                onChange={(e) => setDateLocal(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Durée (heures)</label>
              <Input
                type="number"
                min={0}
                step={1}
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Durée (minutes)</label>
              <Input
                type="number"
                min={0}
                max={59}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
          </div>


          <div>
            <label className="text-xs font-medium mb-1 block">Technicien</label>
            <Input
              value={technicianName}
              onChange={(e) => setTechnicianName(e.target.value)}
              placeholder="Nom du technicien"
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Commentaire (optionnel)</label>
            <Textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button
            onClick={() => mut.mutate()}
            disabled={mut.isPending || selected.size === 0 || !dateLocal}
          >
            Planifier {selected.size} intervention{selected.size > 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

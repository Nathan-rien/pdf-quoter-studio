import { ReactNode, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Ticket, History as HistoryIcon, AlertTriangle, Check, X, CalendarPlus, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { BulkPlanDialog } from './BulkPlanDialog';

export interface ServiceRef {
  id: string;
  contract_id: string;
  option_service_id: string | null;
  service_label: string;
  erp_reference: string | null;
  tickets_initial: number | null;
  tickets_remaining: number | null;
  requires_intervention?: boolean | null;
}

export function useServiceReferences() {
  return useQuery({
    queryKey: ['tt-refs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_service_references')
        .select('*');
      if (error) throw error;
      return (data ?? []) as ServiceRef[];
    },
  });
}

interface PanelProps {
  contractId: string;
  clientName: string;
  isAdmin: boolean;
  /** Références déjà chargées ; sinon le panneau les récupère lui-même. */
  refs?: ServiceRef[];
  onPlanIntervention?: (p: { reference_id: string; contract_id: string }) => void;
  /** Libellé de prix optionnel affiché à droite de chaque ligne. */
  priceLabelFor?: (serviceLabel: string) => string | null;
  /** Lignes supplémentaires (options de la proposition sans référence de service). */
  extraRows?: { name: string; erpReference?: string | null; priceLabel?: string | null }[];
  footer?: ReactNode;
  showBulkPlan?: boolean;
  allowAdd?: boolean;
  emptyMessage?: string;
}

export function ServiceReferencesPanel({
  contractId,
  clientName,
  isAdmin,
  refs: refsProp,
  onPlanIntervention,
  priceLabelFor,
  extraRows,
  footer,
  showBulkPlan = true,
  allowAdd = false,
  emptyMessage = 'Aucun service rattaché à ce contrat.',
}: PanelProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fetched = useServiceReferences();
  const [historyRefId, setHistoryRefId] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newRequiresIntervention, setNewRequiresIntervention] = useState(true);

  const refs = useMemo(() => {
    if (refsProp) return refsProp;
    return (fetched.data ?? []).filter((r) => r.contract_id === contractId);
  }, [refsProp, fetched.data, contractId]);

  const plannableRefs = useMemo(
    () => refs.filter((r) => r.requires_intervention !== false),
    [refs],
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['tt-refs'] });
    qc.invalidateQueries({ queryKey: ['pl-refs'] });
  };

  const updateRef = useMutation({
    mutationFn: async (payload: {
      id: string;
      erp_reference: string | null;
      tickets_initial: number | null;
      tickets_remaining: number | null;
      requires_intervention?: boolean;
    }) => {
      const { id, ...rest } = payload;
      const { error } = await supabase.from('client_service_references').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Référence mise à jour' });
    },
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const consume = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('consume_ticket', { _reference_id: id, _note: null });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ['tt-log'] });
      toast({ title: 'Ticket consommé' });
    },
    onError: (e: Error) => {
      if (e.message.includes('quota_exhausted')) {
        toast({ title: 'Quota épuisé', description: 'Aucun ticket restant.', variant: 'destructive' });
      } else {
        toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
      }
    },
  });

  const addRef = useMutation({
    mutationFn: async (label: string) => {
      const { error } = await supabase.from('client_service_references').insert({
        contract_id: contractId,
        option_service_id: null,
        service_label: label,
        erp_reference: null,
        requires_intervention: newRequiresIntervention,
        tickets_initial: null,
        tickets_remaining: null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setNewLabel('');
      setNewRequiresIntervention(true);
      setAdding(false);
      toast({ title: 'Service ajouté' });
    },
    onError: (e: Error) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-2">
      {(showBulkPlan || allowAdd) && (
        <div className="flex items-center justify-end gap-2">
          {allowAdd && isAdmin && (
            <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter un service
            </Button>
          )}
          {showBulkPlan && plannableRefs.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)}>
              <CalendarPlus className="h-3.5 w-3.5 mr-1" /> Tout planifier
            </Button>
          )}
        </div>
      )}

      {adding && (
        <div className="flex items-center gap-2">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Libellé du service"
            className="h-8"
          />
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
            <Checkbox
              checked={newRequiresIntervention}
              onCheckedChange={(c) => setNewRequiresIntervention(c === true)}
            />
            Avec intervention
          </label>
          <Button size="sm" disabled={!newLabel.trim() || addRef.isPending} onClick={() => addRef.mutate(newLabel.trim())}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewLabel(''); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {refs.length === 0 && !(extraRows?.length) ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="divide-y divide-border">
          {refs.map((r) => (
            <ReferenceRow
              key={r.id}
              r={r}
              isAdmin={isAdmin}
              priceLabel={priceLabelFor?.(r.service_label) ?? null}
              onSave={(payload) => updateRef.mutate({ id: r.id, ...payload })}
              onConsume={() => consume.mutate(r.id)}
              onOpenHistory={() => setHistoryRefId(r.id)}
              onPlan={
                onPlanIntervention && r.requires_intervention !== false
                  ? () => onPlanIntervention({ reference_id: r.id, contract_id: contractId })
                  : undefined
              }
            />
          ))}
          {(extraRows ?? []).map((row, idx) => (
            <div key={`extra-${idx}`} className="py-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px] font-medium text-sm">{row.name}</div>
              <Badge
                className={
                  row.erpReference
                    ? 'bg-blue-100 text-blue-900 hover:bg-blue-100 border-transparent'
                    : 'bg-muted text-muted-foreground border-transparent'
                }
              >
                JAJA : {row.erpReference || 'non renseigné'}
              </Badge>
              {row.priceLabel && (
                <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">{row.priceLabel}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {footer}

      <HistoryDialog refId={historyRefId} onOpenChange={(o) => !o && setHistoryRefId(null)} />

      {bulkOpen && (
        <BulkPlanDialog
          open
          onOpenChange={(o) => !o && setBulkOpen(false)}
          clientName={clientName}
          refs={plannableRefs}
        />
      )}
    </div>
  );
}

function ReferenceRow({
  r, isAdmin, onSave, onConsume, onOpenHistory, onPlan, priceLabel,
}: {
  r: ServiceRef;
  isAdmin: boolean;
  priceLabel?: string | null;
  onSave: (p: { erp_reference: string | null; tickets_initial: number | null; tickets_remaining: number | null; requires_intervention: boolean }) => void;
  onConsume: () => void;
  onOpenHistory: () => void;
  onPlan?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [erp, setErp] = useState(r.erp_reference ?? '');
  const [initial, setInitial] = useState<string>(r.tickets_initial?.toString() ?? '');
  const [remaining, setRemaining] = useState<string>(r.tickets_remaining?.toString() ?? '');
  const [requiresIntervention, setRequiresIntervention] = useState(r.requires_intervention !== false);

  const hasTickets = r.tickets_initial !== null && r.tickets_remaining !== null;
  const exhausted = hasTickets && (r.tickets_remaining ?? 0) <= 0;

  return (
    <div className="py-3 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-[200px]">
        <div className="font-medium text-sm">{r.service_label}</div>
        {editing ? (
          <div className="mt-2 flex flex-wrap gap-2 items-center">
            <Input
              value={erp}
              onChange={(e) => setErp(e.target.value)}
              placeholder="Référence JAJA"
              className="h-8 w-48"
            />
            <Input
              type="number"
              min={0}
              value={initial}
              onChange={(e) => {
                setInitial(e.target.value);
                if (!remaining || Number(remaining) > Number(e.target.value)) setRemaining(e.target.value);
              }}
              placeholder="Tickets initiaux"
              className="h-8 w-32"
            />
            <Input
              type="number"
              min={0}
              value={remaining}
              onChange={(e) => setRemaining(e.target.value)}
              placeholder="Restants"
              className="h-8 w-28"
            />
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
              <Checkbox
                checked={requiresIntervention}
                onCheckedChange={(c) => setRequiresIntervention(c === true)}
              />
              Avec intervention
            </label>
            <Button
              size="sm"
              onClick={() => {
                const ini = initial === '' ? null : Math.max(0, Number(initial) | 0);
                let rem = remaining === '' ? null : Math.max(0, Number(remaining) | 0);
                if (ini === null) rem = null;
                if (ini !== null && rem !== null && rem > ini) rem = ini;
                onSave({
                  erp_reference: erp.trim() || null,
                  tickets_initial: ini,
                  tickets_remaining: rem,
                  requires_intervention: requiresIntervention,
                });
                setEditing(false);
              }}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>

      {!editing && (
        <>
          <Badge
            className={
              r.erp_reference
                ? 'bg-blue-100 text-blue-900 hover:bg-blue-100 border-transparent'
                : 'bg-muted text-muted-foreground border-transparent'
            }
          >
            JAJA : {r.erp_reference || 'non renseigné'}
          </Badge>

          {r.requires_intervention === false && (
            <Badge variant="outline" className="text-muted-foreground">
              Sans intervention
            </Badge>
          )}

          {hasTickets && (
            <button
              type="button"
              onClick={onOpenHistory}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted ${
                exhausted
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-800'
              }`}
              title="Voir l'historique de consommation"
            >
              {exhausted ? <AlertTriangle className="h-3.5 w-3.5" /> : <Ticket className="h-3.5 w-3.5" />}
              {r.tickets_remaining} / {r.tickets_initial} tickets
            </button>
          )}

          {hasTickets && (
            <Button size="sm" variant="outline" disabled={exhausted} onClick={onConsume}>
              Consommer 1 ticket
            </Button>
          )}

          {onPlan && (
            <Button size="sm" variant="outline" onClick={onPlan}>
              <CalendarPlus className="h-3.5 w-3.5 mr-1" />
              Planifier
            </Button>
          )}

          {isAdmin && (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}

          {priceLabel && (
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">{priceLabel}</span>
          )}
        </>
      )}
    </div>
  );
}

export function HistoryDialog({
  refId, onOpenChange,
}: { refId: string | null; onOpenChange: (open: boolean) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['tt-log', refId],
    enabled: !!refId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_usage_log')
        .select('id, used_at, used_by_name, note')
        .eq('reference_id', refId!)
        .order('used_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <Dialog open={!!refId} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HistoryIcon className="h-4 w-4" /> Historique de consommation
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune consommation enregistrée.</p>
        ) : (
          <ul className="divide-y divide-border max-h-80 overflow-auto">
            {data!.map((l: any) => (
              <li key={l.id} className="py-2 text-sm flex items-center justify-between">
                <span>
                  <strong>{l.used_by_name ?? 'Utilisateur'}</strong>
                  {l.note ? <span className="text-muted-foreground"> — {l.note}</span> : null}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(l.used_at).toLocaleString('fr-FR')}
                </span>
              </li>
            ))}
          </ul>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

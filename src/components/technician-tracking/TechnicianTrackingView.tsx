import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Pencil, Ticket, History as HistoryIcon, AlertTriangle, Check, X, CalendarPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

interface Ref {
  id: string;
  contract_id: string;
  option_service_id: string | null;
  service_label: string;
  erp_reference: string | null;
  tickets_initial: number | null;
  tickets_remaining: number | null;
}

interface ContractRow {
  id: string;
  client_name: string;
  contract_number: string | null;
  validated_at: string;
}

interface TechnicianTrackingViewProps {
  isAdmin: boolean;
  onPlanIntervention?: (p: { reference_id: string; contract_id: string }) => void;
}

export function TechnicianTrackingView({ isAdmin, onPlanIntervention }: TechnicianTrackingViewProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const contractsQ = useQuery({
    queryKey: ['tt-contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('id, client_name, contract_number, validated_at')
        .eq('proposal_type', 'service')
        .order('validated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ContractRow[];
    },
  });

  const refsQ = useQuery({
    queryKey: ['tt-refs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_service_references')
        .select('*');
      if (error) throw error;
      return (data ?? []) as Ref[];
    },
  });

  const grouped = useMemo(() => {
    const contracts = contractsQ.data ?? [];
    const refs = refsQ.data ?? [];
    const byContract = new Map<string, Ref[]>();
    for (const r of refs) {
      const list = byContract.get(r.contract_id) ?? [];
      list.push(r);
      byContract.set(r.contract_id, list);
    }
    const q = search.trim().toLowerCase();
    return contracts
      .filter((c) => (q ? c.client_name.toLowerCase().includes(q) : true))
      .map((c) => ({ contract: c, refs: byContract.get(c.id) ?? [] }))
      .filter((g) => g.refs.length > 0);
  }, [contractsQ.data, refsQ.data, search]);

  const updateRef = useMutation({
    mutationFn: async (payload: {
      id: string;
      erp_reference: string | null;
      tickets_initial: number | null;
      tickets_remaining: number | null;
    }) => {
      const { id, ...rest } = payload;
      const { error } = await supabase
        .from('client_service_references')
        .update(rest)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tt-refs'] });
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
      qc.invalidateQueries({ queryKey: ['tt-refs'] });
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

  const [historyRefId, setHistoryRefId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Suivi Techniciens</h1>
          <p className="text-sm text-muted-foreground">
            Services actifs par client, références JAJA et quotas de tickets.
          </p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {contractsQ.isLoading || refsQ.isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : grouped.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Aucun contrat de service actif avec des références.
        </Card>
      ) : (
        <div className="grid gap-3">
          {grouped.map(({ contract, refs }) => (
            <Card key={contract.id} className="p-4">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="font-semibold">{contract.client_name}</h2>
                <span className="text-xs text-muted-foreground">
                  {contract.contract_number ?? '—'} · validé le{' '}
                  {new Date(contract.validated_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="divide-y divide-border">
                {refs.map((r) => (
                  <ReferenceRow
                    key={r.id}
                    r={r}
                    isAdmin={isAdmin}
                    onSave={(payload) => updateRef.mutate({ id: r.id, ...payload })}
                    onConsume={() => consume.mutate(r.id)}
                    onOpenHistory={() => setHistoryRefId(r.id)}
                  />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <HistoryDialog refId={historyRefId} onOpenChange={(o) => !o && setHistoryRefId(null)} />
    </div>
  );
}

function ReferenceRow({
  r, isAdmin, onSave, onConsume, onOpenHistory,
}: {
  r: Ref;
  isAdmin: boolean;
  onSave: (p: { erp_reference: string | null; tickets_initial: number | null; tickets_remaining: number | null }) => void;
  onConsume: () => void;
  onOpenHistory: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [erp, setErp] = useState(r.erp_reference ?? '');
  const [initial, setInitial] = useState<string>(r.tickets_initial?.toString() ?? '');
  const [remaining, setRemaining] = useState<string>(r.tickets_remaining?.toString() ?? '');

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
            <Button
              size="sm"
              variant="outline"
              disabled={exhausted}
              onClick={onConsume}
            >
              Consommer 1 ticket
            </Button>
          )}

          {isAdmin && (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function HistoryDialog({
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

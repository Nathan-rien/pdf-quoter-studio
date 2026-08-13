import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ServiceReferencesPanel, ServiceRef, useServiceReferences } from './ServiceReferencesPanel';

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

  const refsQ = useServiceReferences();

  const grouped = useMemo(() => {
    const contracts = contractsQ.data ?? [];
    const refs = refsQ.data ?? [];
    const byContract = new Map<string, ServiceRef[]>();
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
              <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
                <h2 className="font-semibold">{contract.client_name}</h2>
                <span className="text-xs text-muted-foreground">
                  {contract.contract_number ?? '—'} · validé le{' '}
                  {new Date(contract.validated_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <ServiceReferencesPanel
                contractId={contract.id}
                clientName={contract.client_name}
                isAdmin={isAdmin}
                refs={refs}
                onPlanIntervention={onPlanIntervention}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

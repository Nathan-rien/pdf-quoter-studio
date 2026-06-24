import { useState } from 'react';
import { ChevronDown, ChevronUp, User, FileText, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useContracts, isContractRenewingSoon, Contract } from '@/hooks/useContracts';
import { ContractRow } from './ContractRow';
import { ContractRenewalAlert } from './ContractRenewalAlert';

function groupByCommercial(contracts: Contract[]) {
  const map = new Map<string, { name: string; contracts: Contract[] }>();
  for (const c of contracts) {
    if (!map.has(c.commercial_id)) {
      map.set(c.commercial_id, { name: c.commercial_name ?? c.commercial_id, contracts: [] });
    }
    map.get(c.commercial_id)!.contracts.push(c);
  }
  return Array.from(map.entries()).map(([id, val]) => ({
    commercialId: id,
    commercialName: val.name,
    contracts: val.contracts,
  }));
}

function CommercialGroup({ commercialName, contracts }: { commercialId: string; commercialName: string; contracts: Contract[] }) {
  const [open, setOpen] = useState(true);
  const renewingCount = contracts.filter(isContractRenewingSoon).length;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-muted/80 transition-colors text-left"
      >
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">{commercialName}</span>
        <Badge variant="secondary">{contracts.length}</Badge>
        {renewingCount > 0 && (
          <Badge variant="warning" className="gap-1">
            <Bell className="h-3 w-3" />
            {renewingCount}
          </Badge>
        )}
        <span className="ml-auto text-muted-foreground">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>
      {open && (
        <div className="space-y-2 pl-2">
          {contracts.map((c) => <ContractRow key={c.id} contract={c} />)}
        </div>
      )}
    </div>
  );
}

export function ContractsView() {
  const { data: contracts = [], isLoading, error } = useContracts();
  const groups = groupByCommercial(contracts);
  const totalRenewing = contracts.filter(isContractRenewingSoon).length;

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement des contrats…</p>;
  if (error) return <p className="text-sm text-destructive">Erreur lors du chargement des contrats.</p>;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Contrats</h1>
          {contracts.length > 0 && <Badge variant="secondary">{contracts.length}</Badge>}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Propositions validées. Renseignez le mois de mise en place, le partenaire et la durée pour chaque contrat.
        </p>
      </div>

      {totalRenewing > 0 && <ContractRenewalAlert />}

      {contracts.length === 0 && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">Aucun contrat pour l'instant.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Validez une proposition depuis l'onglet Historique pour la retrouver ici.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {groups.map((g) => (
          <CommercialGroup
            key={g.commercialId}
            commercialId={g.commercialId}
            commercialName={g.commercialName}
            contracts={g.contracts}
          />
        ))}
      </div>
    </div>
  );
}

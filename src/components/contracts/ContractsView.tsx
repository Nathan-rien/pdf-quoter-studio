import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, User, FileText, Bell, Loader2, Plus, Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useContracts, isContractRenewingSoon, Contract } from '@/hooks/useContracts';
import { ContractRow } from './ContractRow';
import { ContractRenewalAlert } from './ContractRenewalAlert';
import { useCommerciaux } from '@/hooks/useCommerciaux';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';


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

function CommercialGroup({
  commercialName,
  contracts,
  onVisualize,
}: {
  commercialId: string;
  commercialName: string;
  contracts: Contract[];
  onVisualize?: (contract: Contract) => void;
}) {
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
          {contracts.map((c) => <ContractRow key={c.id} contract={c} onVisualize={onVisualize} />)}
        </div>
      )}
    </div>
  );
}

export function ContractsView({ onCreateManual }: { onCreateManual?: () => void } = {}) {
  const { data: contracts = [], isLoading, error } = useContracts('location');
  const { toast } = useToast();
  const groups = groupByCommercial(contracts);
  const totalRenewing = contracts.filter(isContractRenewingSoon).length;

  const [previewContract, setPreviewContract] = useState<Contract | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const handleVisualize = async (contract: Contract) => {
    setPreviewContract(contract);
    setPreviewContent(null);
    setLoadingPreview(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('proposal_exports')
        .select('pdf_html_content')
        .eq('id', contract.proposal_id)
        .single();
      if (fetchError || !data?.pdf_html_content) {
        toast({ title: 'Visualisation indisponible', description: "Le contenu de la proposition n'est plus disponible.", variant: 'destructive' });
        setPreviewContract(null);
        return;
      }
      setPreviewContent(data.pdf_html_content);
    } catch {
      toast({ title: 'Erreur', description: "Impossible de charger l'aperçu.", variant: 'destructive' });
      setPreviewContract(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleClosePreview = () => {
    setPreviewContract(null);
    setPreviewContent(null);
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement des contrats…</p>;
  if (error) return <p className="text-sm text-destructive">Erreur lors du chargement des contrats.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
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
        {onCreateManual && (
          <Button variant="outline" size="sm" onClick={onCreateManual} className="shrink-0 gap-1">
            <Plus className="h-4 w-4" />
            Créer un contrat manuellement
          </Button>
        )}

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
            onVisualize={handleVisualize}
          />
        ))}
      </div>

      <Dialog open={!!previewContract} onOpenChange={(open) => !open && handleClosePreview()}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-[90vh] p-0 flex flex-col">
          <DialogHeader className="p-4 border-b shrink-0">
            <DialogTitle className="truncate">
              {previewContract?.client_name} — {previewContract?.template_name ?? 'Proposition'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {loadingPreview ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : previewContent ? (
              <iframe srcDoc={previewContent} className="w-full h-full border-0" title="Aperçu de la proposition" />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

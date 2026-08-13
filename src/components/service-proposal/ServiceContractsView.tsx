import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, User, FileText, Bell, Loader2, Plus, Filter, X, Zap, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { addMonths, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useContracts, isContractRenewingSoon, Contract, useCreateQuickContract } from '@/hooks/useContracts';
import { ContractRow } from '@/components/contracts/ContractRow';
import { ContractRenewalAlert } from '@/components/contracts/ContractRenewalAlert';
import { useCommerciaux } from '@/hooks/useCommerciaux';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

function groupByCommercial(contracts: Contract[]) {
  const map = new Map<string, { name: string; contracts: Contract[] }>();
  for (const c of contracts) {
    const key = c.is_quick_contract ? '__quick__' : c.commercial_id;
    const name = c.is_quick_contract ? 'Contrats rapides' : (c.commercial_name ?? c.commercial_id);
    if (!map.has(key)) map.set(key, { name, contracts: [] });
    map.get(key)!.contracts.push(c);
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
  autoExpandId,
  onPlanIntervention,
}: {
  commercialName: string;
  contracts: Contract[];
  onVisualize?: (contract: Contract) => void;
  autoExpandId?: string | null;
  onPlanIntervention?: (p: { reference_id: string; contract_id: string }) => void;
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
          {contracts.map((c) => (
            <ContractRow
              key={c.id}
              contract={c}
              onVisualize={onVisualize}
              defaultExpanded={autoExpandId === c.id}
              hideFinancialPartner
              onPlanIntervention={onPlanIntervention}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ServiceContractsView({ onCreateManual, onPlanIntervention }: { onCreateManual?: () => void; onPlanIntervention?: (p: { reference_id: string; contract_id: string }) => void } = {}) {
  const { data: contracts = [], isLoading, error } = useContracts('service');
  const { toast } = useToast();
  const { getCommercialById } = useCommerciaux();
  const createQuick = useCreateQuickContract();
  const [autoExpandId, setAutoExpandId] = useState<string | null>(null);

  const handleCreateQuick = async () => {
    try {
      const created = await createQuick.mutateAsync('service');
      setAutoExpandId(created.id);
    } catch {
      /* toast déjà géré par la mutation */
    }
  };

  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [commercialFilter, setCommercialFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortMode, setSortMode] = useState<string>('recent');

  const commercialOptions = useMemo(() => {
    const map = new Map<string, string>();
    contracts.forEach((c) => { map.set(c.commercial_id, c.commercial_name ?? c.commercial_id); });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [contracts]);

  const getEndTime = (c: Contract): number | null => {
    if (!c.implementation_month || !c.duration_months) return null;
    try { return addMonths(parseISO(c.implementation_month), c.duration_months).getTime(); }
    catch { return null; }
  };

  const filteredContracts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const arr = contracts.filter((c) => {
      if (commercialFilter !== 'all' && c.commercial_id !== commercialFilter) return false;
      if (entityFilter !== 'all') {
        const entity = getCommercialById(c.commercial_id)?.entity;
        if (entity !== entityFilter) return false;
      }
      if (q) {
        const hay = `${c.client_name ?? ''} ${c.contract_number ?? ''} ${c.commercial_name ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (sortMode === 'echeance-asc' || sortMode === 'echeance-desc') {
      const dir = sortMode === 'echeance-asc' ? 1 : -1;
      arr.sort((a, b) => {
        const ea = getEndTime(a);
        const eb = getEndTime(b);
        if (ea == null && eb == null) return 0;
        if (ea == null) return 1;
        if (eb == null) return -1;
        return (ea - eb) * dir;
      });
    } else if (sortMode === 'recent') {
      arr.sort((a, b) => {
        const ta = new Date(a.validated_at ?? a.created_at ?? 0).getTime();
        const tb = new Date(b.validated_at ?? b.created_at ?? 0).getTime();
        return tb - ta;
      });
    }
    return arr;
  }, [contracts, entityFilter, commercialFilter, searchQuery, sortMode, getCommercialById]);

  const hasActiveFilter = entityFilter !== 'all' || commercialFilter !== 'all' || searchQuery.trim() !== '' || sortMode !== 'recent';
  const isFlatList = sortMode === 'recent' || sortMode === 'echeance-asc' || sortMode === 'echeance-desc';
  const groups = isFlatList ? [] : groupByCommercial(filteredContracts);
  const totalRenewing = filteredContracts.filter(isContractRenewingSoon).length;

  const [previewContract, setPreviewContract] = useState<Contract | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const handleVisualize = async (contract: Contract) => {
    if (!contract.proposal_id) return;
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
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Contrats Services</h1>
            {filteredContracts.length > 0 && <Badge variant="secondary">{filteredContracts.length}{filteredContracts.length !== contracts.length ? ` / ${contracts.length}` : ''}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Propositions services validées. Renseignez le mois de mise en place et la durée pour chaque contrat.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onCreateManual && (
            <Button variant="outline" size="sm" onClick={onCreateManual} className="gap-1">
              <Plus className="h-4 w-4" />
              Créer un contrat manuellement
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={handleCreateQuick}
            disabled={createQuick.isPending}
            className="gap-1"
          >
            <Zap className="h-4 w-4" />
            {createQuick.isPending ? 'Création…' : 'Créer contrat rapide'}
          </Button>
        </div>
      </div>

      {contracts.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher (client, n° de contrat, commercial)…"
                className="h-8 pl-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Trier par</Label>
              <Select value={sortMode} onValueChange={setSortMode}>
                <SelectTrigger className="h-8 w-[220px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Plus récents</SelectItem>
                  <SelectItem value="echeance-asc">Échéance (croissante)</SelectItem>
                  <SelectItem value="echeance-desc">Échéance (décroissante)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3 p-3 border border-border rounded-lg bg-muted/20">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Filter className="h-3.5 w-3.5" /> Filtres
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Enseigne</Label>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="cybertek-pro">Cybertek Pro</SelectItem>
                  <SelectItem value="grosbill-pro">Grosbill Pro</SelectItem>
                  <SelectItem value="3d-dental">3D Dental</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Commercial</Label>
              <Select value={commercialFilter} onValueChange={setCommercialFilter}>
                <SelectTrigger className="h-8 w-[200px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {commercialOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setEntityFilter('all'); setCommercialFilter('all'); setSearchQuery(''); setSortMode('recent'); }}
                className="h-8 gap-1 text-xs"
              >
                <X className="h-3 w-3" /> Réinitialiser
              </Button>
            )}
          </div>
        </div>
      )}

      {totalRenewing > 0 && <ContractRenewalAlert />}

      {contracts.length === 0 && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">Aucun contrat services pour l'instant.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Validez une proposition depuis l'Historique Services pour la retrouver ici.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {isFlatList
          ? filteredContracts.map((c) => (
              <ContractRow
                key={c.id}
                contract={c}
                onVisualize={handleVisualize}
                defaultExpanded={autoExpandId === c.id}
                hideFinancialPartner
                onPlanIntervention={onPlanIntervention}
              />
            ))
          : groups.map((g) => (
              <CommercialGroup
                key={g.commercialId}
                commercialName={g.commercialName}
                contracts={g.contracts}
                onVisualize={handleVisualize}
                autoExpandId={autoExpandId}
                onPlanIntervention={onPlanIntervention}
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

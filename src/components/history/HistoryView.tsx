import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  History as HistoryIcon, 
  FileText, 
  Download, 
  Calendar,
  Trash2,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Search,
  User,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { ValidateProposalButton } from '@/components/history/ValidateProposalButton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Interface pour les données de liste (sans HTML volumineux)
interface ProposalExportSummary {
  id: string;
  proposal_name: string;
  file_name: string;
  client_name: string | null;
  template_name: string;
  status: string;
  row_count: number;
  options_count: number;
  created_at: string;
  commercial_id: string | null;
  commercial_name: string | null;
  montant_investissement: number | null;
  loyer_mensuel_ht: number | null;
  financial_partner: string | null;
  duration_months: number | null;
  has_proposal_state: boolean;
}

interface HistoryViewProps {
  onSelectEntry?: (entry: ProposalExportSummary) => void;
  onLoadProposal?: (proposalState: Record<string, any>) => void;
  isAdmin?: boolean;
  highlightedIds?: string[];
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export function HistoryView({ onSelectEntry, onLoadProposal, isAdmin = false, highlightedIds = [] }: HistoryViewProps) {
  const [exports, setExports] = useState<ProposalExportSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterCommercial, setFilterCommercial] = useState<string>('all');
  
  // Accordéons admin (groupement par commercial)
  const [expandedCommercials, setExpandedCommercials] = useState<Set<string>>(new Set());
  
  // États pour la visualisation
  const [previewingEntry, setPreviewingEntry] = useState<ProposalExportSummary | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);
  const [loadingLoadId, setLoadingLoadId] = useState<string | null>(null);
  const [confirmLoadEntry, setConfirmLoadEntry] = useState<ProposalExportSummary | null>(null);

  // Charger le contenu HTML à la demande
  const fetchHtmlContent = async (id: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('proposal_exports')
      .select('pdf_html_content')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return data.pdf_html_content;
  };

  const fetchExports = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const selectColumns = 'id, proposal_name, file_name, client_name, template_name, status, row_count, options_count, created_at, commercial_id, commercial_name, montant_investissement, proposal_state';
      const batchSize = 1000;
      let allData: any[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error: fetchError } = await supabase
          .from('proposal_exports')
          .select(selectColumns)
          .eq('proposal_type', 'location')
          .order('created_at', { ascending: false })
          .range(from, from + batchSize - 1);

        if (fetchError) throw fetchError;
        if (!data || data.length === 0) { hasMore = false; break; }
        allData = allData.concat(data);
        if (data.length < batchSize) hasMore = false;
        from += batchSize;
      }

      const data = allData;

      const mapped = (data || []).map((item: any) => ({
        id: item.id,
        proposal_name: item.proposal_name,
        file_name: item.file_name,
        client_name: item.client_name,
        template_name: item.template_name,
        status: item.status,
        row_count: item.row_count,
        options_count: item.options_count,
        created_at: item.created_at,
        commercial_id: item.commercial_id,
        commercial_name: item.commercial_name,
        montant_investissement: item.montant_investissement,
        financial_partner: item.proposal_state?.proposals?.[0]?.refinanceur ?? null,
        duration_months: item.proposal_state?.proposals?.[0]?.duree ?? item.proposal_state?.matriceData?.duree ?? null,
        has_proposal_state: !!item.proposal_state,
      }));
      setExports(mapped);
    } catch (err) {
      console.error('Error fetching exports:', err);
      setError("Impossible de charger l'historique");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExports();
  }, []);

  // Auto-expand les commerciaux des highlighted entries
  useEffect(() => {
    if (highlightedIds.length > 0) {
      const highlighted = exports.filter(e => highlightedIds.includes(e.id));
      const commercialNames = new Set(highlighted.map(e => e.commercial_name || 'Sans commercial'));
      setExpandedCommercials(prev => new Set([...prev, ...commercialNames]));
    }
  }, [highlightedIds, exports]);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(dateStr));
  };

  const formatAmount = (amount: number | null) => {
    if (amount === null) return null;
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  // Filtrer les exports
  const filteredExports = exports.filter(entry => {
    const date = new Date(entry.created_at);
    const monthMatch = filterMonth === 'all' || date.getMonth() === parseInt(filterMonth);
    const yearMatch = filterYear === 'all' || date.getFullYear() === parseInt(filterYear);
    const commercialMatch = filterCommercial === 'all' || entry.commercial_name === filterCommercial;
    const searchMatch = !searchQuery || 
      entry.proposal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.commercial_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return monthMatch && yearMatch && commercialMatch && searchMatch;
  });

  // Années disponibles pour le filtre
  const availableYears = [...new Set(exports.map(e => new Date(e.created_at).getFullYear()))].sort((a, b) => b - a);
  
  // Commerciaux disponibles
  const availableCommercials = [...new Set(exports.map(e => e.commercial_name).filter(Boolean))].sort() as string[];

  // Grouper par commercial pour la vue admin
  const groupedByCommercial = filteredExports.reduce((acc, entry) => {
    const key = entry.commercial_name || 'Sans commercial';
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {} as Record<string, ProposalExportSummary[]>);

  const toggleCommercial = (name: string) => {
    setExpandedCommercials(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handlePreview = async (entry: ProposalExportSummary) => {
    setLoadingPreviewId(entry.id);
    try {
      const htmlContent = await fetchHtmlContent(entry.id);
      if (!htmlContent) {
        toast({ title: "Visualisation indisponible", description: "Le contenu n'est plus disponible.", variant: "destructive" });
        return;
      }
      setPreviewContent(htmlContent);
      setPreviewingEntry(entry);
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible de charger l'aperçu.", variant: "destructive" });
    } finally {
      setLoadingPreviewId(null);
    }
  };

  const handleClosePreview = () => {
    setPreviewingEntry(null);
    setPreviewContent(null);
  };

  const handleLoadProposal = async (entry: ProposalExportSummary) => {
    setLoadingLoadId(entry.id);
    try {
      const { data, error } = await supabase
        .from('proposal_exports')
        .select('proposal_state')
        .eq('id', entry.id)
        .single();
      
      if (error || !data || !(data as any).proposal_state) {
        toast({ title: "Chargement impossible", description: "Les données de cette proposition ne sont pas disponibles.", variant: "destructive" });
        return;
      }
      onLoadProposal?.((data as any).proposal_state);
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible de charger la proposition.", variant: "destructive" });
    } finally {
      setLoadingLoadId(null);
      setConfirmLoadEntry(null);
    }
  };

  const handleDownload = async (entry: ProposalExportSummary) => {
    setDownloadingId(entry.id);
    try {
      const htmlContent = await fetchHtmlContent(entry.id);
      if (!htmlContent) {
        toast({ title: "Téléchargement indisponible", description: "Le contenu n'est plus disponible.", variant: "destructive" });
        return;
      }
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        toast({ title: "Erreur", description: "Impossible d'ouvrir la fenêtre. Vérifiez les popups.", variant: "destructive" });
        return;
      }
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
          toast({ title: "PDF prêt", description: `Document "${entry.proposal_name}" préparé.` });
        }, 500);
      };
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible de générer le PDF.", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (entry: ProposalExportSummary) => {
    setDeletingId(entry.id);
    try {
      const { error: deleteError } = await supabase.from('proposal_exports').delete().eq('id', entry.id);
      if (deleteError) throw deleteError;
      setExports(prev => prev.filter(e => e.id !== entry.id));
      toast({ title: "Supprimé", description: `"${entry.proposal_name}" supprimé de l'historique.` });
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible de supprimer cette entrée.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  // renderEntry extrait hors composant pour éviter la recréation dans render
  const renderEntry = (entry: ProposalExportSummary) => {
    const isHighlighted = highlightedIds.includes(entry.id);
    return (
      <Card
        key={entry.id}
        className={cn(
          "group hover:border-primary/30 transition-colors",
          isHighlighted && "border-amber-400 bg-amber-50/30 dark:bg-amber-900/10"
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              entry.status === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            )}>
              {entry.status === 'success' ? <FileText className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-medium text-sm truncate">{entry.proposal_name}</h3>
                <Badge variant={entry.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                  {entry.status === 'success' ? 'Succès' : 'Erreur'}
                </Badge>
                {isHighlighted && (
                  <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600">Nouveau</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(entry.created_at)}
                </span>
                {entry.client_name && <span className="truncate">Client: {entry.client_name}</span>}
                {entry.montant_investissement && (
                  <span className="font-medium text-foreground">{formatAmount(entry.montant_investissement)}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                {entry.status === 'success' && (
                  <>
                    <span>{entry.row_count} lignes</span>
                    <span>{entry.options_count} options</span>
                    <span className="text-muted-foreground/60">• {entry.template_name}</span>
                  </>
                )}
                {isAdmin && entry.commercial_name && (
                  <span className="flex items-center gap-0.5 text-primary/70">
                    <User className="h-2.5 w-2.5" />
                    {entry.commercial_name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {entry.status === 'success' && (
                <>
                  {onLoadProposal && (
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => setConfirmLoadEntry(entry)}
                      disabled={loadingLoadId === entry.id || !entry.has_proposal_state}
                      title={entry.has_proposal_state ? "Charger pour modifier" : "Données non disponibles (ancien export)"}
                    >
                      {loadingLoadId === entry.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className={cn("h-3.5 w-3.5", !entry.has_proposal_state && "opacity-40")} />}
                    </Button>
                  )}
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => handlePreview(entry)}
                    disabled={loadingPreviewId === entry.id}
                    title="Visualiser"
                  >
                    {loadingPreviewId === entry.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => handleDownload(entry)}
                    disabled={downloadingId === entry.id}
                    title="Télécharger"
                  >
                    {downloadingId === entry.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  </Button>
                  <ValidateProposalButton
                    proposalId={entry.id}
                    clientName={entry.client_name || ''}
                    commercialId={entry.commercial_id || ''}
                    commercialName={entry.commercial_name || undefined}
                    amountHt={entry.montant_investissement || undefined}
                    templateName={entry.template_name}
                    financialPartner={entry.financial_partner || undefined}
                    durationMonths={entry.duration_months || undefined}
                  />
                </>
              )}
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(entry)}
                disabled={deletingId === entry.id}
                title="Supprimer"
              >
                {deletingId === entry.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h2 className="text-lg font-semibold">Historique des exports</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h2 className="text-lg font-semibold">Historique des exports</h2>
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="p-3 rounded-full bg-destructive/10 inline-block mb-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="font-medium text-sm mb-3">Erreur de chargement</h3>
              <Button variant="outline" size="sm" onClick={fetchExports}>
                <RefreshCw className="h-4 w-4 mr-2" />Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-0.5">Historique des exports</h2>
          <p className="text-muted-foreground text-sm">
            {filteredExports.length} proposition(s) {filteredExports.length !== exports.length ? `sur ${exports.length}` : 'exportée(s)'}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchExports}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="Mois" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les mois</SelectItem>
            {MONTHS_FR.map((m, i) => (
              <SelectItem key={i} value={String(i)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="h-8 w-28 text-sm">
            <SelectValue placeholder="Année" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {availableYears.map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isAdmin && availableCommercials.length > 0 && (
          <Select value={filterCommercial} onValueChange={setFilterCommercial}>
            <SelectTrigger className="h-8 w-44 text-sm">
              <SelectValue placeholder="Commercial" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les commerciaux</SelectItem>
              {availableCommercials.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Contenu */}
      {filteredExports.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="p-3 rounded-full bg-muted inline-block mb-3">
                <HistoryIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-sm mb-1">Aucun résultat</h3>
              <p className="text-xs text-muted-foreground">
                {exports.length === 0 ? "Les propositions exportées apparaîtront ici." : "Aucun export ne correspond aux filtres sélectionnés."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : isAdmin ? (
        /* Vue Admin : groupée par commercial */
        <div className="space-y-3">
          {Object.entries(groupedByCommercial)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([commercialName, entries]) => {
              const isExpanded = expandedCommercials.has(commercialName);
              const hasHighlighted = entries.some(e => highlightedIds.includes(e.id));
              return (
                <Card key={commercialName} className={cn(hasHighlighted && "border-amber-300")}>
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors rounded-t-lg"
                    onClick={() => toggleCommercial(commercialName)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium text-sm">{commercialName}</span>
                      <Badge variant="secondary" className="text-xs">{entries.length}</Badge>
                      {hasHighlighted && (
                        <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600">Nouveau</Badge>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2 border-t">
                      <div className="pt-2 space-y-2">
                        {entries.map(entry => renderEntry(entry))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
        </div>
      ) : (
        /* Vue commerciale : liste simple */
        <div className="space-y-3">
          {filteredExports.map((entry) => renderEntry(entry))}
        </div>
      )}

      {/* Dialog de visualisation */}
      <Dialog open={!!previewingEntry} onOpenChange={handleClosePreview}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-[90vh] p-0 flex flex-col">
          <DialogHeader className="p-4 border-b shrink-0">
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="truncate">{previewingEntry?.proposal_name}</DialogTitle>
              <div className="flex items-center gap-2">
                {previewingEntry && (
                  <Button
                    variant="outline" size="sm"
                    onClick={() => handleDownload(previewingEntry)}
                    disabled={downloadingId === previewingEntry.id}
                  >
                    {downloadingId === previewingEntry.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Télécharger PDF
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-muted/30">
            {previewContent ? (
              <iframe srcDoc={previewContent} className="w-full h-full border-0" title="Aperçu de la proposition" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de chargement */}
      <AlertDialog open={!!confirmLoadEntry} onOpenChange={(open) => !open && setConfirmLoadEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Charger cette proposition ?</AlertDialogTitle>
            <AlertDialogDescription>
              La proposition en cours sera remplacée par « {confirmLoadEntry?.proposal_name} ». Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmLoadEntry && handleLoadProposal(confirmLoadEntry)}>
              Charger
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

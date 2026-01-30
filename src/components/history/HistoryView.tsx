import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
}

interface HistoryViewProps {
  onSelectEntry?: (entry: ProposalExportSummary) => void;
}

export function HistoryView({ onSelectEntry }: HistoryViewProps) {
  const [exports, setExports] = useState<ProposalExportSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // États pour la visualisation
  const [previewingEntry, setPreviewingEntry] = useState<ProposalExportSummary | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);

  // Charger le contenu HTML à la demande
  const fetchHtmlContent = async (id: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('proposal_exports')
      .select('pdf_html_content')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.error('Error fetching HTML content:', error);
      return null;
    }
    return data.pdf_html_content;
  };

  const fetchExports = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Sélection explicite des colonnes (exclut pdf_html_content pour éviter le timeout)
      const { data, error: fetchError } = await supabase
        .from('proposal_exports')
        .select('id, proposal_name, file_name, client_name, template_name, status, row_count, options_count, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        throw fetchError;
      }

      setExports(data || []);
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

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(dateStr));
  };

  const handlePreview = async (entry: ProposalExportSummary) => {
    setLoadingPreviewId(entry.id);
    
    try {
      const htmlContent = await fetchHtmlContent(entry.id);
      
      if (!htmlContent) {
        toast({
          title: "Visualisation indisponible",
          description: "Le contenu de ce document n'est plus disponible.",
          variant: "destructive",
        });
        return;
      }

      setPreviewContent(htmlContent);
      setPreviewingEntry(entry);
    } catch (err) {
      console.error('Error loading preview:', err);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'aperçu.",
        variant: "destructive",
      });
    } finally {
      setLoadingPreviewId(null);
    }
  };

  const handleClosePreview = () => {
    setPreviewingEntry(null);
    setPreviewContent(null);
  };

  const handleDownload = async (entry: ProposalExportSummary) => {
    setDownloadingId(entry.id);

    try {
      // Charger le contenu HTML à la demande
      const htmlContent = await fetchHtmlContent(entry.id);
      
      if (!htmlContent) {
        toast({
          title: "Téléchargement indisponible",
          description: "Le contenu de ce document n'est plus disponible.",
          variant: "destructive",
        });
        return;
      }

      // Ouvrir une fenêtre d'impression avec le contenu HTML
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        toast({
          title: "Erreur",
          description: "Impossible d'ouvrir la fenêtre. Vérifiez les popups.",
          variant: "destructive",
        });
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
          toast({
            title: "PDF prêt",
            description: `Document "${entry.proposal_name}" préparé pour impression.`,
          });
        }, 500);
      };
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (entry: ProposalExportSummary) => {
    setDeletingId(entry.id);

    try {
      const { error: deleteError } = await supabase
        .from('proposal_exports')
        .delete()
        .eq('id', entry.id);

      if (deleteError) {
        throw deleteError;
      }

      setExports(prev => prev.filter(e => e.id !== entry.id));
      toast({
        title: "Supprimé",
        description: `"${entry.proposal_name}" a été supprimé de l'historique.`,
      });
    } catch (err) {
      console.error('Error deleting export:', err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer cette entrée.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div>
          <h2 className="text-lg font-semibold mb-1">Historique des exports</h2>
          <p className="text-muted-foreground text-sm">
            Chargement de l'historique...
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div>
          <h2 className="text-lg font-semibold mb-1">Historique des exports</h2>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="p-3 rounded-full bg-destructive/10 inline-block mb-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="font-medium text-sm mb-3">Erreur de chargement</h3>
              <Button variant="outline" size="sm" onClick={fetchExports}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-1">Historique des exports</h2>
          <p className="text-muted-foreground text-sm">
            {exports.length > 0 
              ? `${exports.length} proposition(s) exportée(s)` 
              : 'Consultez et téléchargez les propositions générées.'}
          </p>
        </div>
        {exports.length > 0 && (
          <Button variant="ghost" size="icon" onClick={fetchExports}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {exports.length > 0 ? (
        <div className="space-y-3">
          {exports.map((entry) => (
            <Card 
              key={entry.id}
              className="group hover:border-primary/30 transition-colors"
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    entry.status === 'success' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {entry.status === 'success' ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-medium text-sm truncate">{entry.proposal_name}</h3>
                      <Badge variant={entry.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                        {entry.status === 'success' ? 'Succès' : 'Erreur'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(entry.created_at)}
                      </span>
                      {entry.client_name && (
                        <span className="truncate">Client: {entry.client_name}</span>
                      )}
                    </div>
                    
                    {entry.status === 'success' && (
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>{entry.row_count} lignes</span>
                        <span>{entry.options_count} options</span>
                        <span className="text-muted-foreground/60">• {entry.template_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {entry.status === 'success' && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handlePreview(entry)}
                          disabled={loadingPreviewId === entry.id}
                          title="Visualiser"
                        >
                          {loadingPreviewId === entry.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownload(entry)}
                          disabled={downloadingId === entry.id}
                          title="Télécharger"
                        >
                          {downloadingId === entry.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(entry)}
                      disabled={deletingId === entry.id}
                      title="Supprimer"
                    >
                      {deletingId === entry.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="p-3 rounded-full bg-muted inline-block mb-3">
                <HistoryIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-sm mb-1">Aucun historique</h3>
              <p className="text-xs text-muted-foreground">
                Les propositions exportées apparaîtront ici.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de visualisation plein écran */}
      <Dialog open={!!previewingEntry} onOpenChange={handleClosePreview}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-[90vh] p-0 flex flex-col">
          <DialogHeader className="p-4 border-b shrink-0">
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="truncate">
                {previewingEntry?.proposal_name}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {previewingEntry && (
                  <Button
                    variant="outline"
                    size="sm"
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
              <iframe
                srcDoc={previewContent}
                className="w-full h-full border-0"
                title="Aperçu de la proposition"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

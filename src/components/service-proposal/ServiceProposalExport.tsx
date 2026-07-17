/**
 * Composant d'export PDF pour une Proposition Services (standalone).
 *
 * Utilise generateServiceProposalHtml() comme source unique de génération
 * puis convertit en vrai PDF via html2canvas + jsPDF.
 */
import { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  FileText,
  CheckCircle,
  Loader2,
  User,
  Package,
  Calculator,
} from 'lucide-react';
import { useServiceProposalStore } from '@/stores/serviceProposalStore';
import { useRentalProposalStore } from '@/stores/rentalProposalStore';
import { useTemplateEditorStore } from '@/stores/templateEditorStore';
import { useOptionsAdminStore } from '@/stores/optionsAdminStore';
import { useTemplateSync } from '@/hooks/useTemplateSync';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ENTITIES, getCommercialById } from '@/data/commerciaux';
import { generateServiceProposalHtml } from '@/lib/service-proposal-html-generator';
import { buildHtmlDataFromStore } from '@/lib/service-proposal-data-builder';
import { htmlToPdfBlob } from '@/lib/html-to-pdf';
import { resolveServiceTemplate } from '@/lib/service-template-selection';

export function ServiceProposalExport({ mode = 'devis' }: { mode?: 'devis' | 'contrat' } = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const { isLoadingVersion, loadVersionPages } = useTemplateSync();

  const store = useServiceProposalStore();
  const {
    clientData,
    commercialData,
    lignesData,
    proposalName,
    totalInvest,
    currentServiceProposalId,
  } = store;

  const selectedTemplateId = store.selectedTemplateId;
  const rentalSelectedTemplateId = useRentalProposalStore((s) => s.selectedTemplateId);
  const adminOptions = useOptionsAdminStore((s) => s.options);

  const { getTemplatePublishedVersion, allTemplates } =
    useTemplateEditorStore();

  const activeTemplate = useMemo(() => {
    return resolveServiceTemplate({
      selectedTemplateIds: [selectedTemplateId, rentalSelectedTemplateId],
      allTemplates,
      getTemplatePublishedVersion,
    });
  }, [selectedTemplateId, rentalSelectedTemplateId, allTemplates, getTemplatePublishedVersion]);

  const effectiveTemplateId = activeTemplate?.id ?? selectedTemplateId ?? rentalSelectedTemplateId ?? null;

  const latestVersion = activeTemplate ? getTemplatePublishedVersion(activeTemplate.id) : null;

  useEffect(() => {
    if (latestVersion && latestVersion.pages.length === 0 && !isLoadingVersion) {
      loadVersionPages(latestVersion.id);
    }
  }, [latestVersion, isLoadingVersion, loadVersionPages]);
  const visibleTemplatePages = (latestVersion?.pages ?? []).filter((p: any) => {
    const s = p.documentScope ?? 'both';
    return s === 'both' || s === mode;
  });
  const totalPages = visibleTemplatePages.length;

  const selectedCommercial = useMemo(() => {
    if (!commercialData.commercialId) return null;
    return getCommercialById(commercialData.commercialId);
  }, [commercialData.commercialId]);

  const entityLabel = useMemo(() => {
    if (!commercialData.entity) return null;
    return (
      ENTITIES.find((e) => e.id === commercialData.entity)?.label || commercialData.entity
    );
  }, [commercialData.entity]);

  const formatNumber = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const generateFileName = () => {
    const baseName =
      proposalName || clientData.raisonSociale || clientData.nom || 'Proposition_Services';
    const safe = baseName
      .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ\s-]/g, '')
      .replace(/\s+/g, '_');
    const date = new Date().toISOString().split('T')[0];
    return `Proposition_Services_${safe}_${date}.pdf`;
  };

  // --- Sauvegarde dans proposal_exports ---
  const saveToHistory = async (htmlContent: string, status: 'success' | 'error') => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const displayName =
        proposalName ||
        `Proposition Services ${clientData.raisonSociale || clientData.nom}` ||
        'Proposition Services';

      const snapshot =
        status === 'success'
          ? {
              kind: 'service-proposal',
              clientData,
              commercialData,
              lignesData,
              selectedTemplateId: effectiveTemplateId,
              activeTemplateId: activeTemplate?.id ?? null,
              proposalName,
              totalInvest,
              selectedServices: store.selectedServices,
              paymentFrequency: store.paymentFrequency,
              paymentMode: store.paymentMode,
              contractDuration: store.contractDuration,
              startDate: store.startDate,
              totalServicesHt: store.totalServicesHt,
              nosOptions: store.nosOptions,
              siteAddresses: store.siteAddresses,
              operationalContact: store.operationalContact,
              externalProviders: store.externalProviders,
              selectedCommercial: selectedCommercial
                ? {
                    nom: selectedCommercial.nom,
                    telephone: selectedCommercial.telephone,
                    email: selectedCommercial.email,
                    adresse: selectedCommercial.adresse,
                  }
                : null,
              entityLabel,
            }
          : null;

      await supabase.from('proposal_exports').insert({
        proposal_name: displayName,
        file_name: generateFileName(),
        client_name: clientData.raisonSociale || clientData.nom || null,
        template_id: activeTemplate?.id || null,
        template_name: activeTemplate?.name || 'Template par défaut',
        status,
        row_count: lignesData.length,
        options_count: 0,
        pdf_html_content: status === 'success' ? htmlContent : null,
        created_by: user.id,
        commercial_id: commercialData.commercialId || null,
        commercial_name: selectedCommercial?.nom || null,
        montant_investissement: totalInvest || null,
        selected_options_names: [],
        selected_nos_options_names: [],
        proposal_state: snapshot,
        proposal_type: 'service',
        service_proposal_id: currentServiceProposalId,
      } as any);
    } catch (err) {
      console.error('Failed to save service proposal to history:', err);
    }
  };

  const handleDownloadPDF = async () => {
    if (!latestVersion || latestVersion.pages.length === 0) return;
    setIsGenerating(true);
    try {
      const data = buildHtmlDataFromStore(store, {
        latestVersion: { pages: latestVersion.pages ?? [] },
        adminOptions,
        docTitle: generateFileName().replace(/\.pdf$/i, ''),
      });
      const html = await generateServiceProposalHtml(data, mode);
      const blob = await htmlToPdfBlob(html);
      const fileName = generateFileName();

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (!isGenerated) {
        await saveToHistory(html, 'success');
      }
      setIsGenerated(true);
      toast({
        title: 'PDF généré',
        description: `Le document "${fileName}" a été téléchargé.`,
      });
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      await saveToHistory('', 'error');
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la génération du PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exporter la proposition</CardTitle>
        <CardDescription>
          Générez et téléchargez le document final au format PDF.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <User className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Client</p>
            <p className="font-medium truncate">
              {clientData.raisonSociale || clientData.nom || '-'}
            </p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Lignes services</p>
            <p className="font-medium">{lignesData.length}</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <Calculator className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Total HT</p>
            <p className="font-medium">{formatNumber(totalInvest)} €</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Pages template</p>
            <p className="font-medium">{totalPages}</p>
          </div>
        </div>

        <Separator />

        <div className="text-center py-8 space-y-4">
          {isGenerated ? (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <div>
                <p className="font-medium text-success">Document généré avec succès</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Vous pouvez télécharger à nouveau le PDF si nécessaire
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                <Download className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">Proposition prête à l'export</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cliquez sur le bouton ci-dessous pour générer le PDF
                </p>
              </div>
            </>
          )}

          <Button
            size="lg"
            onClick={handleDownloadPDF}
            disabled={isGenerating || !latestVersion}
            className="min-w-[200px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {isGenerated ? 'Télécharger à nouveau' : 'Télécharger le PDF'}
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            Nom du fichier : {generateFileName()}
          </p>
        </div>

        {activeTemplate && (
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Template utilisé :</span>
              <span className="font-medium">{activeTemplate.name}</span>
            </div>
            <Badge variant="secondary">Actif</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

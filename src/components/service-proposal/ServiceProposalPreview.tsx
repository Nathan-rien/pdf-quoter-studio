/**
 * Aperçu PDF pour une Proposition Services.
 * Utilise generateServiceProposalHtml() comme source unique et rend le résultat
 * dans un iframe par page pour garantir une parité stricte avec l'export.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { useServiceProposalStore } from '@/stores/serviceProposalStore';
import { useRentalProposalStore } from '@/stores/rentalProposalStore';
import { useTemplateEditorStore } from '@/stores/templateEditorStore';
import { useOptionsAdminStore } from '@/stores/optionsAdminStore';
import { useTemplateSync } from '@/hooks/useTemplateSync';
import { CANVAS_DISPLAY_MAX_WIDTH } from '@/lib/canvas-constants';
import { generateServiceProposalHtml } from '@/lib/service-proposal-html-generator';
import { buildHtmlDataFromStore } from '@/lib/service-proposal-data-builder';
import type { TemplateVersion } from '@/types/template-editor';
import type { DocumentScope } from '@/types/pdf-template';

export function ServiceProposalPreview({ mode: initialMode = 'devis' }: { mode?: 'devis' | 'contrat' } = {}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pagesHtml, setPagesHtml] = useState<string[]>([]);
  const [rendering, setRendering] = useState(false);
  const [mode, setMode] = useState<'devis' | 'contrat'>(initialMode);

  const store = useServiceProposalStore();
  const { clientData, lignesData, proposalName } = store;


  const adminOptions = useOptionsAdminStore((s) => s.options);
  const selectedTemplateId = useRentalProposalStore((s) => s.selectedTemplateId);

  const { isLoading, hasLoaded, loadVersionPages, isLoadingVersion } = useTemplateSync();
  const {
    allTemplates,
    getTemplatePublishedVersion,
  } = useTemplateEditorStore();

  const activeTemplate = useMemo(() => {
    if (selectedTemplateId) {
      const found = allTemplates.find((t) => t.id === selectedTemplateId);
      if (found) return found;
    }
    const active = allTemplates.find((t) => t.isActive && !!getTemplatePublishedVersion(t.id));
    if (active) return active;
    return allTemplates.find((t) => !!getTemplatePublishedVersion(t.id)) ?? null;
  }, [selectedTemplateId, allTemplates, getTemplatePublishedVersion]);

  const currentVersion: TemplateVersion | null = activeTemplate
    ? getTemplatePublishedVersion(activeTemplate.id)
    : null;

  const [pagesLoaded, setPagesLoaded] = useState(false);
  useEffect(() => {
    const load = async () => {
      if (!hasLoaded) return;
      if (!activeTemplate) {
        setPagesLoaded(true);
        return;
      }
      const version = getTemplatePublishedVersion(activeTemplate.id);
      if (!version) {
        setPagesLoaded(true);
        return;
      }
      if (version.pages.length === 0) {
        await loadVersionPages(version.id);
      }
      setPagesLoaded(true);
    };
    setPagesLoaded(false);
    load();
  }, [hasLoaded, activeTemplate, getTemplatePublishedVersion, loadVersionPages]);

  const scopeMatches = (p: any) => {
    const s: DocumentScope = p.documentScope ?? 'both';
    return s === 'both' || s === mode;
  };
  const visibleTemplatePages = currentVersion?.pages.filter(scopeMatches) ?? [];
  const totalPages = Math.max(1, visibleTemplatePages.length);

  // Regenerate HTML each time relevant store fields or template change
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!pagesLoaded || !currentVersion || currentVersion.pages.length === 0) {
        setPagesHtml([]);
        return;
      }
      setRendering(true);
      try {
        const data = buildHtmlDataFromStore(store, {
          latestVersion: { pages: currentVersion.pages },
          adminOptions,
          docTitle: proposalName || clientData.raisonSociale || 'Aperçu',
        });
        const fullHtml = await generateServiceProposalHtml(data, mode);
        // Split into per-page documents so navigation is instant
        const parser = new DOMParser();
        const doc = parser.parseFromString(fullHtml, 'text/html');
        const headHtml = doc.head.innerHTML;
        const sheets = Array.from(doc.body.querySelectorAll<HTMLElement>('.page-sheet'));
        const perPageDocs = sheets.map(
          (s) =>
            `<!DOCTYPE html><html><head>${headHtml}<style>body{margin:0;background:#fff;}</style></head><body>${s.outerHTML}</body></html>`,
        );
        if (!cancelled) setPagesHtml(perPageDocs);
      } catch (err) {
        console.error('[ServiceProposalPreview] generation error', err);
        if (!cancelled) setPagesHtml([]);
      } finally {
        if (!cancelled) setRendering(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pagesLoaded,
    currentVersion,
    mode,
    adminOptions,
    store.clientData,
    store.commercialData,
    store.lignesData,
    store.selectedServices,
    store.paymentFrequency,
    store.paymentMode,
    store.contractDuration,
    store.startDate,
    store.totalServicesHt,
    store.totalInvest,
    store.nosOptions,
    store.siteAddresses,
    store.operationalContact,
    store.externalProviders,
    store.proposalName,
  ]);

  useEffect(() => {
    if (currentPage > pagesHtml.length && pagesHtml.length > 0) setCurrentPage(1);
  }, [pagesHtml.length, currentPage]);

  if ((isLoading && !hasLoaded) || isLoadingVersion || !pagesLoaded) {
    return <LoadingState message="Chargement du template..." />;
  }

  const displayHtml = pagesHtml[currentPage - 1] ?? '';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {proposalName || clientData.raisonSociale || 'Proposition Services'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">
            {lignesData.length} ligne{lignesData.length > 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {totalPages} page{totalPages > 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 rounded-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          Page {currentPage} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mx-auto w-full" style={{ maxWidth: `${CANVAS_DISPLAY_MAX_WIDTH}px` }}>
        <div
          className="aspect-[210/297] bg-white rounded-lg ring-1 ring-border relative overflow-hidden w-full"
          style={{ maxWidth: CANVAS_DISPLAY_MAX_WIDTH }}
        >
          {rendering && pagesHtml.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingState message="Génération de l'aperçu..." />
            </div>
          ) : displayHtml ? (
            <iframe
              key={currentPage}
              title={`Aperçu page ${currentPage}`}
              srcDoc={displayHtml}
              sandbox="allow-same-origin"
              className="absolute inset-0 w-full h-full border-0"
              style={{ background: '#fff' }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              Aucun contenu à afficher
            </div>
          )}
          <div className="absolute bottom-0 right-0 px-2 py-1 z-50 pointer-events-none">
            <span className="text-[9px] text-muted-foreground bg-white/80 rounded px-1">
              Page {currentPage}/{totalPages}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

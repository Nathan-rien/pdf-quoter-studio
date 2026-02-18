/**
 * Composant d'export PDF pour la proposition de location
 * Génère un PDF téléchargeable ou envoie par email
 * 
 * IMPORTANT: Utilise le template sélectionné (selectedTemplateId) et génère
 * le HTML fidèle aux éléments du template (images, styles, positions)
 */

import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  FileText, 
  CheckCircle, 
  Loader2,
  User,
  Package,
  Calculator,
  Settings,
  Mail
} from 'lucide-react';
import { useRentalProposalStore } from '@/stores/rentalProposalStore';
import { useTemplateEditorStore } from '@/stores/templateEditorStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { EmailSendForm } from './EmailSendForm';
import { DEFAULT_CONTRACT_PAGES, OPTIONS_PER_PAGE, LINES_PER_PAGE, CANVAS_SCALE, INVEST_LINES_PAGE1, INVEST_LINES_CONTINUATION, INVEST_FOOTER_RESERVED_LINES } from '@/lib/canvas-constants';
import { generatePDFDocumentHTML, clearImageCache, renderFlowTextElementToHTML } from '@/lib/pdf-html-generator';
import type { TextContent } from '@/types/template-editor';

export function RentalProposalExport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const {
    clientData,
    matriceData,
    lignesData,
    servicesInclus,
    optionsServices,
    nosOptions,
    proposalName,
    selectedTemplateId,
    getCalculatedValues,
    getSelectedCommercial,
    getAllProposalsCalculations,
  } = useRentalProposalStore();

  const investShowPrices = matriceData.investShowPrices;

  const { getActiveTemplate, getTemplateLatestVersion, allTemplates } = useTemplateEditorStore();
  
  // Utiliser le template sélectionné dans le workflow, ou fallback sur le template actif
  const activeTemplate = useMemo(() => {
    if (selectedTemplateId) {
      return allTemplates.find(t => t.id === selectedTemplateId) || getActiveTemplate();
    }
    return getActiveTemplate();
  }, [selectedTemplateId, allTemplates, getActiveTemplate]);
  
  const calculatedValues = getCalculatedValues();
  const selectedCommercial = getSelectedCommercial();
  const selectedOptions = optionsServices.filter(opt => opt.selected);
  const selectedNosOptions = nosOptions.filter(opt => opt.selected);
  
  // Utiliser le nombre réel de pages de la version publiée
  const latestVersion = activeTemplate ? getTemplateLatestVersion(activeTemplate.id) : null;
  const totalPages = latestVersion?.pages.length || DEFAULT_CONTRACT_PAGES;

  const formatNumber = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const generateFileName = () => {
    const name = proposalName || clientData.nom || 'Proposition';
    const safeName = name.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ\s-]/g, '').replace(/\s+/g, '_');
    const date = new Date().toISOString().split('T')[0];
    return `${safeName}_${date}.pdf`;
  };

  const saveToHistory = async (htmlContent: string, status: 'success' | 'error') => {
    try {
      // Récupérer l'utilisateur connecté pour le created_by
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('No authenticated user - cannot save to history');
        return;
      }
      
      const displayName = proposalName || `Proposition ${clientData.nom}` || 'Proposition Commerciale';
      
      await supabase.from('proposal_exports').insert({
        proposal_name: displayName,
        file_name: generateFileName(),
        client_name: clientData.nom || null,
        template_id: activeTemplate?.id || null,
        template_name: activeTemplate?.name || 'Template par défaut',
        status,
        row_count: lignesData.length,
        options_count: selectedOptions.length,
        pdf_html_content: status === 'success' ? htmlContent : null,
        created_by: user.id,
      });
    } catch (err) {
      console.error('Failed to save to history:', err);
      // Ne pas bloquer l'export si l'historique échoue
    }
  };

  /**
   * Attend le chargement complet des fonts et images dans une fenêtre
   */
  const waitForAssetsReady = async (win: Window): Promise<void> => {
    const TIMEOUT_MS = 5000;
    
    // 1) Attendre que les polices soient chargées
    try {
      const fontsPromise = (win.document as any).fonts?.ready;
      if (fontsPromise) {
        await Promise.race([
          fontsPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Fonts timeout')), TIMEOUT_MS))
        ]);
      }
    } catch (err) {
      console.warn('[PDF Export] Fonts loading timeout or error:', err);
    }
    
    // 2) Attendre que toutes les images soient décodées
    const images = Array.from(win.document.querySelectorAll('img')) as HTMLImageElement[];
    const imagePromises = images.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, TIMEOUT_MS);
        img.onload = () => { clearTimeout(timeout); resolve(); };
        img.onerror = () => { clearTimeout(timeout); resolve(); };
        // Utiliser decode() si disponible (meilleure garantie)
        if (typeof img.decode === 'function') {
          img.decode().then(() => { clearTimeout(timeout); resolve(); }).catch(() => { clearTimeout(timeout); resolve(); });
        }
      });
    });
    
    await Promise.all(imagePromises);
    
    // 3) Laisser 2 cycles de layout pour stabiliser le rendu
    await new Promise<void>(resolve => {
      win.requestAnimationFrame(() => {
        win.requestAnimationFrame(() => resolve());
      });
    });
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    
    try {
      // Vider le cache d'images pour éviter les données obsolètes
      clearImageCache();
      
      // Générer le contenu HTML du PDF avec le template sélectionné
      const htmlContent = await generatePDFContentFromTemplate();
      
      // Créer une fenêtre d'impression avec le contenu formaté
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        toast({
          title: "Erreur",
          description: "Impossible d'ouvrir la fenêtre d'impression. Vérifiez les popups.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      const fileName = generateFileName();
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Attendre le chargement complet de la fenêtre
      printWindow.onload = async () => {
        try {
          // Attendre fonts + images + 2x rAF
          await waitForAssetsReady(printWindow);
          
          // Imprimer
          printWindow.print();
        } catch (err) {
          console.error('[PDF Export] Error during asset loading:', err);
        }
      };
      
      // Gérer la fermeture et l'historique via onafterprint
      printWindow.onafterprint = async () => {
        printWindow.close();
        
        // Sauvegarder dans l'historique
        await saveToHistory(htmlContent, 'success');
        
        setIsGenerating(false);
        setIsGenerated(true);
        
        toast({
          title: "PDF généré",
          description: `Le document "${fileName}" a été préparé pour le téléchargement.`,
        });
      };
      
      // Fallback si onafterprint n'est pas déclenché (certains navigateurs)
      // Timeout de sécurité après 30s
      setTimeout(() => {
        if (isGenerating) {
          setIsGenerating(false);
        }
      }, 30000);

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      
      // Sauvegarder l'erreur dans l'historique
      await saveToHistory('', 'error');
      
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération du PDF.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  /**
   * Génère le contenu dynamique (client, produits, options, signature) pour chaque page
   */
  const generateDynamicContentByPage = useCallback((): { content: Record<number, string>; excludeIds: Record<number, string[]>; extraPagesAfter: Record<number, string[]> } => {
    const dynamicContent: Record<number, string> = {};
    const excludeElementIds: Record<number, string[]> = {};
    const date = new Date().toLocaleDateString('fr-FR');
    
    // Page 1 : Données client et commercial
    dynamicContent[1] = `
      <div class="dynamic-content" style="position: absolute; bottom: 40px; left: 5%; right: 5%; background: rgba(255,255,255,0.95); border-radius: 8px; padding: 12px; border: 1px solid #e5e7eb; z-index: 40;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <div style="font-size: 9px;">
              <p style="font-weight: 600; margin: 0;">${clientData.nom || 'Nom du client'}</p>
              <p style="color: #6b7280; margin: 2px 0;">${clientData.adresse || ''}</p>
              <p style="color: #6b7280; margin: 2px 0;">${clientData.codePostal} ${clientData.ville}</p>
              ${clientData.email ? `<p style="color: #6b7280; margin: 2px 0;">${clientData.email}</p>` : ''}
            </div>
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
              <span style="font-weight: 600; font-size: 10px;">Votre interlocuteur</span>
            </div>
            ${selectedCommercial ? `
              <div style="font-size: 9px;">
                <p style="font-weight: 600; margin: 0;">${selectedCommercial.nom}</p>
                ${selectedCommercial.telephone ? `<p style="color: #6b7280; margin: 2px 0;">${selectedCommercial.telephone}</p>` : ''}
                <p style="color: #6b7280; margin: 2px 0;">${selectedCommercial.email}</p>
              </div>
            ` : '<p style="font-size: 9px; color: #9ca3af; font-style: italic;">Non sélectionné</p>'}
          </div>
        </div>
      </div>
    `;
    
    // Page 4 : Tableau des produits (avec pagination multi-pages si nécessaire)
    // Tailles compactes pour les tableaux multi-pages
    const isCompact = lignesData.length > INVEST_LINES_PAGE1;
    const tableFontSize = isCompact ? '8px' : '9px';
    const cellPadding = isCompact ? '4px 6px' : '6px 8px';
    const headerPadding = isCompact ? '5px 6px' : '8px';

    const tableHeaderHTML = `
      <thead>
        <tr style="background: #f3f4f6;">
          <th style="padding: ${headerPadding}; text-align: left; font-weight: 600; font-size: ${tableFontSize};">Désignation</th>
          <th style="padding: ${headerPadding}; text-align: center; width: 60px; font-size: ${tableFontSize};">Qté</th>
          ${investShowPrices ? `
          <th style="padding: ${headerPadding}; text-align: right; width: 80px; font-size: ${tableFontSize};">P.U. HT</th>
          <th style="padding: ${headerPadding}; text-align: right; width: 80px; font-size: ${tableFontSize};">Total HT</th>
          ` : ''}
        </tr>
      </thead>`;
    
    const makeRowHTML = (ligne: typeof lignesData[0]) => `
      <tr>
        <td style="padding: ${cellPadding}; border-bottom: 1px solid #e5e7eb;">${ligne.designation || '-'}</td>
        <td style="padding: ${cellPadding}; border-bottom: 1px solid #e5e7eb; text-align: center;">${ligne.quantite}</td>
        ${investShowPrices ? `
        <td style="padding: ${cellPadding}; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatNumber(ligne.prixUnitaire)} €</td>
        <td style="padding: ${cellPadding}; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatNumber(ligne.totalHT)} €</td>
        ` : ''}
      </tr>`;
    
    // Découper les lignes en chunks avec logique de footer overflow
    const investChunksLocal: number[] = (() => {
      const totalLines = lignesData.length;
      if (totalLines <= INVEST_LINES_PAGE1) return [totalLines];
      const TOTAL_RESERVED = 6;
      const LAST_CHUNK_MAX = INVEST_LINES_CONTINUATION - TOTAL_RESERVED;
      const chunks = [INVEST_LINES_PAGE1];
      let remaining = totalLines - INVEST_LINES_PAGE1;
      while (remaining > 0) {
        chunks.push(Math.min(remaining, LAST_CHUNK_MAX));
        remaining -= LAST_CHUNK_MAX;
      }
      // Multi-page : toujours reporter le footer sur une page dédiée
      chunks.push(0);
      return chunks;
    })();
    
    const chunk0Lines = lignesData.slice(0, investChunksLocal[0]);
    const investChunkCount = investChunksLocal.length;
    const isMultiPage = investChunkCount > 1;
    
    // Générer le HTML des propositions financières
    const allProposals = getAllProposalsCalculations();
    const proposalsHTML = allProposals.map(({ proposal, calculations }) => `
      <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 12px; border: 1px solid #d1d5db; border-radius: 4px; overflow: hidden;">
        <thead>
          <tr style="background: #f3f4f6; border-bottom: 1px solid #d1d5db;">
            <th colspan="2" style="padding: 8px; text-align: left; font-weight: 600;">Location ${proposal.duree} mois</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 6px 8px;">Montant investissement</td>
            <td style="padding: 6px 8px; text-align: right;">${formatNumber(proposal.montantInvestissement)} € HT</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px;">Loyer mensuel HT</td>
            <td style="padding: 6px 8px; text-align: right; font-weight: 600;">${formatNumber(calculations.loyerMensuel)} € HT</td>
          </tr>
          ${matriceData.showCoutLocatifAnnuel && calculations.coutLocatifAnnuel !== null ? `
          <tr>
            <td style="padding: 6px 8px;">Coût locatif annuel</td>
            <td style="padding: 6px 8px; text-align: right;">${calculations.coutLocatifAnnuel.toFixed(2).replace('.', ',')} %</td>
          </tr>
          ` : ''}
        </tbody>
      </table>
    `).join('');
    
    // Éléments en flux relatif (sous la zone dynamique)
    let page4FlowElementIds: string[] = [];
    let flowElementsHTML = '';
    
    if (latestVersion) {
      const page4 = latestVersion.pages.find(p => p.pageNumber === 4);
      if (page4) {
        const investZone = page4.dynamicZones.find(z => z.type === 'invest_table');
        const zoneTopPercent = investZone?.position?.top ?? 28;
        const zoneHeightPercent = investZone?.position?.height ?? 48;
        const dynamicZoneBottomY = ((zoneTopPercent + zoneHeightPercent) / 100) * CANVAS_SCALE.height;
        
        const elementsBelow = page4.elements
          .filter(el => !el.isDynamic && el.position.y >= dynamicZoneBottomY && el.type === 'text')
          .sort((a, b) => a.position.y - b.position.y);
        
        page4FlowElementIds = elementsBelow.map(el => el.id);
        
        if (elementsBelow.length > 0) {
          flowElementsHTML = `<div style="margin-top: 16px;">${elementsBelow.map((el, idx) => renderFlowTextElementToHTML(el, idx)).join('')}</div>`;
        }
      }
    }
    
    // HTML du total investissement (affiché sur le dernier chunk avec données)
    const totalHTML = investShowPrices ? `
      <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
        <div class="summary-box" style="min-width: 180px;">
          <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 600;">
            <span>Total investissement :&nbsp;</span>
            <span>${formatNumber(matriceData.montantInvestissement)} € HT</span>
          </div>
        </div>
      </div>
    ` : '';
    
    // HTML de Votre offre + propositions + flow elements (affiché sur la page dédiée finale)
    const offreAndProposalsHTML = matriceData.investShowOffer !== false ? `
      <div style="font-weight: bold; font-size: 13px; margin-bottom: 4px; margin-top: 8px;">Votre offre</div>
      ${allProposals.length > 0 ? `
        <div class="location-proposals" style="margin-top: 8px;">
          ${proposalsHTML}
        </div>
      ` : ''}
      ${flowElementsHTML}
    ` : '';

    // Chunk 0 : page 4 du template
    const chunk0RowsHTML = chunk0Lines.map(makeRowHTML).join('');
    dynamicContent[4] = `
      <div class="dynamic-content" style="position: absolute; left: 5%; top: 5%; width: 90%; z-index: 40;">
        <div style="font-weight: bold; font-size: 13px; margin-bottom: 4px;">Vos investissements</div>
        <table class="product-table" style="width: 100%; border-collapse: collapse; font-size: ${tableFontSize}; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
          ${tableHeaderHTML}
          <tbody>${chunk0RowsHTML}</tbody>
        </table>
        ${!isMultiPage ? totalHTML + offreAndProposalsHTML : ''}
      </div>
    `;
    
    // Pages de continuation (extra pages insérées après la page 4)
    const extraPagesAfter: Record<number, string[]> = {};
    if (isMultiPage) {
      const extraPages: string[] = [];
      let offset = investChunksLocal[0]; // skip chunk 0 already rendered
      for (let ci = 1; ci < investChunksLocal.length; ci++) {
        const chunkLineCount = investChunksLocal[ci];
        const chunkLines = lignesData.slice(offset, offset + chunkLineCount);
        offset += chunkLineCount;
        const isLastChunk = ci === investChunksLocal.length - 1;
        const isLastDataChunk = chunkLineCount > 0 && 
          (ci === investChunksLocal.length - 1 || investChunksLocal[ci + 1] === 0);
        const chunkRowsHTML = chunkLines.map(makeRowHTML).join('');
        
        extraPages.push(`
          <div class="dynamic-content" style="position: absolute; left: 5%; top: 3%; width: 90%; z-index: 40;">
            ${chunkLineCount > 0 ? `
            <table class="product-table" style="width: 100%; border-collapse: collapse; font-size: ${tableFontSize}; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
              ${tableHeaderHTML}
              <tbody>${chunkRowsHTML}</tbody>
            </table>
            ${isLastDataChunk ? totalHTML : ''}
            ` : ''}
            
            ${isLastChunk ? offreAndProposalsHTML : ''}
          </div>
        `);
      }
      extraPagesAfter[4] = extraPages;
    }
    
    // Page 5 : Services inclus + Options additionnelles + Nos Options (fusionnées)
    const optionsHTML = selectedOptions.slice(0, OPTIONS_PER_PAGE).map(opt => `
      <div class="option-card" style="margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
              <span style="color: #22c55e; font-size: 10px;">✓</span>
              <span style="font-weight: 600; font-size: 9px;">${opt.name}</span>
            </div>
            ${opt.description ? `<div style="color: #6b7280; font-size: 8px; margin: 0 0 0 16px;">${opt.description.split('\n').filter(l => l.trim()).map(line => { const trimmed = line.trim(); const isSubItem = trimmed.startsWith('- '); return `<div style="line-height: 1.4;${isSubItem ? ' padding-left: 10px;' : ''}">${isSubItem ? trimmed : '• ' + trimmed}</div>`; }).join('')}</div>` : ''}
          </div>
          ${opt.price !== null ? `
            <div style="text-align: right;">
              <span style="font-weight: 600; color: #2563eb; font-size: 9px;">${formatNumber(opt.price)} €</span>
              <span style="display: block; font-size: 7px; color: #9ca3af;">/mois</span>
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
    
    // Générer le HTML des "Nos Options" (fusionnées depuis Page 6)
    const nosOptionsHTML = selectedNosOptions.length > 0 ? `
      <div style="margin-top: 24px;">
        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 6px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          <span style="font-weight: 600; font-size: 10px;">Nos options</span>
        </div>
        ${selectedNosOptions.map(opt => `
          <div style="margin-bottom: 6px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
            <div style="padding: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
                    <span style="display: inline-block; width: 10px; height: 10px; border: 1px solid #6b7280; border-radius: 2px;"></span>
                    <span style="font-weight: 600; font-size: 9px;">${opt.name}</span>
                  </div>
                  ${opt.description ? `<div style="color: #6b7280; font-size: 8px; margin: 0 0 0 16px;">${opt.description.split('\n').filter(l => l.trim()).map(line => { const trimmed = line.trim(); const isSubItem = trimmed.startsWith('- '); return `<div style="line-height: 1.4;${isSubItem ? ' padding-left: 10px;' : ''}">${isSubItem ? trimmed : '• ' + trimmed}</div>`; }).join('')}</div>` : ''}
                </div>
                ${opt.price !== null ? `
                  <div style="text-align: right; white-space: nowrap;">
                    <span style="font-weight: 600; color: #374151; font-size: 9px;">${formatNumber(opt.price)} € / mois</span>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : '';
    
    dynamicContent[5] = `
      <div class="dynamic-content" style="position: absolute; left: 5%; top: 8%; width: 90%; max-height: 82%; overflow: hidden; z-index: 40;">
        <!-- Titre de page avec icône FileCheck -->
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></svg>
          <h2 style="font-weight: 700; font-size: 12px; color: #1f2937; margin: 0;">Les services inclus dans votre offre</h2>
        </div>
        
        <!-- Bloc Services location -->
        <div style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; margin-bottom: 8px;">
          <div style="background: #f3f4f6; padding: 6px 12px; display: flex; align-items: center; gap: 8px;">
            <div style="width: 8px; height: 16px; background: #374151; border-radius: 2px;"></div>
            <span style="font-weight: 600; font-size: 11px;">Services location</span>
          </div>
          <div style="padding: 6px 12px; background: white;">
            <p style="margin: 0; color: #4b5563; font-size: 9px; white-space: pre-wrap;">${servicesInclus.description}</p>
          </div>
        </div>
        ${selectedOptions.length > 0 ? optionsHTML : ''}
        ${nosOptionsHTML}
      </div>
    `;
    
    if (page4FlowElementIds.length > 0) {
      excludeElementIds[4] = page4FlowElementIds;
    }
    
    return { content: dynamicContent, excludeIds: excludeElementIds, extraPagesAfter };
  }, [clientData, matriceData, lignesData, servicesInclus, optionsServices, nosOptions, selectedCommercial, calculatedValues, totalPages, activeTemplate, selectedOptions, selectedNosOptions, latestVersion]);
  
  /**
   * Génère le contenu HTML complet du PDF à partir du template sélectionné
   */
  const generatePDFContentFromTemplate = useCallback(async (): Promise<string> => {
    if (!latestVersion || latestVersion.pages.length === 0) {
      console.warn('[Export] No template version found, using fallback');
      return generateFallbackPDFContent();
    }
    
    console.log(`[Export] Generating PDF from template: ${activeTemplate?.name}, version ${latestVersion.versionNumber}`);
    
    // Générer le contenu dynamique pour chaque page
    const { content: dynamicContentByPage, excludeIds, extraPagesAfter } = generateDynamicContentByPage();
    
    // Générer le document HTML complet
    return generatePDFDocumentHTML(latestVersion, dynamicContentByPage, { fraisDossier: calculatedValues.fraisDossier }, excludeIds, extraPagesAfter);
  }, [latestVersion, activeTemplate, generateDynamicContentByPage]);
  
  /**
   * Fallback : génère un PDF basique si aucun template n'est disponible
   */
  const generateFallbackPDFContent = (): string => {
    const date = new Date().toLocaleDateString('fr-FR');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Proposition de Location - ${clientData.nom || 'Client'}</title>
        <style>
          @media print {
            body { margin: 0; padding: 0; }
            .page-break { page-break-after: always; }
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
            color: #1f2937;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
          }
          h1 { color: #2563eb; margin-bottom: 8px; }
          h2 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 32px; }
          .header { text-align: center; padding: 40px 0; }
          .summary-box { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 24px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Proposition de Location</h1>
          <p style="color: #6b7280;">Document généré le ${date}</p>
          <p style="margin-top: 20px;"><strong>Client :</strong> ${clientData.nom || 'Non renseigné'}</p>
        </div>
        
        <div class="page-break"></div>
        
        <h2>Récapitulatif</h2>
        <div class="summary-box">
          <p><strong>Investissement :</strong> ${formatNumber(matriceData.montantInvestissement)} € HT</p>
          <p><strong>Durée :</strong> ${matriceData.duree} mois</p>
          <p><strong>Loyer mensuel :</strong> ${formatNumber(calculatedValues.loyerMensuel)} € HT</p>
          <p><strong>Nombre de lignes :</strong> ${lignesData.length}</p>
        </div>
      </body>
      </html>
    `;
  };
  
  /**
   * Génère le contenu PDF pour l'email (version synchrone avec fallback)
   */
  const generatePDFContent = (): string => {
    // Pour l'email, on utilise le fallback synchrone
    // TODO: Implémenter une version async pour l'email également
    return generateFallbackPDFContent();
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
        {/* Résumé du document */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <User className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Client</p>
            <p className="font-medium truncate">{clientData.nom || '-'}</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Lignes</p>
            <p className="font-medium">{lignesData.length}</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <Settings className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Options</p>
            <p className="font-medium">{selectedOptions.length}</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Pages</p>
            <p className="font-medium">{totalPages}</p>
          </div>
        </div>

        <Separator />

        {/* Informations financières */}
        <div className="bg-primary/5 rounded-lg p-4 space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Récapitulatif financier
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Investissement HT :</span>
              <span className="font-medium">{formatNumber(matriceData.montantInvestissement)} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Durée :</span>
              <span className="font-medium">{matriceData.duree} mois</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loyer mensuel :</span>
              <span className="font-medium text-primary">{formatNumber(calculatedValues.loyerMensuel)} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avec services :</span>
              <span className="font-medium text-primary">{formatNumber(calculatedValues.loyerServicesInclus)} €</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Onglets Télécharger / Email */}
        <Tabs defaultValue="download" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="download" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Télécharger
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Envoyer par email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="download" className="mt-6">
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
                disabled={isGenerating}
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
          </TabsContent>

          <TabsContent value="email" className="mt-6">
            <EmailSendForm
              clientName={clientData.nom}
              clientEmail={clientData.email}
              investmentAmount={matriceData.montantInvestissement}
              duration={matriceData.duree}
              monthlyRent={calculatedValues.loyerMensuel ?? 0}
              rentWithServices={calculatedValues.loyerServicesInclus ?? 0}
              contractCost={calculatedValues.coutContrat ?? 0}
              linesCount={lignesData.length}
              optionsCount={selectedOptions.length}
              templateName={activeTemplate?.name}
              pdfHtmlContent={generatePDFContent()}
            />
          </TabsContent>
        </Tabs>

        {/* Template utilisé */}
        {activeTemplate && (
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm mt-6">
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

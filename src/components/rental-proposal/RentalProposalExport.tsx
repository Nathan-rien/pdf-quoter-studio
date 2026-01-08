/**
 * Composant d'export PDF pour la proposition de location
 * Génère un PDF téléchargeable à partir des données de la proposition
 */

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Settings,
  Clock
} from 'lucide-react';
import { useRentalProposalStore } from '@/stores/rentalProposalStore';
import { useTemplateEditorStore } from '@/stores/templateEditorStore';
import { toast } from '@/hooks/use-toast';

// Constantes pour la pagination
const OPTIONS_PER_PAGE = 6;
const LINES_PER_PAGE = 12;

export function RentalProposalExport() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const {
    clientData,
    matriceData,
    lignesData,
    optionsServices,
    pdfImportStatus,
    getCalculatedValues,
  } = useRentalProposalStore();

  const { getActiveTemplate } = useTemplateEditorStore();
  
  const activeTemplate = getActiveTemplate();
  const calculatedValues = getCalculatedValues();
  const selectedOptions = optionsServices.filter(opt => opt.selected);
  
  const optionsPagesCount = Math.max(1, Math.ceil(selectedOptions.length / OPTIONS_PER_PAGE));
  const linesPagesCount = Math.max(1, Math.ceil(lignesData.length / LINES_PER_PAGE));
  const totalPages = 3 + linesPagesCount + optionsPagesCount + 2;

  const formatNumber = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const generateFileName = () => {
    const clientName = clientData.nom.replace(/[^a-zA-Z0-9]/g, '_') || 'Proposition';
    const date = new Date().toISOString().split('T')[0];
    return `Proposition_${clientName}_${date}.pdf`;
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    
    try {
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
      
      // Générer le contenu HTML du PDF
      const htmlContent = generatePDFContent();
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Attendre le chargement puis imprimer
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
          setIsGenerating(false);
          setIsGenerated(true);
          
          toast({
            title: "PDF généré",
            description: `Le document "${fileName}" a été préparé pour le téléchargement.`,
          });
        }, 500);
      };

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération du PDF.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  const generatePDFContent = () => {
    const date = new Date().toLocaleDateString('fr-FR');
    
    // Générer les lignes produits HTML
    const productLinesHTML = lignesData.map((ligne, idx) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${ligne.designation || '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${ligne.quantite}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatNumber(ligne.prixUnitaire)} €</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">${formatNumber(ligne.totalHT)} €</td>
      </tr>
    `).join('');

    // Générer les options HTML
    const optionsHTML = selectedOptions.map(opt => `
      <div style="padding: 12px; margin-bottom: 8px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="color: #22c55e;">✓</span>
              <span style="font-weight: 600;">${opt.name}</span>
            </div>
            ${opt.description ? `<p style="color: #6b7280; font-size: 14px; margin: 0 0 0 24px; white-space: pre-wrap;">${opt.description}</p>` : ''}
          </div>
          ${opt.price !== null ? `
            <div style="text-align: right;">
              <span style="font-weight: 600; color: #2563eb;">${formatNumber(opt.price)} €</span>
              <span style="display: block; font-size: 12px; color: #9ca3af;">/mois</span>
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');

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
            .no-print { display: none; }
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
          h3 { color: #4b5563; margin-top: 24px; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th { background: #f3f4f6; padding: 12px 8px; text-align: left; font-weight: 600; }
          .header { text-align: center; padding: 40px 0; border-bottom: 2px solid #e5e7eb; margin-bottom: 32px; }
          .client-box { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0; }
          .summary-box { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #bfdbfe; }
          .total-box { background: #f0fdf4; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #bbf7d0; }
          .footer { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .signature-box { border: 2px dashed #d1d5db; height: 100px; display: flex; align-items: center; justify-content: center; color: #9ca3af; border-radius: 8px; margin-top: 8px; }
        </style>
      </head>
      <body>
        <!-- Page 1: Couverture -->
        <div class="header">
          <h1>Proposition de Location</h1>
          <p style="color: #6b7280;">Financière Professionnelle</p>
          
          <div class="client-box" style="max-width: 400px; margin: 32px auto; text-align: left;">
            <h3 style="margin-top: 0;">Client</h3>
            <p style="font-weight: 600; margin: 0;">${clientData.nom || 'Nom du client'}</p>
            <p style="color: #6b7280; margin: 4px 0;">${clientData.adresse || ''}</p>
            <p style="color: #6b7280; margin: 4px 0;">${clientData.codePostal} ${clientData.ville}</p>
            ${clientData.email ? `<p style="color: #6b7280; margin: 4px 0;">${clientData.email}</p>` : ''}
            ${clientData.telephone ? `<p style="color: #6b7280; margin: 4px 0;">${clientData.telephone}</p>` : ''}
          </div>
          
          <p style="color: #9ca3af; font-size: 14px;">Document généré le ${date}</p>
          ${activeTemplate ? `<p style="color: #9ca3af; font-size: 12px;">Template : ${activeTemplate.name}</p>` : ''}
        </div>
        
        <div class="page-break"></div>
        
        <!-- Page 2: Détail du matériel -->
        <h2>Détail du matériel</h2>
        
        <table>
          <thead>
            <tr>
              <th>Désignation</th>
              <th style="text-align: right; width: 80px;">Qté</th>
              <th style="text-align: right; width: 100px;">P.U. HT</th>
              <th style="text-align: right; width: 100px;">Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${productLinesHTML}
          </tbody>
        </table>
        
        <div style="text-align: right; margin-top: 16px;">
          <div class="summary-box" style="display: inline-block; text-align: left; min-width: 250px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #6b7280;">Sous-total HT :</span>
              <span style="font-weight: 600;">${formatNumber(matriceData.montantInvestissement)} €</span>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 8px 0;">
            <div style="display: flex; justify-content: space-between; font-weight: 600;">
              <span>Total investissement :</span>
              <span style="color: #2563eb;">${formatNumber(matriceData.montantInvestissement)} € HT</span>
            </div>
          </div>
        </div>
        
        <div class="page-break"></div>
        
        <!-- Page 3: Options de services -->
        <h2>Vos options de services</h2>
        <p style="color: #6b7280;">Services inclus dans votre contrat de location</p>
        
        ${selectedOptions.length === 0 ? `
          <div style="text-align: center; padding: 40px; color: #9ca3af;">
            <p>Aucune option sélectionnée</p>
          </div>
        ` : optionsHTML}
        
        ${selectedOptions.length > 0 ? `
          <div class="grid-2" style="margin-top: 24px;">
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 4px 0;">Durée du contrat</p>
              <p style="font-weight: 600; margin: 0;">${matriceData.duree} mois</p>
            </div>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 4px 0;">Loyer mensuel</p>
              <p style="font-weight: 600; color: #2563eb; margin: 0;">${formatNumber(calculatedValues.loyerServicesInclus)} € HT</p>
            </div>
          </div>
        ` : ''}
        
        <div class="page-break"></div>
        
        <!-- Page 4: Récapitulatif -->
        <h2>Récapitulatif de votre offre</h2>
        
        <div class="summary-box">
          <h3 style="margin-top: 0;">Investissement</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280;">Montant total HT :</span>
            <span style="font-weight: 600;">${formatNumber(matriceData.montantInvestissement)} €</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6b7280;">Nombre de lignes :</span>
            <span>${lignesData.length}</span>
          </div>
        </div>
        
        <div class="summary-box">
          <h3 style="margin-top: 0;">Conditions de location</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280;">Durée :</span>
            <span style="font-weight: 600;">${matriceData.duree} mois</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280;">Refinanceur :</span>
            <span>${matriceData.refinanceur}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280;">Coefficient :</span>
            <span>${calculatedValues.coefficient ?? '-'}</span>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 12px 0;">
          <div style="display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 8px;">
            <span>Loyer mensuel HT :</span>
            <span style="color: #2563eb;">${formatNumber(calculatedValues.loyerMensuel)} €</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: 600;">
            <span>Loyer avec services :</span>
            <span style="color: #2563eb;">${formatNumber(calculatedValues.loyerServicesInclus)} €</span>
          </div>
        </div>
        
        <div class="total-box">
          <p style="font-weight: 600; color: #16a34a; margin: 0;">
            Coût total du contrat : ${formatNumber(calculatedValues.coutContrat)} €
          </p>
        </div>
        
        <div class="page-break"></div>
        
        <!-- Page 5: Signature -->
        <h2>Conditions et signature</h2>
        
        <p style="color: #6b7280;">
          Le présent document constitue une proposition de location financière.
          Les conditions définitives seront précisées dans le contrat de location.
        </p>
        <p style="color: #6b7280;">
          Durée de validité de l'offre : 30 jours à compter de la date d'émission.
        </p>
        
        <div class="grid-2" style="margin-top: 40px;">
          <div>
            <p style="font-weight: 600;">Le client</p>
            <p style="color: #6b7280; font-size: 14px;">${clientData.nom || 'Nom du client'}</p>
            <div class="signature-box">Signature</div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">Date : ___/___/______</p>
          </div>
          <div>
            <p style="font-weight: 600;">Pour la société</p>
            <p style="color: #6b7280; font-size: 14px;">CybertekPro</p>
            <div class="signature-box">Signature</div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">Date : ___/___/______</p>
          </div>
        </div>
        
        <div class="footer">
          <p>Document généré automatiquement - ${date}</p>
          <p>${activeTemplate?.name || 'Proposition Commerciale'}</p>
        </div>
      </body>
      </html>
    `;
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

        {/* Zone de téléchargement */}
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

        {/* Template utilisé */}
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

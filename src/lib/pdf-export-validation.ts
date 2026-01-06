/**
 * Validation pré-export du PDF
 * 
 * RÈGLES :
 * - Toutes les zones dynamiques requises doivent être remplies
 * - Les données Invest doivent être au statut 'valide_pret_injection'
 * - Les options ne bloquent pas l'export (conditionnelles)
 */

import { InvestData, OptionsServicesData } from '@/types/quote';
import { PDFPageNumber, TemplateValidationResult, PageValidationResult } from '@/types/pdf-template';
import { PDF_TEMPLATE_CONTRACT } from './pdf-template-contract';

export interface ExportPrerequisites {
  templateSelected: boolean;
  excelImported: boolean;
  investValidated: boolean;
  optionsSelected: boolean; // Optionnel
}

/**
 * Vérifie les prérequis d'export
 */
export function checkExportPrerequisites(
  templateId: string | null,
  investData: InvestData | null,
  optionsData: OptionsServicesData | null
): ExportPrerequisites {
  return {
    templateSelected: templateId !== null,
    excelImported: investData !== null,
    investValidated: investData?.validationStatus === 'valide_pret_injection',
    optionsSelected: optionsData ? optionsData.rows.some(r => r.selected) : false
  };
}

/**
 * Valide une page spécifique avant export
 */
function validatePage(
  pageNumber: PDFPageNumber,
  investData: InvestData | null,
  optionsData: OptionsServicesData | null
): PageValidationResult {
  const pageConfig = PDF_TEMPLATE_CONTRACT.pages.find(p => p.pageNumber === pageNumber);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!pageConfig) {
    return { pageNumber, isValid: false, errors: [`Page ${pageNumber} non définie`], warnings };
  }

  // Pages statiques : toujours valides
  if (pageConfig.type === 'static') {
    return { pageNumber, isValid: true, errors, warnings };
  }

  // Vérifier les zones dynamiques
  for (const zone of pageConfig.dynamicZones) {
    if (zone.type === 'invest_table' || zone.type === 'location_block') {
      // Zones Invest requises
      if (zone.isRequired) {
        if (!investData) {
          errors.push(`Zone "${zone.description}" : Données Invest manquantes`);
        } else if (investData.validationStatus !== 'valide_pret_injection') {
          errors.push(
            `Zone "${zone.description}" : Statut Invest "${investData.validationStatus}" - ` +
            `"valide_pret_injection" requis`
          );
        }
      }
    } else if (zone.type === 'options_block') {
      // Zones Options conditionnelles (pas bloquant)
      if (optionsData?.structureError) {
        errors.push(`Zone "${zone.description}" : ${optionsData.structureError}`);
      } else if (!optionsData || optionsData.isEmpty) {
        warnings.push(`Zone "${zone.description}" : Aucune option disponible (sera masquée)`);
      } else if (!optionsData.rows.some(r => r.selected)) {
        warnings.push(`Zone "${zone.description}" : Aucune option sélectionnée (sera masquée)`);
      }
    }
  }

  return {
    pageNumber,
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Valide le template complet avant export
 */
export function validatePDFExport(
  investData: InvestData | null,
  optionsData: OptionsServicesData | null
): TemplateValidationResult {
  const pageResults: PageValidationResult[] = [];
  const blockers: string[] = [];
  const allWarnings: string[] = [];

  // Valider chaque page
  for (const page of PDF_TEMPLATE_CONTRACT.pages) {
    const result = validatePage(page.pageNumber, investData, optionsData);
    pageResults.push(result);

    if (!result.isValid) {
      result.errors.forEach(err => {
        blockers.push(`Page ${page.pageNumber} (${page.title}) : ${err}`);
      });
    }

    result.warnings.forEach(warn => {
      allWarnings.push(`Page ${page.pageNumber} : ${warn}`);
    });
  }

  return {
    canExport: blockers.length === 0,
    pageResults,
    blockers,
    warnings: allWarnings
  };
}

/**
 * Génère un résumé de validation pour l'UI
 */
export function getExportValidationSummary(
  investData: InvestData | null,
  optionsData: OptionsServicesData | null
): {
  canExport: boolean;
  readyPages: number[];
  blockedPages: number[];
  conditionalPages: number[];
  summary: string;
} {
  const validation = validatePDFExport(investData, optionsData);
  
  const readyPages: number[] = [];
  const blockedPages: number[] = [];
  const conditionalPages: number[] = [];

  for (const result of validation.pageResults) {
    const pageConfig = PDF_TEMPLATE_CONTRACT.pages.find(p => p.pageNumber === result.pageNumber);
    
    if (!result.isValid) {
      blockedPages.push(result.pageNumber);
    } else if (pageConfig?.type === 'dynamic_conditional') {
      conditionalPages.push(result.pageNumber);
    } else {
      readyPages.push(result.pageNumber);
    }
  }

  const summary = validation.canExport
    ? `Prêt à exporter (${readyPages.length} pages prêtes)`
    : `Export bloqué : ${validation.blockers.length} erreur(s)`;

  return {
    canExport: validation.canExport,
    readyPages,
    blockedPages,
    conditionalPages,
    summary
  };
}

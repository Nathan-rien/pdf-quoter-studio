/**
 * Validation pré-export du PDF
 * 
 * RÈGLES :
 * - Les données Invest doivent être au statut 'valide_pret_injection'
 * - Les zones sont recherchées par TYPE (réaffectation automatique)
 * - Les options ne bloquent pas l'export (conditionnelles)
 */

import { InvestData, OptionsServicesData } from '@/types/quote';
import { TemplateValidationResult, PageValidationResult, DynamicZone, DynamicZoneType } from '@/types/pdf-template';
import type { TemplateVersion, TemplatePageContent } from '@/types/template-editor';

export interface ExportPrerequisites {
  templateSelected: boolean;
  excelImported: boolean;
  investValidated: boolean;
  optionsSelected: boolean; // Optionnel
}

/**
 * Trouve la première zone d'un type donné dans la version du template
 * Permet la réaffectation automatique si une page a été supprimée
 */
export function findZoneByTypeInVersion(
  version: TemplateVersion | null, 
  zoneType: DynamicZoneType
): { zone: DynamicZone; pageNumber: number } | null {
  if (!version) return null;
  
  for (const page of version.pages) {
    const zone = page.dynamicZones.find(z => z.type === zoneType);
    if (zone) {
      return { zone, pageNumber: page.pageNumber };
    }
  }
  return null;
}

/**
 * Récupère toutes les pages contenant un type de zone donné
 */
export function getPagesWithZoneType(
  version: TemplateVersion | null,
  zoneType: DynamicZoneType
): number[] {
  if (!version) return [];
  
  return version.pages
    .filter(p => p.dynamicZones.some(z => z.type === zoneType))
    .map(p => p.pageNumber);
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
 * Valide une page spécifique avant export (basé sur la version du template)
 */
function validatePageWithVersion(
  page: TemplatePageContent,
  investData: InvestData | null,
  optionsData: OptionsServicesData | null,
  version: TemplateVersion
): PageValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const pageNumber = page.pageNumber;

  // Pages sans zones dynamiques : toujours valides
  if (page.dynamicZones.length === 0) {
    return { pageNumber, isValid: true, errors, warnings };
  }

  // Vérifier les zones dynamiques présentes sur cette page
  for (const zone of page.dynamicZones) {
    if (zone.type === 'invest_table' || zone.type === 'location_block') {
      // Zones Invest
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
 * Utilise la version du template fournie (pas le contrat statique)
 */
export function validatePDFExport(
  investData: InvestData | null,
  optionsData: OptionsServicesData | null,
  templateVersion?: TemplateVersion | null
): TemplateValidationResult {
  const pageResults: PageValidationResult[] = [];
  const blockers: string[] = [];
  const allWarnings: string[] = [];

  // Si pas de version fournie, retourner un résultat par défaut
  if (!templateVersion || templateVersion.pages.length === 0) {
    return {
      canExport: false,
      pageResults: [],
      blockers: ['Aucun template sélectionné ou template vide'],
      warnings: []
    };
  }

  // Vérifier la présence des types de zones nécessaires (réaffectation auto)
  const hasInvestZone = findZoneByTypeInVersion(templateVersion, 'invest_table') !== null;
  const hasLocationZone = findZoneByTypeInVersion(templateVersion, 'location_block') !== null;
  const hasOptionsZone = findZoneByTypeInVersion(templateVersion, 'options_block') !== null;

  // Warnings informatifs si des types de zones manquent
  if (!hasInvestZone && investData) {
    allWarnings.push('Aucune zone "Tableau Invest" dans le template - les produits ne seront pas affichés');
  }
  if (!hasLocationZone && investData) {
    allWarnings.push('Aucune zone "Bloc Location" dans le template - les conditions ne seront pas affichées');
  }
  if (!hasOptionsZone && optionsData && optionsData.rows.some(r => r.selected)) {
    allWarnings.push('Aucune zone "Bloc Options" dans le template - les services ne seront pas affichés');
  }

  // Valider chaque page de la version
  for (const page of templateVersion.pages) {
    const result = validatePageWithVersion(page, investData, optionsData, templateVersion);
    pageResults.push(result);

    if (!result.isValid) {
      result.errors.forEach(err => {
        blockers.push(`Page ${page.pageNumber} : ${err}`);
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
 * Accepte maintenant une version de template optionnelle
 */
export function getExportValidationSummary(
  investData: InvestData | null,
  optionsData: OptionsServicesData | null,
  templateVersion?: TemplateVersion | null
): {
  canExport: boolean;
  readyPages: number[];
  blockedPages: number[];
  conditionalPages: number[];
  summary: string;
} {
  const validation = validatePDFExport(investData, optionsData, templateVersion);
  
  const readyPages: number[] = [];
  const blockedPages: number[] = [];
  const conditionalPages: number[] = [];

  for (const result of validation.pageResults) {
    // Vérifier si la page a des zones options (conditionnel)
    const page = templateVersion?.pages.find(p => p.pageNumber === result.pageNumber);
    const hasOptionsZone = page?.dynamicZones.some(z => z.type === 'options_block');
    
    if (!result.isValid) {
      blockedPages.push(result.pageNumber);
    } else if (hasOptionsZone) {
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

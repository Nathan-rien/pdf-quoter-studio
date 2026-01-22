/**
 * Validation pré-publication du template
 * Valide les zones dynamiques PRÉSENTES dans la version courante
 * (pas de comparaison avec le contrat statique - suppression autorisée)
 */

import type { 
  TemplateVersion, 
  PublishValidationResult, 
  PublishValidationError, 
  PublishValidationWarning,
  TextContent 
} from '@/types/template-editor';
import type { DynamicZoneType } from '@/types/pdf-template';

/**
 * Valide un template avant publication
 * Basée sur la version courante, pas le contrat statique
 */
export function validateTemplateForPublication(
  version: TemplateVersion
): PublishValidationResult {
  const errors: PublishValidationError[] = [];
  const warnings: PublishValidationWarning[] = [];

  // 1. Vérifier qu'il y a au moins 1 page
  if (version.pages.length === 0) {
    errors.push({
      type: 'page_count',
      message: 'Le template doit contenir au moins 1 page'
    });
  }

  // 2. Valider les zones dynamiques PRÉSENTES dans la version courante
  for (const page of version.pages) {
    for (const zone of page.dynamicZones) {
      // Vérifier cohérence interne de la zone (pageNumber doit correspondre)
      if (zone.pageNumber !== page.pageNumber) {
        warnings.push({
          type: 'dynamic_zone_integrity',
          pageNumber: page.pageNumber,
          zoneId: zone.id,
          message: `Zone "${zone.id}" a un numéro de page incohérent (${zone.pageNumber} vs ${page.pageNumber})`
        });
      }
    }
  }

  // 3. Ajouter des warnings informatifs si des types de zones "classiques" manquent
  const presentZoneTypes = new Set(
    version.pages.flatMap(p => p.dynamicZones.map(z => z.type))
  );
  
  const zoneTypeLabels: Record<DynamicZoneType, string> = {
    'invest_table': 'Tableau Invest',
    'location_block': 'Bloc Location',
    'options_block': 'Bloc Options'
  };
  
  if (!presentZoneTypes.has('invest_table')) {
    warnings.push({
      type: 'missing_zone',
      message: 'Aucune zone "Tableau Invest" - les données produits ne seront pas injectées'
    });
  }
  
  if (!presentZoneTypes.has('location_block')) {
    warnings.push({
      type: 'missing_zone', 
      message: 'Aucune zone "Bloc Location" - les conditions de location ne seront pas injectées'
    });
  }

  if (!presentZoneTypes.has('options_block')) {
    warnings.push({
      type: 'missing_zone',
      message: 'Aucune zone "Bloc Options" - les services ne seront pas injectés'
    });
  }

  // 4. Vérifier les éléments texte vides (warning seulement)
  for (const page of version.pages) {
    for (const element of page.elements) {
      if (element.type === 'text' && !element.isDynamic) {
        const textContent = element.content as TextContent;
        if (!textContent.text || textContent.text.trim() === '') {
          warnings.push({
            type: 'empty_text',
            pageNumber: page.pageNumber,
            elementId: element.id,
            message: `Élément texte vide sur la page ${page.pageNumber}`
          });
        }
      }
    }
  }

  return {
    canPublish: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Génère un rapport de validation lisible
 */
export function getValidationReport(result: PublishValidationResult): string {
  const lines: string[] = [];

  if (result.canPublish) {
    lines.push('✓ Le template peut être publié');
  } else {
    lines.push('✗ Publication bloquée - Erreurs détectées :');
    for (const error of result.errors) {
      lines.push(`  • Page ${error.pageNumber || '-'} : ${error.message}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push('');
    lines.push('Avertissements :');
    for (const warning of result.warnings) {
      lines.push(`  ⚠ ${warning.message}`);
    }
  }

  return lines.join('\n');
}

/**
 * Vérifie si un template brouillon peut être modifié
 */
export function canModifyVersion(version: TemplateVersion): boolean {
  return version.status === 'brouillon';
}

/**
 * Vérifie si un template peut être archivé
 */
export function canArchiveVersion(version: TemplateVersion): boolean {
  return version.status === 'publie';
}

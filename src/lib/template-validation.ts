/**
 * Validation pré-publication du template
 * Garantit l'intégrité des zones dynamiques avant publication
 */

import type { 
  TemplateVersion, 
  PublishValidationResult, 
  PublishValidationError, 
  PublishValidationWarning 
} from '@/types/template-editor';
import { getAllDynamicZones } from './pdf-template-contract';
import { validateDynamicZone, getDynamicZonesForPage } from './template-protection';

/**
 * Valide un template avant publication
 * Vérifie l'intégrité des zones dynamiques
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

  // 2. Vérifier l'intégrité de toutes les zones dynamiques
  const allDynamicZones = getAllDynamicZones();
  const pagesWithDynamicZones = new Set(allDynamicZones.map(z => z.pageNumber));

  for (const pageNumber of pagesWithDynamicZones) {
    const pageContent = version.pages.find(p => p.pageNumber === pageNumber);
    const expectedZones = getDynamicZonesForPage(pageNumber);

    // Vérifier que la page existe si elle a des zones requises
    if (!pageContent) {
      const requiredZones = expectedZones.filter(z => z.isRequired);
      if (requiredZones.length > 0) {
        errors.push({
          type: 'page_order',
          pageNumber: pageNumber,
          message: `Page ${pageNumber} manquante - contient ${requiredZones.length} zone(s) dynamique(s) requise(s)`
        });
      } else {
        warnings.push({
          type: 'missing_page',
          pageNumber: pageNumber,
          message: `Page ${pageNumber} avec zones dynamiques optionnelles manquante`
        });
      }
      continue;
    }

    for (const zone of expectedZones) {
      const result = validateDynamicZone(zone, pageContent);
      
      if (!result.isValid) {
        if (zone.isRequired) {
          errors.push({
            type: 'dynamic_zone_integrity',
            pageNumber: pageNumber,
            zoneId: zone.id,
            message: result.errors.join('; ')
          });
        } else {
          warnings.push({
            type: 'dynamic_zone_integrity',
            pageNumber: pageNumber,
            zoneId: zone.id,
            message: result.errors.join('; ')
          });
        }
      }
    }

    // Vérifier que toutes les zones attendues sont présentes
    if (pageContent) {
      for (const expectedZone of expectedZones) {
        const found = pageContent.dynamicZones.find(z => z.id === expectedZone.id);
        if (!found) {
          if (expectedZone.isRequired) {
            errors.push({
              type: 'missing_zone',
              pageNumber: pageNumber,
              zoneId: expectedZone.id,
              message: `Zone dynamique requise "${expectedZone.id}" manquante sur la page ${pageNumber}`
            });
          } else {
            warnings.push({
              type: 'missing_zone',
              pageNumber: pageNumber,
              zoneId: expectedZone.id,
              message: `Zone dynamique optionnelle "${expectedZone.id}" manquante sur la page ${pageNumber}`
            });
          }
        }
      }
    }
  }

  // 3. Vérifier les éléments texte vides (warning seulement)
  for (const page of version.pages) {
    for (const element of page.elements) {
      if (element.type === 'text' && !element.isDynamic) {
        const textContent = element.content as { text?: string };
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

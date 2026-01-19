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
import { isProtectedPage, PROTECTED_PAGES } from '@/types/pdf-template';
import { PDF_TEMPLATE_CONTRACT } from './pdf-template-contract';
import { validateDynamicZone, getDynamicZonesForPage } from './template-protection';

/**
 * Valide un template avant publication
 * Vérifie l'intégrité des zones dynamiques, les pages protégées
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

  // 2. Vérifier que les pages protégées (4, 5, 6) sont présentes
  for (const protectedPageNum of PROTECTED_PAGES) {
    const page = version.pages.find(p => p.pageNumber === protectedPageNum);
    
    if (!page) {
      errors.push({
        type: 'page_order',
        pageNumber: protectedPageNum,
        message: `Page protégée ${protectedPageNum} manquante (zones dynamiques requises)`
      });
    }
  }

  // 3. Vérifier l'intégrité de toutes les zones dynamiques sur les pages protégées
  for (const pageNumber of PROTECTED_PAGES) {
    const pageContent = version.pages.find(p => p.pageNumber === pageNumber);
    const expectedZones = getDynamicZonesForPage(pageNumber);

    for (const zone of expectedZones) {
      const result = validateDynamicZone(zone, pageContent);
      
      if (!result.isValid) {
        errors.push({
          type: 'dynamic_zone_integrity',
          pageNumber: pageNumber,
          zoneId: zone.id,
          message: result.errors.join('; ')
        });
      }
    }

    // Vérifier que toutes les zones attendues sont présentes
    if (pageContent) {
      for (const expectedZone of expectedZones) {
        const found = pageContent.dynamicZones.find(z => z.id === expectedZone.id);
        if (!found) {
          errors.push({
            type: 'missing_zone',
            pageNumber: pageNumber,
            zoneId: expectedZone.id,
            message: `Zone dynamique "${expectedZone.id}" manquante sur la page ${pageNumber}`
          });
        }
      }
    }
  }

  // 4. Vérifier les éléments texte vides (warning seulement)
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

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
import type { PDFPageNumber } from '@/types/pdf-template';
import { PDF_TEMPLATE_CONTRACT } from './pdf-template-contract';
import { validateDynamicZone, getDynamicZonesForPage } from './template-protection';

/**
 * Valide un template avant publication
 * Vérifie l'intégrité des zones dynamiques, le nombre de pages, l'ordre des pages
 */
export function validateTemplateForPublication(
  version: TemplateVersion
): PublishValidationResult {
  const errors: PublishValidationError[] = [];
  const warnings: PublishValidationWarning[] = [];

  // 1. Vérifier le nombre de pages (doit être exactement 8)
  if (version.pages.length !== 8) {
    errors.push({
      type: 'page_count',
      message: `Nombre de pages invalide : ${version.pages.length} (attendu : 8)`
    });
  }

  // 2. Vérifier l'ordre des pages
  for (let i = 0; i < 8; i++) {
    const expectedPageNumber = (i + 1) as PDFPageNumber;
    const page = version.pages[i];
    
    if (!page) {
      errors.push({
        type: 'page_order',
        pageNumber: expectedPageNumber,
        message: `Page ${expectedPageNumber} manquante`
      });
      continue;
    }

    if (page.pageNumber !== expectedPageNumber) {
      errors.push({
        type: 'page_order',
        pageNumber: expectedPageNumber,
        message: `Page à la position ${i + 1} a le numéro ${page.pageNumber} (attendu : ${expectedPageNumber})`
      });
    }
  }

  // 3. Vérifier l'intégrité de toutes les zones dynamiques
  const dynamicPages = [4, 5, 6] as const;
  
  for (const pageNumber of dynamicPages) {
    const pageContent = version.pages.find(p => p.pageNumber === pageNumber);
    const expectedZones = getDynamicZonesForPage(pageNumber as PDFPageNumber);

    for (const zone of expectedZones) {
      const result = validateDynamicZone(zone, pageContent);
      
      if (!result.isValid) {
        errors.push({
          type: 'dynamic_zone_integrity',
          pageNumber: pageNumber as PDFPageNumber,
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
            pageNumber: pageNumber as PDFPageNumber,
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

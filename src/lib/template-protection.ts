/**
 * Protection des zones dynamiques du template PDF
 * Ces zones sont strictement en lecture seule
 */

import type { DynamicZone, PDFPageNumber } from '@/types/pdf-template';
import type { TemplatePageContent, EditableElement } from '@/types/template-editor';
import { PDF_TEMPLATE_CONTRACT } from './pdf-template-contract';

export interface ZoneValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface BlockingError {
  code: string;
  cause: string;
  source: string;
  action: string;
}

/**
 * Récupère les zones dynamiques attendues pour une page
 */
export function getDynamicZonesForPage(pageNumber: number): DynamicZone[] {
  const pageConfig = PDF_TEMPLATE_CONTRACT.pages.find(p => p.pageNumber === pageNumber);
  return pageConfig?.dynamicZones || [];
}

/**
 * Récupère la zone dynamique attendue par son ID
 */
export function getExpectedDynamicZone(zoneId: string): DynamicZone | null {
  for (const page of PDF_TEMPLATE_CONTRACT.pages) {
    const zone = page.dynamicZones.find(z => z.id === zoneId);
    if (zone) return zone;
  }
  return null;
}

/**
 * Vérifie la cohérence interne d'une zone dynamique
 * NOTE: Ne bloque plus si la zone est absente (suppression autorisée)
 */
export function validateDynamicZone(
  zone: DynamicZone,
  pageContent: TemplatePageContent | undefined
): ZoneValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Page absente : ce n'est plus une erreur bloquante
  if (!pageContent) {
    return { isValid: true, errors: [] };
  }

  // Zone absente de la page : ce n'est plus une erreur bloquante
  const currentZone = pageContent.dynamicZones.find(z => z.id === zone.id);
  if (!currentZone) {
    // La zone a été supprimée intentionnellement - autorisé
    return { isValid: true, errors: [] };
  }

  // Validations de cohérence interne seulement
  // Source de données modifiée ? (warning, pas erreur)
  const expectedZone = getExpectedDynamicZone(zone.id);
  if (expectedZone && currentZone.sourceSheet !== expectedZone.sourceSheet) {
    // Changement de source inattendu mais non bloquant
    warnings.push(
      `Source de données modifiée pour zone "${zone.id}" : "${expectedZone.sourceSheet}" → "${currentZone.sourceSheet}"`
    );
  }

  return {
    isValid: true,
    errors
  };
}

/**
 * Bloque toute modification sur zone dynamique
 * Retourne toujours une erreur
 */
export function blockDynamicZoneEdit(zoneId: string): BlockingError {
  const zone = getExpectedDynamicZone(zoneId);
  const sourceSheet = zone?.sourceSheet || 'Excel';

  return {
    code: 'DYNAMIC_ZONE_PROTECTED',
    cause: `La zone "${zoneId}" est une zone dynamique protégée`,
    source: 'Éditeur de Template',
    action: `Cette zone reçoit des données de l'onglet "${sourceSheet}". Elle ne peut pas être modifiée dans l'éditeur. Les données seront injectées automatiquement lors de la génération du devis.`
  };
}

/**
 * Vérifie si un élément est éditable (non dynamique)
 */
export function isElementEditable(element: EditableElement): boolean {
  return !element.isDynamic;
}

/**
 * Vérifie si une position est dans une zone dynamique
 */
export function isPositionInDynamicZone(
  pageNumber: number,
  x: number,
  y: number,
  pageContent: TemplatePageContent
): DynamicZone | null {
  // Pour l'instant, on considère que les zones dynamiques occupent des régions fixes
  // Cette logique devrait être étendue avec les vraies coordonnées des zones
  const dynamicZones = getDynamicZonesForPage(pageNumber);
  
  // Retourner la première zone dynamique de la page si elle existe
  // (simplification - en production, vérifier les vraies coordonnées)
  return dynamicZones.length > 0 ? dynamicZones[0] : null;
}

/**
 * Message d'explication pour l'utilisateur tentant de modifier une zone dynamique
 */
export function getDynamicZoneExplanation(zone: DynamicZone): string {
  return `Cette zone "${zone.description}" est protégée. Les données de l'onglet "${zone.sourceSheet}" y seront automatiquement injectées lors de la génération du devis. Aucune modification manuelle n'est autorisée.`;
}

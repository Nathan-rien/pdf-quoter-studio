/**
 * Règles de validation "Invest" (pré-injection)
 * 
 * RÈGLES BLOQUANTES :
 * - Présence de la ligne d'en-tête (Matériel 2025, Nb, VUN, VTN)
 * - Si Nb présent, doit être un nombre entier
 * - Si VUN ou VTN présent, doit être numérique
 * 
 * AUCUNE INTERPRÉTATION :
 * - Les lignes Total/Remise sont conservées telles quelles
 * - Aucun recalcul automatique
 */

import { InvestData, InvestRow, ValidationError } from '@/types/quote';

export interface InvestValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  canValidate: boolean;
}

/**
 * Valide les règles minimales bloquantes sur les lignes Invest
 */
export function validateInvestRows(rows: InvestRow[]): InvestValidationResult {
  const errors: ValidationError[] = [];

  for (const row of rows) {
    // Règle 1 : Si Nb présent, doit être un nombre entier
    if (row.nb !== null) {
      if (typeof row.nb !== 'number') {
        errors.push({
          rowIndex: row.rawRowIndex,
          column: 'C (Nb)',
          message: `Valeur invalide - nombre entier attendu`,
          severity: 'error'
        });
      } else if (!Number.isInteger(row.nb)) {
        errors.push({
          rowIndex: row.rawRowIndex,
          column: 'C (Nb)',
          message: `Valeur "${row.nb}" invalide - entier attendu (pas de décimales)`,
          severity: 'error'
        });
      }
    }

    // Règle 2 : Si VUN présent, doit être numérique
    if (row.vun !== null && typeof row.vun !== 'number') {
      errors.push({
        rowIndex: row.rawRowIndex,
        column: 'D (VUN)',
        message: `Valeur non numérique détectée`,
        severity: 'error'
      });
    }

    // Règle 3 : Si VTN présent, doit être numérique (ou formule évaluée)
    if (row.vtn !== null && typeof row.vtn !== 'number') {
      errors.push({
        rowIndex: row.rawRowIndex,
        column: 'E (VTN)',
        message: `Valeur non numérique détectée`,
        severity: 'error'
      });
    }
  }

  const hasBlockingErrors = errors.some(e => e.severity === 'error');

  return {
    isValid: !hasBlockingErrors,
    errors,
    canValidate: !hasBlockingErrors
  };
}

/**
 * Vérifie si les données Invest peuvent être validées
 */
export function canValidateInvestData(investData: InvestData | null): {
  canValidate: boolean;
  blockers: string[];
} {
  const blockers: string[] = [];

  if (!investData) {
    blockers.push('Aucune donnée Invest importée');
    return { canValidate: false, blockers };
  }

  // Vérifier la présence de l'en-tête
  if (investData.headerRowIndex < 0) {
    blockers.push('En-tête "Matériel 2025, Nb, VUN, VTN" introuvable');
  }

  // Vérifier les erreurs de validation
  const validationResult = validateInvestRows(investData.rows);
  if (!validationResult.canValidate) {
    blockers.push(`${validationResult.errors.length} erreur(s) de validation bloquante(s)`);
  }

  // Vérifier le statut actuel
  if (investData.validationStatus === 'valide_pret_injection') {
    blockers.push('Données déjà validées');
  }

  if (investData.validationStatus === 'rejete_a_corriger') {
    blockers.push('Données rejetées - réimportez un fichier corrigé');
  }

  return {
    canValidate: blockers.length === 0 && investData.validationStatus === 'importe_non_valide',
    blockers
  };
}

/**
 * Vérifie si les données Invest peuvent être rejetées
 */
export function canRejectInvestData(investData: InvestData | null): boolean {
  if (!investData) return false;
  return investData.validationStatus === 'importe_non_valide';
}

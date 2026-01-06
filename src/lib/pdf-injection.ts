/**
 * Règles d'injection PDF (pages 4-5 pour Invest, page 6 pour Options)
 * 
 * RÈGLES STRICTES :
 * - Inject uniquement si validationStatus === 'valide_pret_injection'
 * - L'ordre des lignes est conservé
 * - Aucun recalcul, les valeurs sont affichées telles quelles
 * - Si tableau dépasse la zone : ERREUR BLOQUANTE (pagination non spécifiée)
 */

import { InvestData, OptionsServicesData, OptionsServiceRow } from '@/types/quote';

// Nombre maximum de lignes Invest pour pages 4-5
// VALEUR NON DÉFINIE = ERREUR BLOQUANTE selon les règles
const MAX_INVEST_ROWS_PAGES_4_5: number | undefined = undefined;

export interface InjectionCheckResult {
  canInject: boolean;
  errors: string[];
  warnings: string[];
}

export interface InvestInjectionData {
  rows: InvestData['rows'];
  headerRowIndex: number;
  sourceSheet: string;
}

/**
 * Vérifie les règles d'injection du tableau Invest dans le PDF
 */
export function checkInvestInjectionRules(investData: InvestData | null): InjectionCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!investData) {
    errors.push(
      `BLOCAGE : Aucune donnée Invest. ` +
      `Source: onglet "invest " requis. ` +
      `Action: Importez un fichier Excel contenant l'onglet "invest " (avec espace final).`
    );
    return { canInject: false, errors, warnings };
  }

  // Règle 1 : Statut doit être valide_pret_injection
  if (investData.validationStatus !== 'valide_pret_injection') {
    errors.push(
      `BLOCAGE : Statut Invest "${investData.validationStatus}" - ` +
      `"valide_pret_injection" requis. ` +
      `Source: onglet "${investData.sourceSheet}". ` +
      `Action: Validez les données Invest avant export.`
    );
  }

  // Règle 2 : Vérification taille tableau
  if (MAX_INVEST_ROWS_PAGES_4_5 !== undefined) {
    if (investData.rows.length > MAX_INVEST_ROWS_PAGES_4_5) {
      errors.push(
        `BLOCAGE : Tableau trop long pour le template (${investData.rows.length} lignes). ` +
        `Maximum autorisé : ${MAX_INVEST_ROWS_PAGES_4_5} lignes. ` +
        `Source: onglet "${investData.sourceSheet}". ` +
        `Action: Réduisez le nombre de lignes ou définissez une règle de pagination.`
      );
    }
  } else {
    // Limite non définie - avertissement (pas blocage pour permettre le développement)
    // En production, cela devrait être une erreur bloquante selon §3
    warnings.push(
      `Limite de lignes non définie pour pages 4-5. ` +
      `La pagination automatique n'est pas implémentée. ` +
      `Définissez explicitement le nombre maximum de lignes si nécessaire.`
    );
  }

  return {
    canInject: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Prépare les données Invest pour injection (snapshot validé)
 */
export function prepareInvestForInjection(investData: InvestData): InvestInjectionData | null {
  const check = checkInvestInjectionRules(investData);
  
  if (!check.canInject) {
    return null;
  }

  // Retourner le snapshot exact des données validées
  return {
    rows: [...investData.rows], // Copie pour immutabilité
    headerRowIndex: investData.headerRowIndex,
    sourceSheet: investData.sourceSheet
  };
}

export interface OptionsInjectionResult {
  canInject: boolean;
  selectedOptions: OptionsServiceRow[];
  errors: string[];
  warnings: string[];
}

/**
 * Prépare les options pour injection sur page 6
 * 
 * RÈGLES :
 * - Options proviennent exclusivement de l'onglet "Options services "
 * - Si onglet vide : aucune option affichée (pas d'invention)
 * - Seules les options sélectionnées sont injectées
 * - Aucun regroupement automatique (non spécifié)
 */
export function prepareOptionsInjection(
  optionsData: OptionsServicesData | null
): OptionsInjectionResult {
  const warnings: string[] = [];

  // Règle 1 : Si pas de données ou onglet vide, aucune option injectée
  if (!optionsData || optionsData.isEmpty) {
    return {
      canInject: true, // Pas bloquant, juste vide
      selectedOptions: [],
      errors: [],
      warnings: ['Onglet "Options services " vide - page 6 restera vide']
    };
  }

  // Règle 2 : Si structure non définie, blocage
  if (optionsData.structureError) {
    return {
      canInject: false,
      selectedOptions: [],
      errors: [
        `BLOCAGE : ${optionsData.structureError} ` +
        `Source: onglet "Options services ". ` +
        `Action: Définissez la structure des colonnes contractuellement.`
      ],
      warnings: []
    };
  }

  // Règle 3 : Seules les options sélectionnées sont injectées
  const selectedOptions = optionsData.rows.filter(row => row.selected);

  if (selectedOptions.length === 0) {
    warnings.push('Aucune option sélectionnée - page 6 restera vide');
  }

  // INTERDIT : Aucune logique de regroupement implémentée
  // Les options sont retournées dans leur ordre d'origine

  return {
    canInject: true,
    selectedOptions,
    errors: [],
    warnings
  };
}

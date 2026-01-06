/**
 * Messages d'erreur structurés et bloquants
 * 
 * Chaque erreur contient :
 * - code : identifiant unique
 * - cause : description de l'erreur
 * - source : origine (Excel/CSV/Template/Validation)
 * - action : action attendue de l'utilisateur
 */

export type ErrorSource = 'Excel' | 'CSV' | 'Template' | 'Validation';

export interface BlockingError {
  code: string;
  message: string;
  cause: string;
  source: ErrorSource;
  action: string;
}

/**
 * Crée une erreur bloquante structurée
 */
export function createBlockingError(
  code: string,
  cause: string,
  source: ErrorSource,
  action: string
): BlockingError {
  return {
    code,
    message: `[${code}] ${cause}`,
    cause,
    source,
    action
  };
}

/**
 * Formate une erreur bloquante pour affichage utilisateur
 */
export function formatBlockingError(error: BlockingError): string {
  return `${error.message}\n` +
         `Source : ${error.source}\n` +
         `Action requise : ${error.action}`;
}

/**
 * Erreurs prédéfinies pour les cas bloquants courants
 */
export const BLOCKING_ERRORS = {
  // Erreurs Excel
  SHEET_MISSING: (sheetName: string) => createBlockingError(
    'SHEET_MISSING',
    `Onglet "${sheetName}" manquant ou renommé (espaces inclus)`,
    'Excel',
    `Réimportez le fichier avec l'onglet "${sheetName}" intact`
  ),

  SHEET_NAME_MISMATCH: (detected: string, expected: string) => createBlockingError(
    'SHEET_NAME_MISMATCH',
    `Onglet "${detected}" détecté mais "${expected}" attendu (vérifiez les espaces finaux)`,
    'Excel',
    `Renommez l'onglet exactement en "${expected}" et réimportez`
  ),

  INVEST_HEADER_NOT_FOUND: () => createBlockingError(
    'INVEST_HEADER_NOT_FOUND',
    'En-têtes "Invest" (Matériel 2025, Nb, VUN, VTN) introuvables en colonne B',
    'Excel',
    'Vérifiez que la ligne d\'en-tête existe dans l\'onglet "invest "'
  ),

  // Erreurs Validation
  INVEST_NOT_VALIDATED: (currentStatus: string) => createBlockingError(
    'INVEST_NOT_VALIDATED',
    `Statut Invest "${currentStatus}" - "valide_pret_injection" requis`,
    'Validation',
    'Validez explicitement les données Invest avant de continuer'
  ),

  INVEST_VALIDATION_ERRORS: (errorCount: number) => createBlockingError(
    'INVEST_VALIDATION_ERRORS',
    `${errorCount} erreur(s) de validation bloquante(s) détectée(s)`,
    'Validation',
    'Corrigez les erreurs dans le fichier Excel source et réimportez'
  ),

  EXPORT_PREREQUISITES_MISSING: (missing: string[]) => createBlockingError(
    'EXPORT_PREREQUISITES',
    `Prérequis manquants : ${missing.join(', ')}`,
    'Validation',
    'Complétez toutes les étapes requises avant l\'export'
  ),

  // Erreurs CSV
  CSV_CONTRACT_UNDEFINED: () => createBlockingError(
    'CSV_CONTRACT_UNDEFINED',
    'Contrat CSV non défini (séparateur, encodage, colonnes, types, clé)',
    'CSV',
    'Définissez le contrat CSV avant d\'appliquer les mises à jour'
  ),

  CSV_COLUMN_MISSING: (columnName: string) => createBlockingError(
    'CSV_COLUMN_MISSING',
    `Colonne "${columnName}" absente du fichier CSV`,
    'CSV',
    'Vérifiez que le fichier CSV contient toutes les colonnes requises'
  ),

  CSV_KEY_UNMATCHED: (keyValue: string) => createBlockingError(
    'CSV_KEY_UNMATCHED',
    `Clé "${keyValue}" du CSV ne correspond à aucune donnée existante`,
    'CSV',
    'Vérifiez la correspondance des clés entre le CSV et les données source'
  ),

  // Erreurs Template
  TABLE_TOO_LONG: (rowCount: number, maxRows?: number) => createBlockingError(
    'TABLE_TOO_LONG',
    maxRows 
      ? `Tableau Invest trop long (${rowCount} lignes, max ${maxRows})`
      : `Tableau Invest (${rowCount} lignes) - limite non définie`,
    'Template',
    'Réduisez le nombre de lignes ou définissez une règle de pagination'
  ),

  INJECTION_ZONE_UNDEFINED: (zone: string) => createBlockingError(
    'INJECTION_ZONE_UNDEFINED',
    `Zone d'injection "${zone}" non définie dans le template`,
    'Template',
    'Vérifiez que le template contient les zones d\'injection requises'
  ),

  // Erreurs de calcul
  CALCULATION_NOT_ALLOWED: (calculationType: string) => createBlockingError(
    'CALCULATION_NOT_ALLOWED',
    `Calcul "${calculationType}" non autorisé - aucune règle définie`,
    'Validation',
    'Utilisez les valeurs sources ou définissez explicitement les règles de calcul'
  ),
} as const;

/**
 * Vérifie si une erreur est bloquante (toutes le sont par défaut)
 */
export function isBlockingError(error: BlockingError): boolean {
  return true; // Toutes les erreurs de ce module sont bloquantes
}

/**
 * Crée un message d'erreur formaté pour les toasts/alertes
 */
export function createErrorToast(error: BlockingError): {
  title: string;
  description: string;
  variant: 'destructive';
} {
  return {
    title: `[${error.code}] ${error.source}`,
    description: `${error.cause}\n${error.action}`,
    variant: 'destructive'
  };
}

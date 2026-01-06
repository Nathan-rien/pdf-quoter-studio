// Parser pour l'onglet "invest " - Structure contractuelle
import { InvestData, InvestRow, ValidationError, InvestValidationStatus } from '@/types/quote';

// Colonnes contractuelles par POSITION (B=1, C=2, D=3, E=4 en 0-indexed: 1,2,3,4)
export const INVEST_COLUMNS = {
  B: { index: 1, name: 'designation', header: 'Matériel 2025', type: 'string' as const },
  C: { index: 2, name: 'nb', header: 'Nb', type: 'number' as const },
  D: { index: 3, name: 'vun', header: 'VUN', type: 'number' as const },
  E: { index: 4, name: 'vtn', header: 'VTN', type: 'number' as const },
} as const;

/**
 * Détection de la ligne d'en-tête (contient "Matériel" en colonne B)
 * Retourne l'index de la ligne ou null si non trouvée
 */
export function findInvestHeaderRow(sheetData: unknown[][]): number | null {
  for (let i = 0; i < sheetData.length; i++) {
    const row = sheetData[i];
    if (!row) continue;
    
    const cellB = row[INVEST_COLUMNS.B.index];
    if (typeof cellB === 'string' && cellB.includes('Matériel')) {
      return i;
    }
  }
  return null;
}

/**
 * Extrait une valeur string depuis une cellule Excel
 */
function extractString(cell: unknown): string | null {
  if (cell === null || cell === undefined || cell === '') return null;
  return String(cell);
}

/**
 * Extrait une valeur numérique depuis une cellule Excel
 * Gère les formules Excel (si l'objet contient .result)
 */
function extractNumber(cell: unknown): number | null {
  if (cell === null || cell === undefined || cell === '') return null;
  
  // Valeur numérique directe
  if (typeof cell === 'number') return cell;
  
  // Formule Excel avec résultat
  if (typeof cell === 'object' && cell !== null && 'result' in cell) {
    const result = (cell as { result: unknown }).result;
    return typeof result === 'number' ? result : null;
  }
  
  // Tentative de parsing string
  if (typeof cell === 'string') {
    const cleaned = cell.replace(',', '.').replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  
  return null;
}

/**
 * Parse l'onglet "invest " et retourne les données structurées
 */
export function parseInvestSheet(sheetData: unknown[][]): InvestData {
  // Données vides
  if (!sheetData || sheetData.length === 0) {
    return createEmptyInvestData('Onglet "invest " vide ou non accessible');
  }

  const headerRowIndex = findInvestHeaderRow(sheetData);
  
  // En-tête non trouvée
  if (headerRowIndex === null) {
    return {
      rows: [],
      headerRowIndex: -1,
      sourceSheet: 'invest ',
      isValidated: false,
      validationStatus: 'rejete_a_corriger',
      validationErrors: [{
        rowIndex: 0,
        column: 'B',
        message: 'En-tête "Matériel 2025" non trouvée dans la colonne B',
        severity: 'error'
      }]
    };
  }

  const rows: InvestRow[] = [];
  const errors: ValidationError[] = [];

  // Parser les lignes après l'en-tête
  for (let i = headerRowIndex + 1; i < sheetData.length; i++) {
    const row = sheetData[i];
    
    // Ignorer les lignes complètement vides
    if (!row || row.every(cell => cell === null || cell === undefined || cell === '')) {
      continue;
    }

    const investRow: InvestRow = {
      designation: extractString(row[INVEST_COLUMNS.B.index]),
      nb: extractNumber(row[INVEST_COLUMNS.C.index]),
      vun: extractNumber(row[INVEST_COLUMNS.D.index]),
      vtn: extractNumber(row[INVEST_COLUMNS.E.index]),
      rawRowIndex: i + 1 // Index 1-based pour affichage utilisateur
    };

    rows.push(investRow);
  }

  // Déterminer le statut initial
  const validationStatus: InvestValidationStatus = rows.length > 0 
    ? 'importe_non_valide' 
    : 'rejete_a_corriger';

  if (rows.length === 0) {
    errors.push({
      rowIndex: headerRowIndex + 1,
      column: '*',
      message: 'Aucune ligne de données trouvée après l\'en-tête',
      severity: 'error'
    });
  }

  return {
    rows,
    headerRowIndex,
    sourceSheet: 'invest ',
    isValidated: false,
    validationStatus,
    validationErrors: errors
  };
}

/**
 * Crée un objet InvestData vide avec une erreur
 */
function createEmptyInvestData(errorMessage: string): InvestData {
  return {
    rows: [],
    headerRowIndex: -1,
    sourceSheet: 'invest ',
    isValidated: false,
    validationStatus: 'non_importe',
    validationErrors: [{
      rowIndex: 0,
      column: '*',
      message: errorMessage,
      severity: 'error'
    }]
  };
}

/**
 * Calcule le total VTN pour affichage
 */
export function calculateInvestTotal(rows: InvestRow[]): number {
  return rows.reduce((sum, row) => sum + (row.vtn || 0), 0);
}

/**
 * Compte les lignes avec données valides
 */
export function countValidRows(rows: InvestRow[]): number {
  return rows.filter(row => 
    row.designation !== null || 
    row.nb !== null || 
    row.vun !== null || 
    row.vtn !== null
  ).length;
}

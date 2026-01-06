// Validation stricte des noms d'onglets Excel (sans normalisation)
import { REQUIRED_EXCEL_SHEETS, RequiredExcelSheet, SheetValidationResult, ExcelSheet } from '@/types/quote';

/**
 * Valide les noms d'onglets détectés contre les noms requis EXACTS
 * AUCUNE normalisation ou correction automatique n'est effectuée
 */
export function validateSheetNames(detectedSheets: string[]): SheetValidationResult {
  // Onglets manquants (comparaison exacte)
  const missingSheets = REQUIRED_EXCEL_SHEETS.filter(
    required => !detectedSheets.includes(required)
  );
  
  // Détection des correspondances "proches" (espaces finaux manquants/supplémentaires)
  const almostMatches: { detected: string; expected: string }[] = [];
  
  for (const detected of detectedSheets) {
    const trimmed = detected.trim();
    
    for (const required of REQUIRED_EXCEL_SHEETS) {
      const requiredTrimmed = required.trim();
      
      // Si les versions trimées correspondent mais pas les originales
      if (requiredTrimmed === trimmed && required !== detected) {
        almostMatches.push({
          detected,
          expected: required
        });
      }
    }
  }

  const errors: string[] = [];
  
  if (missingSheets.length > 0) {
    errors.push(`Onglets manquants : ${missingSheets.map(s => `"${s}"`).join(', ')}`);
  }
  
  if (almostMatches.length > 0) {
    for (const match of almostMatches) {
      const detectedHasSpace = match.detected.endsWith(' ');
      const expectedHasSpace = match.expected.endsWith(' ');
      
      if (expectedHasSpace && !detectedHasSpace) {
        errors.push(
          `Onglet "${match.detected}" détecté mais "${match.expected}" attendu (espace final OBLIGATOIRE)`
        );
      } else if (!expectedHasSpace && detectedHasSpace) {
        errors.push(
          `Onglet "${match.detected}" détecté mais "${match.expected}" attendu (espace final en trop)`
        );
      }
    }
  }

  // Onglets supplémentaires (non requis)
  const extraSheets = detectedSheets.filter(
    s => !REQUIRED_EXCEL_SHEETS.includes(s as RequiredExcelSheet)
  );

  return {
    isValid: missingSheets.length === 0 && almostMatches.length === 0,
    missingSheets,
    extraSheets,
    almostMatches,
    errors
  };
}

/**
 * Crée la liste des onglets avec leur statut de détection
 */
export function createSheetList(detectedSheets: string[]): ExcelSheet[] {
  const validation = validateSheetNames(detectedSheets);
  const sheets: ExcelSheet[] = [];

  // Ajouter les onglets requis
  for (const required of REQUIRED_EXCEL_SHEETS) {
    const found = detectedSheets.includes(required);
    const almostMatch = validation.almostMatches.find(m => m.expected === required);
    
    sheets.push({
      name: required,
      required: true,
      found,
      hasTrailingSpace: required.endsWith(' '),
      rowCount: undefined // Sera rempli par le parsing réel
    });
  }

  // Ajouter les onglets supplémentaires détectés
  for (const extra of validation.extraSheets) {
    // Ignorer si c'est un "almost match" (déjà traité)
    if (!validation.almostMatches.some(m => m.detected === extra)) {
      sheets.push({
        name: extra,
        required: false,
        found: true,
        hasTrailingSpace: extra.endsWith(' ')
      });
    }
  }

  return sheets;
}

/**
 * Vérifie si un onglet spécifique est présent (comparaison exacte)
 */
export function hasSheet(detectedSheets: string[], sheetName: RequiredExcelSheet): boolean {
  return detectedSheets.includes(sheetName);
}

/**
 * Affiche le nom d'un onglet avec indication visuelle de l'espace final
 */
export function displaySheetName(name: string): string {
  if (name.endsWith(' ')) {
    return `${name.trim()}␣`; // Symbole espace visible
  }
  return name;
}

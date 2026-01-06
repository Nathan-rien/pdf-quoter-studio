// Validation et parsing CSV avec contrat strict
import { CSVImportConfig, CSVImportResult, CSVImportError } from '@/types/quote';

/**
 * Valide un import CSV selon la configuration contractuelle
 * 
 * RÈGLES STRICTES :
 * - Configuration obligatoire (encodage, séparateur, colonnes, clé)
 * - Aucune inférence ou mapping "au plus proche"
 * - Aucune valeur par défaut pour les données manquantes
 * - Traçabilité complète
 */
export function validateCSVImport(
  content: string,
  fileName: string,
  config: CSVImportConfig | null
): CSVImportResult {
  const importDate = new Date();

  // BLOQUANT : pas de configuration
  if (!config) {
    return {
      fileName,
      importDate,
      rowCount: 0,
      isValid: false,
      errors: [{
        type: 'config_missing',
        message: 'Configuration CSV requise avant import. Veuillez définir : encodage, séparateur, colonnes exactes (noms contractuels), types de données, et colonne clé de correspondance.'
      }],
      config: null
    };
  }

  const errors: CSVImportError[] = [];
  
  // Parser le contenu
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  
  if (lines.length === 0) {
    return {
      fileName,
      importDate,
      rowCount: 0,
      isValid: false,
      errors: [{
        type: 'parse_error',
        message: 'Fichier CSV vide'
      }],
      config
    };
  }

  // Extraire l'en-tête
  const headerLine = lines[0];
  const header = parseCSVLine(headerLine, config.separator);

  // Vérification colonnes manquantes (noms EXACTS, pas de mapping)
  const missingColumns: string[] = [];
  for (const requiredCol of config.requiredColumns) {
    if (!header.includes(requiredCol)) {
      missingColumns.push(requiredCol);
    }
  }

  if (missingColumns.length > 0) {
    errors.push({
      type: 'missing_column',
      message: `Colonnes manquantes (noms exacts requis) : ${missingColumns.join(', ')}`,
      column: missingColumns[0]
    });
  }

  // Vérification colonne clé de correspondance
  if (!header.includes(config.keyColumn)) {
    errors.push({
      type: 'missing_column',
      column: config.keyColumn,
      message: `Colonne clé de correspondance "${config.keyColumn}" absente`
    });
  }

  // Compter les lignes de données (hors en-tête)
  const dataRowCount = lines.length - 1;

  return {
    fileName,
    importDate,
    rowCount: dataRowCount,
    isValid: errors.length === 0,
    errors,
    config,
    importedRows: errors.length === 0 ? dataRowCount : 0,
    matchedKeys: undefined // Sera calculé lors du matching réel avec les données existantes
  };
}

/**
 * Parse une ligne CSV selon le séparateur
 */
function parseCSVLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Crée une configuration CSV par défaut (à personnaliser par l'utilisateur)
 */
export function createDefaultCSVConfig(): Partial<CSVImportConfig> {
  return {
    encoding: 'utf-8',
    separator: ';',
    requiredColumns: [],
    keyColumn: '',
    columnTypes: {}
  };
}

/**
 * Valide une configuration CSV
 */
export function isValidCSVConfig(config: Partial<CSVImportConfig> | null): config is CSVImportConfig {
  if (!config) return false;
  
  return (
    typeof config.encoding === 'string' &&
    typeof config.separator === 'string' &&
    Array.isArray(config.requiredColumns) &&
    config.requiredColumns.length > 0 &&
    typeof config.keyColumn === 'string' &&
    config.keyColumn.length > 0
  );
}

/**
 * Messages de statut pour l'UI
 */
export function getCSVImportStatusMessage(result: CSVImportResult): {
  type: 'success' | 'error' | 'warning';
  title: string;
  details: string;
} {
  if (!result.isValid) {
    const errorCount = result.errors.length;
    return {
      type: 'error',
      title: `Import échoué (${errorCount} erreur${errorCount > 1 ? 's' : ''})`,
      details: result.errors.map(e => e.message).join(' | ')
    };
  }

  return {
    type: 'success',
    title: 'Import réussi',
    details: `${result.rowCount} ligne${result.rowCount > 1 ? 's' : ''} importée${result.rowCount > 1 ? 's' : ''}`
  };
}

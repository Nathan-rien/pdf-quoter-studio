// Validation et parsing CSV avec contrat strict
import { CSVImportConfig, CSVImportResult, CSVImportError, CSVImportMode } from '@/types/quote';

/**
 * Détermine le mode d'import CSV
 * 
 * MODE LECTURE_SEULE : Si contrat non défini, l'import est journalisé mais
 * AUCUNE mise à jour de prix n'est appliquée.
 * 
 * MODE APPLICATION : Si contrat complet, les mises à jour sont appliquées.
 */
export function determineCSVImportMode(config: CSVImportConfig | null): {
  mode: CSVImportMode;
  reason: string;
  missingElements: string[];
} {
  const missingElements: string[] = [];

  if (!config) {
    return {
      mode: 'lecture_seule',
      reason: 'Contrat CSV non défini. Import autorisé en lecture seule - aucune mise à jour de prix appliquée.',
      missingElements: ['encodage', 'séparateur', 'colonnes', 'clé de correspondance', 'types']
    };
  }

  // Vérifier que tous les éléments du contrat sont définis
  if (!config.encoding) missingElements.push('encodage');
  if (!config.separator) missingElements.push('séparateur');
  if (!config.requiredColumns || config.requiredColumns.length === 0) {
    missingElements.push('colonnes requises');
  }
  if (!config.keyColumn) missingElements.push('clé de correspondance');
  if (!config.columnTypes || Object.keys(config.columnTypes).length === 0) {
    missingElements.push('types de colonnes');
  }

  if (missingElements.length > 0) {
    return {
      mode: 'lecture_seule',
      reason: `Éléments manquants dans le contrat CSV : ${missingElements.join(', ')}. Import en lecture seule uniquement.`,
      missingElements
    };
  }

  return {
    mode: 'application',
    reason: 'Contrat CSV complet - mise à jour des prix autorisée',
    missingElements: []
  };
}

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
  const importMode = determineCSVImportMode(config);

  // MODE LECTURE SEULE : journaliser mais pas de validation stricte
  if (importMode.mode === 'lecture_seule') {
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    
    return {
      fileName,
      importDate,
      rowCount: Math.max(0, lines.length - 1), // -1 pour l'en-tête
      isValid: true, // Valide pour lecture seule
      errors: [{
        type: 'config_missing',
        message: importMode.reason
      }],
      config: null,
      importedRows: 0, // Aucune ligne appliquée
      matchedKeys: 0
    };
  }

  // MODE APPLICATION : validation stricte
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

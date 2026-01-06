// Parser pour l'onglet "Options services " - Gestion stricte
import { OptionsServicesData, OptionsServiceRow } from '@/types/quote';

/**
 * Parse l'onglet "Options services "
 * 
 * Règles contractuelles :
 * - Si l'onglet est vide : aucune option disponible, message explicite
 * - Si l'onglet contient des données mais structure non définie : erreur bloquante
 * - Aucune option mock n'est générée
 */
export function parseOptionsServicesSheet(sheetData: unknown[][] | null): OptionsServicesData {
  // Onglet non accessible
  if (!sheetData) {
    return {
      isEmpty: true,
      rows: [],
      structureError: 'Onglet "Options services " non accessible'
    };
  }

  // Vérification si onglet vide
  const hasData = sheetData.some(row => 
    row && row.some(cell => cell !== null && cell !== undefined && cell !== '')
  );

  if (!hasData) {
    return {
      isEmpty: true,
      rows: [],
      structureError: null // Pas une erreur, juste vide
    };
  }

  // L'onglet contient des données mais la structure des colonnes n'est pas définie
  // Selon le contrat : "La structure (colonnes exactes) de cet onglet doit être déclarée 
  // explicitement dès qu'elle existe"
  
  // Pour l'instant, on détecte les données mais on bloque avec un message explicite
  // car les colonnes contractuelles ne sont pas encore spécifiées
  return {
    isEmpty: false,
    rows: [],
    structureError: 
      'L\'onglet "Options services " contient des données mais la structure des colonnes ' +
      'n\'est pas encore définie contractuellement. Veuillez fournir la spécification ' +
      'des colonnes attendues (noms exacts, types, colonnes obligatoires).'
  };
}

/**
 * Vérifie si des options sont disponibles
 */
export function hasOptionsAvailable(data: OptionsServicesData): boolean {
  return !data.isEmpty && data.structureError === null && data.rows.length > 0;
}

/**
 * Vérifie si l'onglet est en erreur bloquante
 */
export function hasOptionsError(data: OptionsServicesData): boolean {
  return data.structureError !== null && !data.isEmpty;
}

/**
 * Message à afficher selon l'état
 */
export function getOptionsStatusMessage(data: OptionsServicesData): {
  type: 'empty' | 'error' | 'ready';
  message: string;
} {
  if (data.isEmpty) {
    return {
      type: 'empty',
      message: 'Onglet "Options services " vide — aucune option disponible'
    };
  }
  
  if (data.structureError) {
    return {
      type: 'error',
      message: data.structureError
    };
  }
  
  return {
    type: 'ready',
    message: `${data.rows.length} option(s) disponible(s)`
  };
}

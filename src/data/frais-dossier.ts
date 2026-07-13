// Mapping des frais de dossier par refinanceur
// Ces données sont fixes et proviennent du cahier des charges
// Noms des partenaires alignés avec le fichier Base Taux

export const FRAIS_DOSSIER: Record<string, number> = {
  'Lixxbail 1': 60,
  'Grenke 1': 0,
  'Franfinance 1': 118,
  'Olinn 2': 135,
  'BNP VR 2': 0,
  'BNP Crédit Bail 1': 0,
  'Olinn 2 PC Leno/HP/Dell': 135,
  'Olinn 2 PC autre marque': 135,
  'Olinn 2 Serveurs': 135,
  'Olinn 1 3D dental': 135,
  'Realease 2': 0,
};

/**
 * Récupère les frais de dossier pour un refinanceur donné
 * @param refinanceur Le nom du refinanceur
 * @returns Les frais de dossier en euros, ou null si non trouvé
 */
export function getFraisDossier(refinanceur: string | null): number | null {
  if (!refinanceur) return null;
  const key = normalizeRefinanceur(refinanceur);
  return FRAIS_DOSSIER[key] ?? null;
}

// Alias de compatibilité pour les anciennes valeurs enregistrées
const REFINANCEUR_ALIASES: Record<string, string> = {
  'BNP Credit Bail 1': 'BNP Crédit Bail 1',
};

export function normalizeRefinanceur(refinanceur: string): string {
  return REFINANCEUR_ALIASES[refinanceur] ?? refinanceur;
}

// Mapping des conditions de fin de contrat par refinanceur
export const CONDITION_FIN_CONTRAT: Record<string, string> = {
  // Reprise obligatoire loueur
  'Olinn 2': 'Reprise obligatoire loueur',
  'BNP VR 2': 'Reprise obligatoire loueur',
  'Olinn 2 PC Leno/HP/Dell': 'Reprise obligatoire loueur',
  'Olinn 2 PC autre marque': 'Reprise obligatoire loueur',
  'Olinn 2 Serveurs': 'Reprise obligatoire loueur',
  'Realease 2': 'Reprise obligatoire loueur',
  
  // Cession client possible
  'Lixxbail 1': 'Cession client possible',
  'Grenke 1': 'Cession client possible',
  'Franfinance 1': 'Cession client possible',
  'BNP Crédit Bail 1': 'Cession client possible',
  'Olinn 1 3D dental': 'Cession client possible',
};

/**
 * Récupère la condition de fin de contrat pour un refinanceur donné
 * @param refinanceur Le nom du refinanceur
 * @returns La condition de fin de contrat, ou null si non trouvé
 */
export function getConditionFinContrat(refinanceur: string | null): string | null {
  if (!refinanceur) return null;
  return CONDITION_FIN_CONTRAT[normalizeRefinanceur(refinanceur)] ?? null;
}

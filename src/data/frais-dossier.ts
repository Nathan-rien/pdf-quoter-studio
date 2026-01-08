// Mapping des frais de dossier par refinanceur
// Ces données sont fixes et proviennent du cahier des charges

export const FRAIS_DOSSIER: Record<string, number> = {
  'Lixxbail 1': 60,
  'Grenke': 0,
  'Franfinance': 118,
  'Olinn': 135,
  'BNP VR': 0,
  'BNP CréditBail': 0,
  'Olinn 2 PC Leno/HP/Dell': 135,
  'Olinn 2 PC autre marque': 135,
  'Olinn 2 serveurs': 135,
  'Olinn 1 3D dental': 135,
};

/**
 * Récupère les frais de dossier pour un refinanceur donné
 * @param refinanceur Le nom du refinanceur
 * @returns Les frais de dossier en euros, ou null si non trouvé
 */
export function getFraisDossier(refinanceur: string | null): number | null {
  if (!refinanceur) return null;
  return FRAIS_DOSSIER[refinanceur] ?? null;
}

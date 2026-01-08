// Mapping des frais de dossier par refinanceur
// Ces données sont fixes et proviennent du cahier des charges
// Noms des partenaires alignés avec le fichier Base Taux

export const FRAIS_DOSSIER: Record<string, number> = {
  'Lixxbail 1': 60,
  'Grenke 1': 0,
  'Franfinance 1': 118,
  'Olinn 2': 135,
  'BNP VR 2': 0,
  'BNP Credit Bail 1': 0,
  'Olinn 2 PC Leno/HP/Dell': 135,
  'Olinn 2 PC autre marque': 135,
  'Olinn 2 Serveurs': 135,
  'Olinn 1 3D dental': 135,
  'Realease 2': 0, // Nouveau partenaire - frais à confirmer
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

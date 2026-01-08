// Données Base Taux extraites du fichier Excel Matrice_Location_V1_4_1.xlsx
// Onglet "Base Taux" - 136 entrées exactes
// Durées en TRIMESTRES (ex: 12 trimestres = 36 mois)

export interface BaseTauxEntry {
  partenaire: string;
  montantMin: number;
  montantMax: number;
  dureeTrimestres: number; // en trimestres
  taux: number;
}

export const BASE_TAUX_DATA: BaseTauxEntry[] = [
  // ========== Lixxbail 1 (16 lignes) ==========
  { partenaire: 'Lixxbail 1', montantMin: 1000, montantMax: 5000, dureeTrimestres: 8, taux: 4.4232 },
  { partenaire: 'Lixxbail 1', montantMin: 5001, montantMax: 10000, dureeTrimestres: 8, taux: 4.405633 },
  { partenaire: 'Lixxbail 1', montantMin: 10001, montantMax: 20000, dureeTrimestres: 8, taux: 4.398633 },
  { partenaire: 'Lixxbail 1', montantMin: 20001, montantMax: 500000, dureeTrimestres: 8, taux: 4.377433 },
  { partenaire: 'Lixxbail 1', montantMin: 1000, montantMax: 5000, dureeTrimestres: 12, taux: 3.054 },
  { partenaire: 'Lixxbail 1', montantMin: 5001, montantMax: 10000, dureeTrimestres: 12, taux: 3.035233333 },
  { partenaire: 'Lixxbail 1', montantMin: 10001, montantMax: 20000, dureeTrimestres: 12, taux: 3.0277 },
  { partenaire: 'Lixxbail 1', montantMin: 20001, montantMax: 500000, dureeTrimestres: 12, taux: 3.0051 },
  { partenaire: 'Lixxbail 1', montantMin: 1000, montantMax: 5000, dureeTrimestres: 16, taux: 2.3738 },
  { partenaire: 'Lixxbail 1', montantMin: 5001, montantMax: 10000, dureeTrimestres: 16, taux: 2.354133333 },
  { partenaire: 'Lixxbail 1', montantMin: 10001, montantMax: 20000, dureeTrimestres: 16, taux: 2.3463 },
  { partenaire: 'Lixxbail 1', montantMin: 20001, montantMax: 500000, dureeTrimestres: 16, taux: 2.3227 },
  { partenaire: 'Lixxbail 1', montantMin: 1000, montantMax: 5000, dureeTrimestres: 20, taux: 1.968533333 },
  { partenaire: 'Lixxbail 1', montantMin: 5001, montantMax: 10000, dureeTrimestres: 20, taux: 1.9482 },
  { partenaire: 'Lixxbail 1', montantMin: 10001, montantMax: 20000, dureeTrimestres: 20, taux: 1.940066667 },
  { partenaire: 'Lixxbail 1', montantMin: 20001, montantMax: 500000, dureeTrimestres: 20, taux: 1.9157 },

  // ========== Grenke 1 (35 lignes) ==========
  { partenaire: 'Grenke 1', montantMin: 500, montantMax: 2500, dureeTrimestres: 6, taux: 5.8939 },
  { partenaire: 'Grenke 1', montantMin: 2501, montantMax: 5000, dureeTrimestres: 6, taux: 5.8939 },
  { partenaire: 'Grenke 1', montantMin: 5001, montantMax: 12500, dureeTrimestres: 6, taux: 5.8939 },
  { partenaire: 'Grenke 1', montantMin: 12501, montantMax: 25000, dureeTrimestres: 6, taux: 5.8939 },
  { partenaire: 'Grenke 1', montantMin: 25001, montantMax: 37500, dureeTrimestres: 6, taux: 5.8939 },
  { partenaire: 'Grenke 1', montantMin: 37501, montantMax: 50000, dureeTrimestres: 6, taux: 5.8939 },
  { partenaire: 'Grenke 1', montantMin: 50001, montantMax: 500000, dureeTrimestres: 6, taux: 5.8939 },
  { partenaire: 'Grenke 1', montantMin: 500, montantMax: 2500, dureeTrimestres: 8, taux: 4.5643 },
  { partenaire: 'Grenke 1', montantMin: 2501, montantMax: 5000, dureeTrimestres: 8, taux: 4.5643 },
  { partenaire: 'Grenke 1', montantMin: 5001, montantMax: 12500, dureeTrimestres: 8, taux: 4.5643 },
  { partenaire: 'Grenke 1', montantMin: 12501, montantMax: 25000, dureeTrimestres: 8, taux: 4.5643 },
  { partenaire: 'Grenke 1', montantMin: 25001, montantMax: 37500, dureeTrimestres: 8, taux: 4.5643 },
  { partenaire: 'Grenke 1', montantMin: 37501, montantMax: 50000, dureeTrimestres: 8, taux: 4.5643 },
  { partenaire: 'Grenke 1', montantMin: 50001, montantMax: 500000, dureeTrimestres: 8, taux: 4.5643 },
  { partenaire: 'Grenke 1', montantMin: 1, montantMax: 2500, dureeTrimestres: 12, taux: 3.1701 },
  { partenaire: 'Grenke 1', montantMin: 2501, montantMax: 5000, dureeTrimestres: 12, taux: 3.1701 },
  { partenaire: 'Grenke 1', montantMin: 5001, montantMax: 12500, dureeTrimestres: 12, taux: 3.1701 },
  { partenaire: 'Grenke 1', montantMin: 12501, montantMax: 25000, dureeTrimestres: 12, taux: 3.1701 },
  { partenaire: 'Grenke 1', montantMin: 25001, montantMax: 37500, dureeTrimestres: 12, taux: 3.1701 },
  { partenaire: 'Grenke 1', montantMin: 37501, montantMax: 50000, dureeTrimestres: 12, taux: 3.1701 },
  { partenaire: 'Grenke 1', montantMin: 50001, montantMax: 500000, dureeTrimestres: 12, taux: 3.1701 },
  { partenaire: 'Grenke 1', montantMin: 500, montantMax: 2500, dureeTrimestres: 16, taux: 2.4713 },
  { partenaire: 'Grenke 1', montantMin: 2501, montantMax: 5000, dureeTrimestres: 16, taux: 2.4713 },
  { partenaire: 'Grenke 1', montantMin: 5001, montantMax: 12500, dureeTrimestres: 16, taux: 2.4713 },
  { partenaire: 'Grenke 1', montantMin: 12501, montantMax: 25000, dureeTrimestres: 16, taux: 2.4713 },
  { partenaire: 'Grenke 1', montantMin: 25001, montantMax: 37500, dureeTrimestres: 16, taux: 2.4713 },
  { partenaire: 'Grenke 1', montantMin: 37501, montantMax: 50000, dureeTrimestres: 16, taux: 2.4713 },
  { partenaire: 'Grenke 1', montantMin: 50001, montantMax: 500000, dureeTrimestres: 16, taux: 2.4713 },
  { partenaire: 'Grenke 1', montantMin: 500, montantMax: 2500, dureeTrimestres: 20, taux: 2.0551 },
  { partenaire: 'Grenke 1', montantMin: 2501, montantMax: 5000, dureeTrimestres: 20, taux: 2.0551 },
  { partenaire: 'Grenke 1', montantMin: 5001, montantMax: 12500, dureeTrimestres: 20, taux: 2.0551 },
  { partenaire: 'Grenke 1', montantMin: 12501, montantMax: 25000, dureeTrimestres: 20, taux: 2.0551 },
  { partenaire: 'Grenke 1', montantMin: 25001, montantMax: 37500, dureeTrimestres: 20, taux: 2.0551 },
  { partenaire: 'Grenke 1', montantMin: 37501, montantMax: 50000, dureeTrimestres: 20, taux: 2.0551 },
  { partenaire: 'Grenke 1', montantMin: 50001, montantMax: 500000, dureeTrimestres: 20, taux: 2.0551 },

  // ========== Franfinance 1 (12 lignes) ==========
  { partenaire: 'Franfinance 1', montantMin: 1500, montantMax: 19999, dureeTrimestres: 8, taux: 4.4765 },
  { partenaire: 'Franfinance 1', montantMin: 20000, montantMax: 49999, dureeTrimestres: 8, taux: 4.4765 },
  { partenaire: 'Franfinance 1', montantMin: 50000, montantMax: 149999, dureeTrimestres: 8, taux: 4.4765 },
  { partenaire: 'Franfinance 1', montantMin: 1500, montantMax: 19999, dureeTrimestres: 12, taux: 3.0949 },
  { partenaire: 'Franfinance 1', montantMin: 20000, montantMax: 49999, dureeTrimestres: 12, taux: 3.0949 },
  { partenaire: 'Franfinance 1', montantMin: 50000, montantMax: 149999, dureeTrimestres: 12, taux: 3.0949 },
  { partenaire: 'Franfinance 1', montantMin: 1500, montantMax: 19999, dureeTrimestres: 16, taux: 2.4053 },
  { partenaire: 'Franfinance 1', montantMin: 20000, montantMax: 49999, dureeTrimestres: 16, taux: 2.4053 },
  { partenaire: 'Franfinance 1', montantMin: 50000, montantMax: 149999, dureeTrimestres: 16, taux: 2.4053 },
  { partenaire: 'Franfinance 1', montantMin: 1500, montantMax: 19999, dureeTrimestres: 20, taux: 1.9949 },
  { partenaire: 'Franfinance 1', montantMin: 20000, montantMax: 49999, dureeTrimestres: 20, taux: 1.9949 },
  { partenaire: 'Franfinance 1', montantMin: 50000, montantMax: 149999, dureeTrimestres: 20, taux: 1.9949 },

  // ========== Olinn 2 (16 lignes) ==========
  { partenaire: 'Olinn 2', montantMin: 5001, montantMax: 10000, dureeTrimestres: 8, taux: 4.4533 },
  { partenaire: 'Olinn 2', montantMin: 10001, montantMax: 25000, dureeTrimestres: 8, taux: 4.4433 },
  { partenaire: 'Olinn 2', montantMin: 25001, montantMax: 50000, dureeTrimestres: 8, taux: 4.43 },
  { partenaire: 'Olinn 2', montantMin: 50001, montantMax: 100000, dureeTrimestres: 8, taux: 4.4167 },
  { partenaire: 'Olinn 2', montantMin: 5001, montantMax: 10000, dureeTrimestres: 12, taux: 3.0717 },
  { partenaire: 'Olinn 2', montantMin: 10001, montantMax: 25000, dureeTrimestres: 12, taux: 3.0617 },
  { partenaire: 'Olinn 2', montantMin: 25001, montantMax: 50000, dureeTrimestres: 12, taux: 3.0483 },
  { partenaire: 'Olinn 2', montantMin: 50001, montantMax: 100000, dureeTrimestres: 12, taux: 3.035 },
  { partenaire: 'Olinn 2', montantMin: 5001, montantMax: 10000, dureeTrimestres: 16, taux: 2.3833 },
  { partenaire: 'Olinn 2', montantMin: 10001, montantMax: 25000, dureeTrimestres: 16, taux: 2.3733 },
  { partenaire: 'Olinn 2', montantMin: 25001, montantMax: 50000, dureeTrimestres: 16, taux: 2.36 },
  { partenaire: 'Olinn 2', montantMin: 50001, montantMax: 100000, dureeTrimestres: 16, taux: 2.3467 },
  { partenaire: 'Olinn 2', montantMin: 5001, montantMax: 10000, dureeTrimestres: 20, taux: 1.9733 },
  { partenaire: 'Olinn 2', montantMin: 10001, montantMax: 25000, dureeTrimestres: 20, taux: 1.9633 },
  { partenaire: 'Olinn 2', montantMin: 25001, montantMax: 50000, dureeTrimestres: 20, taux: 1.95 },
  { partenaire: 'Olinn 2', montantMin: 50001, montantMax: 100000, dureeTrimestres: 20, taux: 1.9367 },

  // ========== BNP VR 2 (4 lignes) ==========
  { partenaire: 'BNP VR 2', montantMin: 1000, montantMax: 500000, dureeTrimestres: 8, taux: 4.3867 },
  { partenaire: 'BNP VR 2', montantMin: 1000, montantMax: 500000, dureeTrimestres: 12, taux: 3.01 },
  { partenaire: 'BNP VR 2', montantMin: 1000, montantMax: 500000, dureeTrimestres: 16, taux: 2.3283 },
  { partenaire: 'BNP VR 2', montantMin: 1000, montantMax: 500000, dureeTrimestres: 20, taux: 1.92 },

  // ========== BNP Credit Bail 1 (3 lignes) ==========
  { partenaire: 'BNP Credit Bail 1', montantMin: 1000, montantMax: 500000, dureeTrimestres: 12, taux: 3.0183 },
  { partenaire: 'BNP Credit Bail 1', montantMin: 1000, montantMax: 500000, dureeTrimestres: 16, taux: 2.3367 },
  { partenaire: 'BNP Credit Bail 1', montantMin: 1000, montantMax: 500000, dureeTrimestres: 20, taux: 1.9283 },

  // ========== Olinn 2 PC Leno/HP/Dell (8 lignes) ==========
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 25001, montantMax: 50000, dureeTrimestres: 8, taux: 4.3917 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 50001, montantMax: 100000, dureeTrimestres: 8, taux: 4.3783 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 25001, montantMax: 50000, dureeTrimestres: 12, taux: 3.0233 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 50001, montantMax: 100000, dureeTrimestres: 12, taux: 3.01 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 25001, montantMax: 50000, dureeTrimestres: 16, taux: 2.3433 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 50001, montantMax: 100000, dureeTrimestres: 16, taux: 2.33 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 25001, montantMax: 50000, dureeTrimestres: 20, taux: 1.9383 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 50001, montantMax: 100000, dureeTrimestres: 20, taux: 1.925 },

  // ========== Olinn 2 PC autre marque (8 lignes) ==========
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 25001, montantMax: 50000, dureeTrimestres: 8, taux: 4.4167 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 50001, montantMax: 100000, dureeTrimestres: 8, taux: 4.4033 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 25001, montantMax: 50000, dureeTrimestres: 12, taux: 3.0383 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 50001, montantMax: 100000, dureeTrimestres: 12, taux: 3.025 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 25001, montantMax: 50000, dureeTrimestres: 16, taux: 2.355 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 50001, montantMax: 100000, dureeTrimestres: 16, taux: 2.3417 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 25001, montantMax: 50000, dureeTrimestres: 20, taux: 1.9467 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 50001, montantMax: 100000, dureeTrimestres: 20, taux: 1.9333 },

  // ========== Olinn 2 Serveurs (8 lignes) ==========
  { partenaire: 'Olinn 2 Serveurs', montantMin: 25001, montantMax: 50000, dureeTrimestres: 8, taux: 4.4383 },
  { partenaire: 'Olinn 2 Serveurs', montantMin: 50001, montantMax: 100000, dureeTrimestres: 8, taux: 4.425 },
  { partenaire: 'Olinn 2 Serveurs', montantMin: 25001, montantMax: 50000, dureeTrimestres: 12, taux: 3.055 },
  { partenaire: 'Olinn 2 Serveurs', montantMin: 50001, montantMax: 100000, dureeTrimestres: 12, taux: 3.0417 },
  { partenaire: 'Olinn 2 Serveurs', montantMin: 25001, montantMax: 50000, dureeTrimestres: 16, taux: 2.3667 },
  { partenaire: 'Olinn 2 Serveurs', montantMin: 50001, montantMax: 100000, dureeTrimestres: 16, taux: 2.3533 },
  { partenaire: 'Olinn 2 Serveurs', montantMin: 25001, montantMax: 50000, dureeTrimestres: 20, taux: 1.9567 },
  { partenaire: 'Olinn 2 Serveurs', montantMin: 50001, montantMax: 100000, dureeTrimestres: 20, taux: 1.9433 },

  // ========== Olinn 1 3D dental (8 lignes) ==========
  { partenaire: 'Olinn 1 3D dental', montantMin: 10000, montantMax: 25000, dureeTrimestres: 8, taux: 4.195 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 25001, montantMax: 75000, dureeTrimestres: 8, taux: 4.1817 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 10000, montantMax: 25000, dureeTrimestres: 12, taux: 2.8917 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 25001, montantMax: 75000, dureeTrimestres: 12, taux: 2.8783 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 10000, montantMax: 25000, dureeTrimestres: 16, taux: 2.2383 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 25001, montantMax: 75000, dureeTrimestres: 16, taux: 2.225 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 10000, montantMax: 25000, dureeTrimestres: 20, taux: 1.8517 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 25001, montantMax: 75000, dureeTrimestres: 20, taux: 1.8383 },

  // ========== Realease 2 (18 lignes) ==========
  { partenaire: 'Realease 2', montantMin: 2500, montantMax: 4999, dureeTrimestres: 12, taux: 3.0993 },
  { partenaire: 'Realease 2', montantMin: 5000, montantMax: 9999, dureeTrimestres: 12, taux: 3.0993 },
  { partenaire: 'Realease 2', montantMin: 10000, montantMax: 29999, dureeTrimestres: 12, taux: 3.0993 },
  { partenaire: 'Realease 2', montantMin: 30000, montantMax: 49999, dureeTrimestres: 12, taux: 3.0993 },
  { partenaire: 'Realease 2', montantMin: 50000, montantMax: 74999, dureeTrimestres: 12, taux: 3.0993 },
  { partenaire: 'Realease 2', montantMin: 75000, montantMax: 100000, dureeTrimestres: 12, taux: 3.0993 },
  { partenaire: 'Realease 2', montantMin: 2500, montantMax: 4999, dureeTrimestres: 16, taux: 2.4059 },
  { partenaire: 'Realease 2', montantMin: 5000, montantMax: 9999, dureeTrimestres: 16, taux: 2.4059 },
  { partenaire: 'Realease 2', montantMin: 10000, montantMax: 29999, dureeTrimestres: 16, taux: 2.4059 },
  { partenaire: 'Realease 2', montantMin: 30000, montantMax: 49999, dureeTrimestres: 16, taux: 2.4059 },
  { partenaire: 'Realease 2', montantMin: 50000, montantMax: 74999, dureeTrimestres: 16, taux: 2.4059 },
  { partenaire: 'Realease 2', montantMin: 75000, montantMax: 100000, dureeTrimestres: 16, taux: 2.4059 },
  { partenaire: 'Realease 2', montantMin: 2500, montantMax: 4999, dureeTrimestres: 20, taux: 1.9954 },
  { partenaire: 'Realease 2', montantMin: 5000, montantMax: 9999, dureeTrimestres: 20, taux: 1.9954 },
  { partenaire: 'Realease 2', montantMin: 10000, montantMax: 29999, dureeTrimestres: 20, taux: 1.9954 },
  { partenaire: 'Realease 2', montantMin: 30000, montantMax: 49999, dureeTrimestres: 20, taux: 1.9954 },
  { partenaire: 'Realease 2', montantMin: 50000, montantMax: 74999, dureeTrimestres: 20, taux: 1.9954 },
  { partenaire: 'Realease 2', montantMin: 75000, montantMax: 100000, dureeTrimestres: 20, taux: 1.9954 },
];

// Liste des partenaires uniques
export const PARTENAIRES = [
  'Lixxbail 1',
  'Grenke 1',
  'Franfinance 1',
  'Olinn 2',
  'BNP VR 2',
  'BNP Credit Bail 1',
  'Olinn 2 PC Leno/HP/Dell',
  'Olinn 2 PC autre marque',
  'Olinn 2 Serveurs',
  'Olinn 1 3D dental',
  'Realease 2',
] as const;

export type Partenaire = typeof PARTENAIRES[number];

// Durées disponibles en trimestres
export const DUREES_TRIMESTRES = [6, 8, 12, 16, 20] as const;

/**
 * Convertit une durée en mois vers trimestres
 */
export function moisEnTrimestres(mois: number): number {
  return Math.round(mois / 3);
}

/**
 * Convertit une durée en trimestres vers mois
 */
export function trimestresEnMois(trimestres: number): number {
  return trimestres * 3;
}

// Données Base Taux extraites du fichier Excel Matrice_Location_V1_4_1-2.xlsx
// Onglet "Base Taux" - 136 entrées exactes
// Durées en MOIS (ex: 36 mois = 36)

export interface BaseTauxEntry {
  partenaire: string;
  montantMin: number;
  montantMax: number;
  dureeMois: number; // en mois
  taux: number;
}

export const BASE_TAUX_DATA: BaseTauxEntry[] = [
  // ========== Lixxbail 1 (16 lignes) ==========
  { partenaire: 'Lixxbail 1', montantMin: 1000, montantMax: 5000, dureeMois: 24, taux: 4.4232 },
  { partenaire: 'Lixxbail 1', montantMin: 5001, montantMax: 10000, dureeMois: 24, taux: 4.405633 },
  { partenaire: 'Lixxbail 1', montantMin: 10001, montantMax: 20000, dureeMois: 24, taux: 4.398633 },
  { partenaire: 'Lixxbail 1', montantMin: 20001, montantMax: 500000, dureeMois: 24, taux: 4.377433 },
  { partenaire: 'Lixxbail 1', montantMin: 1000, montantMax: 5000, dureeMois: 36, taux: 3.054 },
  { partenaire: 'Lixxbail 1', montantMin: 5001, montantMax: 10000, dureeMois: 36, taux: 3.035233333 },
  { partenaire: 'Lixxbail 1', montantMin: 10001, montantMax: 20000, dureeMois: 36, taux: 3.0277 },
  { partenaire: 'Lixxbail 1', montantMin: 20001, montantMax: 500000, dureeMois: 36, taux: 3.0051 },
  { partenaire: 'Lixxbail 1', montantMin: 1000, montantMax: 5000, dureeMois: 48, taux: 2.3738 },
  { partenaire: 'Lixxbail 1', montantMin: 5001, montantMax: 10000, dureeMois: 48, taux: 2.354133333 },
  { partenaire: 'Lixxbail 1', montantMin: 10001, montantMax: 20000, dureeMois: 48, taux: 2.3463 },
  { partenaire: 'Lixxbail 1', montantMin: 20001, montantMax: 500000, dureeMois: 48, taux: 2.3227 },
  { partenaire: 'Lixxbail 1', montantMin: 1000, montantMax: 5000, dureeMois: 60, taux: 1.968533333 },
  { partenaire: 'Lixxbail 1', montantMin: 5001, montantMax: 10000, dureeMois: 60, taux: 1.9482 },
  { partenaire: 'Lixxbail 1', montantMin: 10001, montantMax: 20000, dureeMois: 60, taux: 1.940066667 },
  { partenaire: 'Lixxbail 1', montantMin: 20001, montantMax: 500000, dureeMois: 60, taux: 1.9157 },

  // ========== Grenke 1 (35 lignes - MISE A JOUR) ==========
  { partenaire: 'Grenke 1', montantMin: 500, montantMax: 2500, dureeMois: 18, taux: 6.02 },
  { partenaire: 'Grenke 1', montantMin: 2501, montantMax: 5000, dureeMois: 18, taux: 6.01 },
  { partenaire: 'Grenke 1', montantMin: 5001, montantMax: 12500, dureeMois: 18, taux: 5.99 },
  { partenaire: 'Grenke 1', montantMin: 12501, montantMax: 25000, dureeMois: 18, taux: 5.98 },
  { partenaire: 'Grenke 1', montantMin: 25001, montantMax: 37500, dureeMois: 18, taux: 5.97 },
  { partenaire: 'Grenke 1', montantMin: 37501, montantMax: 50000, dureeMois: 18, taux: 5.96 },
  { partenaire: 'Grenke 1', montantMin: 50001, montantMax: 500000, dureeMois: 18, taux: 5.94 },
  { partenaire: 'Grenke 1', montantMin: 500, montantMax: 2500, dureeMois: 24, taux: 4.6 },
  { partenaire: 'Grenke 1', montantMin: 2501, montantMax: 5000, dureeMois: 24, taux: 4.59 },
  { partenaire: 'Grenke 1', montantMin: 5001, montantMax: 12500, dureeMois: 24, taux: 4.57 },
  { partenaire: 'Grenke 1', montantMin: 12501, montantMax: 25000, dureeMois: 24, taux: 4.56 },
  { partenaire: 'Grenke 1', montantMin: 25001, montantMax: 37500, dureeMois: 24, taux: 4.55 },
  { partenaire: 'Grenke 1', montantMin: 37501, montantMax: 50000, dureeMois: 24, taux: 4.54 },
  { partenaire: 'Grenke 1', montantMin: 50001, montantMax: 500000, dureeMois: 24, taux: 4.52 },
  { partenaire: 'Grenke 1', montantMin: 1, montantMax: 2500, dureeMois: 36, taux: 3.17 },
  { partenaire: 'Grenke 1', montantMin: 2501, montantMax: 5000, dureeMois: 36, taux: 3.16 },
  { partenaire: 'Grenke 1', montantMin: 5001, montantMax: 12500, dureeMois: 36, taux: 3.15 },
  { partenaire: 'Grenke 1', montantMin: 12501, montantMax: 25000, dureeMois: 36, taux: 3.14 },
  { partenaire: 'Grenke 1', montantMin: 25001, montantMax: 37500, dureeMois: 36, taux: 3.13 },
  { partenaire: 'Grenke 1', montantMin: 37501, montantMax: 50000, dureeMois: 36, taux: 3.12 },
  { partenaire: 'Grenke 1', montantMin: 50001, montantMax: 500000, dureeMois: 36, taux: 3.1 },
  { partenaire: 'Grenke 1', montantMin: 500, montantMax: 2500, dureeMois: 48, taux: 2.47 },
  { partenaire: 'Grenke 1', montantMin: 2501, montantMax: 5000, dureeMois: 48, taux: 2.46 },
  { partenaire: 'Grenke 1', montantMin: 5001, montantMax: 12500, dureeMois: 48, taux: 2.44 },
  { partenaire: 'Grenke 1', montantMin: 12501, montantMax: 25000, dureeMois: 48, taux: 2.43 },
  { partenaire: 'Grenke 1', montantMin: 25001, montantMax: 37500, dureeMois: 48, taux: 2.42 },
  { partenaire: 'Grenke 1', montantMin: 37501, montantMax: 50000, dureeMois: 48, taux: 2.4 },
  { partenaire: 'Grenke 1', montantMin: 50001, montantMax: 500000, dureeMois: 48, taux: 2.38 },
  { partenaire: 'Grenke 1', montantMin: 500, montantMax: 2500, dureeMois: 60, taux: 2.05 },
  { partenaire: 'Grenke 1', montantMin: 2501, montantMax: 5000, dureeMois: 60, taux: 2.04 },
  { partenaire: 'Grenke 1', montantMin: 5001, montantMax: 12500, dureeMois: 60, taux: 2.01 },
  { partenaire: 'Grenke 1', montantMin: 12501, montantMax: 25000, dureeMois: 60, taux: 2.0 },
  { partenaire: 'Grenke 1', montantMin: 25001, montantMax: 37500, dureeMois: 60, taux: 1.99 },
  { partenaire: 'Grenke 1', montantMin: 37501, montantMax: 50000, dureeMois: 60, taux: 1.98 },
  { partenaire: 'Grenke 1', montantMin: 50001, montantMax: 500000, dureeMois: 60, taux: 1.96 },

  // ========== Franfinance 1 (12 lignes - MISE A JOUR) ==========
  { partenaire: 'Franfinance 1', montantMin: 1500, montantMax: 19999, dureeMois: 24, taux: 4.424 },
  { partenaire: 'Franfinance 1', montantMin: 20000, montantMax: 49999, dureeMois: 24, taux: 4.40666667 },
  { partenaire: 'Franfinance 1', montantMin: 50000, montantMax: 149999, dureeMois: 24, taux: 4.394333 },
  { partenaire: 'Franfinance 1', montantMin: 1500, montantMax: 19999, dureeMois: 36, taux: 3.0503333 },
  { partenaire: 'Franfinance 1', montantMin: 20000, montantMax: 49999, dureeMois: 36, taux: 3.03166667 },
  { partenaire: 'Franfinance 1', montantMin: 50000, montantMax: 149999, dureeMois: 36, taux: 3.018666667 },
  { partenaire: 'Franfinance 1', montantMin: 1500, montantMax: 19999, dureeMois: 48, taux: 2.36533333 },
  { partenaire: 'Franfinance 1', montantMin: 20000, montantMax: 49999, dureeMois: 48, taux: 2.34566667 },
  { partenaire: 'Franfinance 1', montantMin: 50000, montantMax: 149999, dureeMois: 48, taux: 2.3323333 },
  { partenaire: 'Franfinance 1', montantMin: 1500, montantMax: 19999, dureeMois: 60, taux: 1.9553333 },
  { partenaire: 'Franfinance 1', montantMin: 20000, montantMax: 49999, dureeMois: 60, taux: 1.9353333 },
  { partenaire: 'Franfinance 1', montantMin: 50000, montantMax: 149999, dureeMois: 60, taux: 1.9213333 },

  // ========== Olinn 2 (16 lignes - MISE A JOUR) ==========
  { partenaire: 'Olinn 2', montantMin: 5001, montantMax: 10000, dureeMois: 24, taux: 4.661 },
  { partenaire: 'Olinn 2', montantMin: 10001, montantMax: 25000, dureeMois: 24, taux: 4.648 },
  { partenaire: 'Olinn 2', montantMin: 25001, montantMax: 50000, dureeMois: 24, taux: 4.64 },
  { partenaire: 'Olinn 2', montantMin: 50001, montantMax: 100000, dureeMois: 24, taux: 4.167 },
  { partenaire: 'Olinn 2', montantMin: 5001, montantMax: 10000, dureeMois: 36, taux: 3.216 },
  { partenaire: 'Olinn 2', montantMin: 10001, montantMax: 25000, dureeMois: 36, taux: 3.203 },
  { partenaire: 'Olinn 2', montantMin: 25001, montantMax: 50000, dureeMois: 36, taux: 3.194 },
  { partenaire: 'Olinn 2', montantMin: 50001, montantMax: 100000, dureeMois: 36, taux: 2.984 },
  { partenaire: 'Olinn 2', montantMin: 5001, montantMax: 10000, dureeMois: 48, taux: 2.498 },
  { partenaire: 'Olinn 2', montantMin: 10001, montantMax: 25000, dureeMois: 48, taux: 2.48 },
  { partenaire: 'Olinn 2', montantMin: 25001, montantMax: 50000, dureeMois: 48, taux: 2.472 },
  { partenaire: 'Olinn 2', montantMin: 50001, montantMax: 100000, dureeMois: 48, taux: 2.39 },
  { partenaire: 'Olinn 2', montantMin: 5001, montantMax: 10000, dureeMois: 60, taux: 2.72 },
  { partenaire: 'Olinn 2', montantMin: 10001, montantMax: 25000, dureeMois: 60, taux: 2.054 },
  { partenaire: 'Olinn 2', montantMin: 25001, montantMax: 50000, dureeMois: 60, taux: 2.045 },
  { partenaire: 'Olinn 2', montantMin: 50001, montantMax: 100000, dureeMois: 60, taux: 2.0 },

  // ========== BNP VR 2 (4 lignes - MISE A JOUR) ==========
  { partenaire: 'BNP VR 2', montantMin: 1000, montantMax: 500000, dureeMois: 24, taux: 4.12033 },
  { partenaire: 'BNP VR 2', montantMin: 1000, montantMax: 500000, dureeMois: 36, taux: 2.87567 },
  { partenaire: 'BNP VR 2', montantMin: 1000, montantMax: 500000, dureeMois: 48, taux: 2.264333333 },
  { partenaire: 'BNP VR 2', montantMin: 1000, montantMax: 500000, dureeMois: 60, taux: 1.902333333 },

  // ========== BNP Credit Bail 1 (3 lignes - MISE A JOUR) ==========
  { partenaire: 'BNP Credit Bail 1', montantMin: 1000, montantMax: 500000, dureeMois: 36, taux: 3.027333 },
  { partenaire: 'BNP Credit Bail 1', montantMin: 1000, montantMax: 500000, dureeMois: 48, taux: 2.344667 },
  { partenaire: 'BNP Credit Bail 1', montantMin: 1000, montantMax: 500000, dureeMois: 60, taux: 1.934667 },

  // ========== Olinn 2 PC Leno/HP/Dell (8 lignes - MISE A JOUR) ==========
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 25001, montantMax: 50000, dureeMois: 24, taux: 3.816 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 50001, montantMax: 100000, dureeMois: 24, taux: 3.811 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 25001, montantMax: 50000, dureeMois: 36, taux: 2.787 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 50001, montantMax: 100000, dureeMois: 36, taux: 2.777 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 25001, montantMax: 50000, dureeMois: 48, taux: 2.32 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 50001, montantMax: 100000, dureeMois: 48, taux: 2.311 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 25001, montantMax: 50000, dureeMois: 60, taux: 1.955 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 50001, montantMax: 100000, dureeMois: 60, taux: 1.946 },

  // ========== Olinn 2 PC autre marque (8 lignes - MISE A JOUR) ==========
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 25001, montantMax: 50000, dureeMois: 24, taux: 3.972 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 50001, montantMax: 100000, dureeMois: 24, taux: 3.967 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 25001, montantMax: 50000, dureeMois: 36, taux: 2.862 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 50001, montantMax: 100000, dureeMois: 36, taux: 2.853 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 25001, montantMax: 50000, dureeMois: 48, taux: 2.346 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 50001, montantMax: 100000, dureeMois: 48, taux: 2.337 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 25001, montantMax: 50000, dureeMois: 60, taux: 1.969 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 50001, montantMax: 100000, dureeMois: 60, taux: 1.96 },

  // ========== Olinn 2 Serveurs (8 lignes - MISE A JOUR) ==========
  { partenaire: 'Olinn 2 Serveurs', montantMin: 25001, montantMax: 50000, dureeMois: 24, taux: 4.128 },
  { partenaire: 'Olinn 2 Serveurs', montantMin: 50001, montantMax: 100000, dureeMois: 24, taux: 4.123 },
  { partenaire: 'Olinn 2 Serveurs', montantMin: 25001, montantMax: 50000, dureeMois: 36, taux: 2.963 },
  { partenaire: 'Olinn 2 Serveurs', montantMin: 50001, montantMax: 100000, dureeMois: 36, taux: 2.954 },
  { partenaire: 'Olinn 2 Serveurs', montantMin: 25001, montantMax: 50000, dureeMois: 48, taux: 2.375 },
  { partenaire: 'Olinn 2 Serveurs', montantMin: 50001, montantMax: 100000, dureeMois: 48, taux: 2.366 },
  { partenaire: 'Olinn 2 Serveurs', montantMin: 25001, montantMax: 50000, dureeMois: 60, taux: 1.997 },
  { partenaire: 'Olinn 2 Serveurs', montantMin: 50001, montantMax: 100000, dureeMois: 60, taux: 1.988 },

  // ========== Olinn 1 3D dental (8 lignes - MISE A JOUR) ==========
  { partenaire: 'Olinn 1 3D dental', montantMin: 10000, montantMax: 25000, dureeMois: 24, taux: 4.61 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 25001, montantMax: 75000, dureeMois: 24, taux: 4.57257 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 10000, montantMax: 25000, dureeMois: 36, taux: 3.17167 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 25001, montantMax: 75000, dureeMois: 36, taux: 3.14167 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 10000, montantMax: 25000, dureeMois: 48, taux: 2.44967 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 25001, montantMax: 75000, dureeMois: 48, taux: 2.429 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 10000, montantMax: 25000, dureeMois: 60, taux: 2.02 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 25001, montantMax: 75000, dureeMois: 60, taux: 1.9993 },

  // ========== Realease 2 (18 lignes - MISE A JOUR) ==========
  { partenaire: 'Realease 2', montantMin: 2500, montantMax: 4999, dureeMois: 36, taux: 3.401 },
  { partenaire: 'Realease 2', montantMin: 5000, montantMax: 9999, dureeMois: 36, taux: 3.398 },
  { partenaire: 'Realease 2', montantMin: 10000, montantMax: 29999, dureeMois: 36, taux: 3.279 },
  { partenaire: 'Realease 2', montantMin: 30000, montantMax: 49999, dureeMois: 36, taux: 3.248 },
  { partenaire: 'Realease 2', montantMin: 50000, montantMax: 74999, dureeMois: 36, taux: 3.203 },
  { partenaire: 'Realease 2', montantMin: 75000, montantMax: 100000, dureeMois: 36, taux: 3.173 },
  { partenaire: 'Realease 2', montantMin: 2500, montantMax: 4999, dureeMois: 48, taux: 2.675 },
  { partenaire: 'Realease 2', montantMin: 5000, montantMax: 9999, dureeMois: 48, taux: 2.662 },
  { partenaire: 'Realease 2', montantMin: 10000, montantMax: 29999, dureeMois: 48, taux: 2.556 },
  { partenaire: 'Realease 2', montantMin: 30000, montantMax: 49999, dureeMois: 48, taux: 2.532 },
  { partenaire: 'Realease 2', montantMin: 50000, montantMax: 74999, dureeMois: 48, taux: 2.473 },
  { partenaire: 'Realease 2', montantMin: 75000, montantMax: 100000, dureeMois: 48, taux: 2.45 },
  { partenaire: 'Realease 2', montantMin: 2500, montantMax: 4999, dureeMois: 60, taux: 2.231 },
  { partenaire: 'Realease 2', montantMin: 5000, montantMax: 9999, dureeMois: 60, taux: 2.229 },
  { partenaire: 'Realease 2', montantMin: 10000, montantMax: 29999, dureeMois: 60, taux: 2.149 },
  { partenaire: 'Realease 2', montantMin: 30000, montantMax: 49999, dureeMois: 60, taux: 2.115 },
  { partenaire: 'Realease 2', montantMin: 50000, montantMax: 74999, dureeMois: 60, taux: 2.071 },
  { partenaire: 'Realease 2', montantMin: 75000, montantMax: 100000, dureeMois: 60, taux: 1.047 },
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

// Durées disponibles en mois
export const DUREES_MOIS = [18, 24, 36, 48, 60] as const;

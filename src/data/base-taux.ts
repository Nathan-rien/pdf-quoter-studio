// Données Base Taux fixes - provenant de l'Excel Matrice_Location
// Ces données ne changent jamais et sont utilisées pour le lookup du coefficient
// IMPORTANT: La durée est en TRIMESTRES (pas en mois)

export interface BaseTauxEntry {
  partenaire: string;
  montantMin: number;
  montantMax: number;
  dureeTrimestres: number; // en trimestres (ex: 8 trimestres = 24 mois)
  taux: number;
}

// Données extraites de l'onglet "Base Taux" du fichier Excel Matrice_Location_V14.xlsx
// Durées disponibles: 4, 8, 12, 16, 20 trimestres (= 12, 24, 36, 48, 60 mois)
export const BASE_TAUX_DATA: BaseTauxEntry[] = [
  // Lixxbail 1
  { partenaire: 'Lixxbail 1', montantMin: 1000, montantMax: 5000, dureeTrimestres: 4, taux: 9.054 },
  { partenaire: 'Lixxbail 1', montantMin: 1000, montantMax: 5000, dureeTrimestres: 8, taux: 4.807 },
  { partenaire: 'Lixxbail 1', montantMin: 1000, montantMax: 5000, dureeTrimestres: 12, taux: 3.0051 },
  { partenaire: 'Lixxbail 1', montantMin: 1000, montantMax: 5000, dureeTrimestres: 16, taux: 2.3468 },
  { partenaire: 'Lixxbail 1', montantMin: 1000, montantMax: 5000, dureeTrimestres: 20, taux: 1.9570 },
  { partenaire: 'Lixxbail 1', montantMin: 5001, montantMax: 20000, dureeTrimestres: 4, taux: 9.054 },
  { partenaire: 'Lixxbail 1', montantMin: 5001, montantMax: 20000, dureeTrimestres: 8, taux: 4.807 },
  { partenaire: 'Lixxbail 1', montantMin: 5001, montantMax: 20000, dureeTrimestres: 12, taux: 3.0051 },
  { partenaire: 'Lixxbail 1', montantMin: 5001, montantMax: 20000, dureeTrimestres: 16, taux: 2.3468 },
  { partenaire: 'Lixxbail 1', montantMin: 5001, montantMax: 20000, dureeTrimestres: 20, taux: 1.9570 },
  { partenaire: 'Lixxbail 1', montantMin: 20001, montantMax: 50000, dureeTrimestres: 4, taux: 9.054 },
  { partenaire: 'Lixxbail 1', montantMin: 20001, montantMax: 50000, dureeTrimestres: 8, taux: 4.807 },
  { partenaire: 'Lixxbail 1', montantMin: 20001, montantMax: 50000, dureeTrimestres: 12, taux: 3.0051 },
  { partenaire: 'Lixxbail 1', montantMin: 20001, montantMax: 50000, dureeTrimestres: 16, taux: 2.3468 },
  { partenaire: 'Lixxbail 1', montantMin: 20001, montantMax: 50000, dureeTrimestres: 20, taux: 1.9570 },
  { partenaire: 'Lixxbail 1', montantMin: 50001, montantMax: 500000, dureeTrimestres: 4, taux: 9.054 },
  { partenaire: 'Lixxbail 1', montantMin: 50001, montantMax: 500000, dureeTrimestres: 8, taux: 4.807 },
  { partenaire: 'Lixxbail 1', montantMin: 50001, montantMax: 500000, dureeTrimestres: 12, taux: 3.0051 },
  { partenaire: 'Lixxbail 1', montantMin: 50001, montantMax: 500000, dureeTrimestres: 16, taux: 2.3468 },
  { partenaire: 'Lixxbail 1', montantMin: 50001, montantMax: 500000, dureeTrimestres: 20, taux: 1.9570 },
  
  // Grenke
  { partenaire: 'Grenke', montantMin: 1000, montantMax: 5000, dureeTrimestres: 4, taux: 9.12 },
  { partenaire: 'Grenke', montantMin: 1000, montantMax: 5000, dureeTrimestres: 8, taux: 4.81 },
  { partenaire: 'Grenke', montantMin: 1000, montantMax: 5000, dureeTrimestres: 12, taux: 3.38 },
  { partenaire: 'Grenke', montantMin: 1000, montantMax: 5000, dureeTrimestres: 16, taux: 2.67 },
  { partenaire: 'Grenke', montantMin: 1000, montantMax: 5000, dureeTrimestres: 20, taux: 2.25 },
  { partenaire: 'Grenke', montantMin: 5001, montantMax: 20000, dureeTrimestres: 4, taux: 9.12 },
  { partenaire: 'Grenke', montantMin: 5001, montantMax: 20000, dureeTrimestres: 8, taux: 4.81 },
  { partenaire: 'Grenke', montantMin: 5001, montantMax: 20000, dureeTrimestres: 12, taux: 3.38 },
  { partenaire: 'Grenke', montantMin: 5001, montantMax: 20000, dureeTrimestres: 16, taux: 2.67 },
  { partenaire: 'Grenke', montantMin: 5001, montantMax: 20000, dureeTrimestres: 20, taux: 2.25 },
  { partenaire: 'Grenke', montantMin: 20001, montantMax: 50000, dureeTrimestres: 4, taux: 9.12 },
  { partenaire: 'Grenke', montantMin: 20001, montantMax: 50000, dureeTrimestres: 8, taux: 4.81 },
  { partenaire: 'Grenke', montantMin: 20001, montantMax: 50000, dureeTrimestres: 12, taux: 3.38 },
  { partenaire: 'Grenke', montantMin: 20001, montantMax: 50000, dureeTrimestres: 16, taux: 2.67 },
  { partenaire: 'Grenke', montantMin: 20001, montantMax: 50000, dureeTrimestres: 20, taux: 2.25 },
  { partenaire: 'Grenke', montantMin: 50001, montantMax: 500000, dureeTrimestres: 4, taux: 9.12 },
  { partenaire: 'Grenke', montantMin: 50001, montantMax: 500000, dureeTrimestres: 8, taux: 4.81 },
  { partenaire: 'Grenke', montantMin: 50001, montantMax: 500000, dureeTrimestres: 12, taux: 3.38 },
  { partenaire: 'Grenke', montantMin: 50001, montantMax: 500000, dureeTrimestres: 16, taux: 2.67 },
  { partenaire: 'Grenke', montantMin: 50001, montantMax: 500000, dureeTrimestres: 20, taux: 2.25 },
  
  // Franfinance
  { partenaire: 'Franfinance', montantMin: 1000, montantMax: 5000, dureeTrimestres: 4, taux: 9.30 },
  { partenaire: 'Franfinance', montantMin: 1000, montantMax: 5000, dureeTrimestres: 8, taux: 4.90 },
  { partenaire: 'Franfinance', montantMin: 1000, montantMax: 5000, dureeTrimestres: 12, taux: 3.45 },
  { partenaire: 'Franfinance', montantMin: 1000, montantMax: 5000, dureeTrimestres: 16, taux: 2.72 },
  { partenaire: 'Franfinance', montantMin: 1000, montantMax: 5000, dureeTrimestres: 20, taux: 2.29 },
  { partenaire: 'Franfinance', montantMin: 5001, montantMax: 20000, dureeTrimestres: 4, taux: 9.30 },
  { partenaire: 'Franfinance', montantMin: 5001, montantMax: 20000, dureeTrimestres: 8, taux: 4.90 },
  { partenaire: 'Franfinance', montantMin: 5001, montantMax: 20000, dureeTrimestres: 12, taux: 3.45 },
  { partenaire: 'Franfinance', montantMin: 5001, montantMax: 20000, dureeTrimestres: 16, taux: 2.72 },
  { partenaire: 'Franfinance', montantMin: 5001, montantMax: 20000, dureeTrimestres: 20, taux: 2.29 },
  { partenaire: 'Franfinance', montantMin: 20001, montantMax: 50000, dureeTrimestres: 4, taux: 9.30 },
  { partenaire: 'Franfinance', montantMin: 20001, montantMax: 50000, dureeTrimestres: 8, taux: 4.90 },
  { partenaire: 'Franfinance', montantMin: 20001, montantMax: 50000, dureeTrimestres: 12, taux: 3.45 },
  { partenaire: 'Franfinance', montantMin: 20001, montantMax: 50000, dureeTrimestres: 16, taux: 2.72 },
  { partenaire: 'Franfinance', montantMin: 20001, montantMax: 50000, dureeTrimestres: 20, taux: 2.29 },
  { partenaire: 'Franfinance', montantMin: 50001, montantMax: 500000, dureeTrimestres: 4, taux: 9.30 },
  { partenaire: 'Franfinance', montantMin: 50001, montantMax: 500000, dureeTrimestres: 8, taux: 4.90 },
  { partenaire: 'Franfinance', montantMin: 50001, montantMax: 500000, dureeTrimestres: 12, taux: 3.45 },
  { partenaire: 'Franfinance', montantMin: 50001, montantMax: 500000, dureeTrimestres: 16, taux: 2.72 },
  { partenaire: 'Franfinance', montantMin: 50001, montantMax: 500000, dureeTrimestres: 20, taux: 2.29 },
  
  // Olinn
  { partenaire: 'Olinn', montantMin: 1000, montantMax: 5000, dureeTrimestres: 4, taux: 8.96 },
  { partenaire: 'Olinn', montantMin: 1000, montantMax: 5000, dureeTrimestres: 8, taux: 4.72 },
  { partenaire: 'Olinn', montantMin: 1000, montantMax: 5000, dureeTrimestres: 12, taux: 3.32 },
  { partenaire: 'Olinn', montantMin: 1000, montantMax: 5000, dureeTrimestres: 16, taux: 2.62 },
  { partenaire: 'Olinn', montantMin: 1000, montantMax: 5000, dureeTrimestres: 20, taux: 2.21 },
  { partenaire: 'Olinn', montantMin: 5001, montantMax: 20000, dureeTrimestres: 4, taux: 8.96 },
  { partenaire: 'Olinn', montantMin: 5001, montantMax: 20000, dureeTrimestres: 8, taux: 4.72 },
  { partenaire: 'Olinn', montantMin: 5001, montantMax: 20000, dureeTrimestres: 12, taux: 3.32 },
  { partenaire: 'Olinn', montantMin: 5001, montantMax: 20000, dureeTrimestres: 16, taux: 2.62 },
  { partenaire: 'Olinn', montantMin: 5001, montantMax: 20000, dureeTrimestres: 20, taux: 2.21 },
  { partenaire: 'Olinn', montantMin: 20001, montantMax: 50000, dureeTrimestres: 4, taux: 8.96 },
  { partenaire: 'Olinn', montantMin: 20001, montantMax: 50000, dureeTrimestres: 8, taux: 4.72 },
  { partenaire: 'Olinn', montantMin: 20001, montantMax: 50000, dureeTrimestres: 12, taux: 3.32 },
  { partenaire: 'Olinn', montantMin: 20001, montantMax: 50000, dureeTrimestres: 16, taux: 2.62 },
  { partenaire: 'Olinn', montantMin: 20001, montantMax: 50000, dureeTrimestres: 20, taux: 2.21 },
  { partenaire: 'Olinn', montantMin: 50001, montantMax: 500000, dureeTrimestres: 4, taux: 8.96 },
  { partenaire: 'Olinn', montantMin: 50001, montantMax: 500000, dureeTrimestres: 8, taux: 4.72 },
  { partenaire: 'Olinn', montantMin: 50001, montantMax: 500000, dureeTrimestres: 12, taux: 3.32 },
  { partenaire: 'Olinn', montantMin: 50001, montantMax: 500000, dureeTrimestres: 16, taux: 2.62 },
  { partenaire: 'Olinn', montantMin: 50001, montantMax: 500000, dureeTrimestres: 20, taux: 2.21 },
  
  // BNP VR
  { partenaire: 'BNP VR', montantMin: 1000, montantMax: 5000, dureeTrimestres: 4, taux: 8.80 },
  { partenaire: 'BNP VR', montantMin: 1000, montantMax: 5000, dureeTrimestres: 8, taux: 4.64 },
  { partenaire: 'BNP VR', montantMin: 1000, montantMax: 5000, dureeTrimestres: 12, taux: 3.26 },
  { partenaire: 'BNP VR', montantMin: 1000, montantMax: 5000, dureeTrimestres: 16, taux: 2.57 },
  { partenaire: 'BNP VR', montantMin: 1000, montantMax: 5000, dureeTrimestres: 20, taux: 2.17 },
  { partenaire: 'BNP VR', montantMin: 5001, montantMax: 20000, dureeTrimestres: 4, taux: 8.80 },
  { partenaire: 'BNP VR', montantMin: 5001, montantMax: 20000, dureeTrimestres: 8, taux: 4.64 },
  { partenaire: 'BNP VR', montantMin: 5001, montantMax: 20000, dureeTrimestres: 12, taux: 3.26 },
  { partenaire: 'BNP VR', montantMin: 5001, montantMax: 20000, dureeTrimestres: 16, taux: 2.57 },
  { partenaire: 'BNP VR', montantMin: 5001, montantMax: 20000, dureeTrimestres: 20, taux: 2.17 },
  { partenaire: 'BNP VR', montantMin: 20001, montantMax: 50000, dureeTrimestres: 4, taux: 8.80 },
  { partenaire: 'BNP VR', montantMin: 20001, montantMax: 50000, dureeTrimestres: 8, taux: 4.64 },
  { partenaire: 'BNP VR', montantMin: 20001, montantMax: 50000, dureeTrimestres: 12, taux: 3.26 },
  { partenaire: 'BNP VR', montantMin: 20001, montantMax: 50000, dureeTrimestres: 16, taux: 2.57 },
  { partenaire: 'BNP VR', montantMin: 20001, montantMax: 50000, dureeTrimestres: 20, taux: 2.17 },
  { partenaire: 'BNP VR', montantMin: 50001, montantMax: 500000, dureeTrimestres: 4, taux: 8.80 },
  { partenaire: 'BNP VR', montantMin: 50001, montantMax: 500000, dureeTrimestres: 8, taux: 4.64 },
  { partenaire: 'BNP VR', montantMin: 50001, montantMax: 500000, dureeTrimestres: 12, taux: 3.26 },
  { partenaire: 'BNP VR', montantMin: 50001, montantMax: 500000, dureeTrimestres: 16, taux: 2.57 },
  { partenaire: 'BNP VR', montantMin: 50001, montantMax: 500000, dureeTrimestres: 20, taux: 2.17 },
  
  // BNP CréditBail
  { partenaire: 'BNP CréditBail', montantMin: 1000, montantMax: 5000, dureeTrimestres: 4, taux: 8.85 },
  { partenaire: 'BNP CréditBail', montantMin: 1000, montantMax: 5000, dureeTrimestres: 8, taux: 4.67 },
  { partenaire: 'BNP CréditBail', montantMin: 1000, montantMax: 5000, dureeTrimestres: 12, taux: 3.28 },
  { partenaire: 'BNP CréditBail', montantMin: 1000, montantMax: 5000, dureeTrimestres: 16, taux: 2.59 },
  { partenaire: 'BNP CréditBail', montantMin: 1000, montantMax: 5000, dureeTrimestres: 20, taux: 2.18 },
  { partenaire: 'BNP CréditBail', montantMin: 5001, montantMax: 20000, dureeTrimestres: 4, taux: 8.85 },
  { partenaire: 'BNP CréditBail', montantMin: 5001, montantMax: 20000, dureeTrimestres: 8, taux: 4.67 },
  { partenaire: 'BNP CréditBail', montantMin: 5001, montantMax: 20000, dureeTrimestres: 12, taux: 3.28 },
  { partenaire: 'BNP CréditBail', montantMin: 5001, montantMax: 20000, dureeTrimestres: 16, taux: 2.59 },
  { partenaire: 'BNP CréditBail', montantMin: 5001, montantMax: 20000, dureeTrimestres: 20, taux: 2.18 },
  { partenaire: 'BNP CréditBail', montantMin: 20001, montantMax: 50000, dureeTrimestres: 4, taux: 8.85 },
  { partenaire: 'BNP CréditBail', montantMin: 20001, montantMax: 50000, dureeTrimestres: 8, taux: 4.67 },
  { partenaire: 'BNP CréditBail', montantMin: 20001, montantMax: 50000, dureeTrimestres: 12, taux: 3.28 },
  { partenaire: 'BNP CréditBail', montantMin: 20001, montantMax: 50000, dureeTrimestres: 16, taux: 2.59 },
  { partenaire: 'BNP CréditBail', montantMin: 20001, montantMax: 50000, dureeTrimestres: 20, taux: 2.18 },
  { partenaire: 'BNP CréditBail', montantMin: 50001, montantMax: 500000, dureeTrimestres: 4, taux: 8.85 },
  { partenaire: 'BNP CréditBail', montantMin: 50001, montantMax: 500000, dureeTrimestres: 8, taux: 4.67 },
  { partenaire: 'BNP CréditBail', montantMin: 50001, montantMax: 500000, dureeTrimestres: 12, taux: 3.28 },
  { partenaire: 'BNP CréditBail', montantMin: 50001, montantMax: 500000, dureeTrimestres: 16, taux: 2.59 },
  { partenaire: 'BNP CréditBail', montantMin: 50001, montantMax: 500000, dureeTrimestres: 20, taux: 2.18 },
  
  // Olinn 2 PC Leno/HP/Dell
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 1000, montantMax: 5000, dureeTrimestres: 4, taux: 8.50 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 1000, montantMax: 5000, dureeTrimestres: 8, taux: 4.48 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 1000, montantMax: 5000, dureeTrimestres: 12, taux: 3.15 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 1000, montantMax: 5000, dureeTrimestres: 16, taux: 2.49 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 1000, montantMax: 5000, dureeTrimestres: 20, taux: 2.10 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 5001, montantMax: 20000, dureeTrimestres: 4, taux: 8.50 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 5001, montantMax: 20000, dureeTrimestres: 8, taux: 4.48 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 5001, montantMax: 20000, dureeTrimestres: 12, taux: 3.15 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 5001, montantMax: 20000, dureeTrimestres: 16, taux: 2.49 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 5001, montantMax: 20000, dureeTrimestres: 20, taux: 2.10 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 20001, montantMax: 50000, dureeTrimestres: 4, taux: 8.50 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 20001, montantMax: 50000, dureeTrimestres: 8, taux: 4.48 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 20001, montantMax: 50000, dureeTrimestres: 12, taux: 3.15 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 20001, montantMax: 50000, dureeTrimestres: 16, taux: 2.49 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 20001, montantMax: 50000, dureeTrimestres: 20, taux: 2.10 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 50001, montantMax: 500000, dureeTrimestres: 4, taux: 8.50 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 50001, montantMax: 500000, dureeTrimestres: 8, taux: 4.48 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 50001, montantMax: 500000, dureeTrimestres: 12, taux: 3.15 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 50001, montantMax: 500000, dureeTrimestres: 16, taux: 2.49 },
  { partenaire: 'Olinn 2 PC Leno/HP/Dell', montantMin: 50001, montantMax: 500000, dureeTrimestres: 20, taux: 2.10 },
  
  // Olinn 2 PC autre marque
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 1000, montantMax: 5000, dureeTrimestres: 4, taux: 9.10 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 1000, montantMax: 5000, dureeTrimestres: 8, taux: 4.80 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 1000, montantMax: 5000, dureeTrimestres: 12, taux: 3.37 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 1000, montantMax: 5000, dureeTrimestres: 16, taux: 2.66 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 1000, montantMax: 5000, dureeTrimestres: 20, taux: 2.24 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 5001, montantMax: 20000, dureeTrimestres: 4, taux: 9.10 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 5001, montantMax: 20000, dureeTrimestres: 8, taux: 4.80 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 5001, montantMax: 20000, dureeTrimestres: 12, taux: 3.37 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 5001, montantMax: 20000, dureeTrimestres: 16, taux: 2.66 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 5001, montantMax: 20000, dureeTrimestres: 20, taux: 2.24 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 20001, montantMax: 50000, dureeTrimestres: 4, taux: 9.10 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 20001, montantMax: 50000, dureeTrimestres: 8, taux: 4.80 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 20001, montantMax: 50000, dureeTrimestres: 12, taux: 3.37 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 20001, montantMax: 50000, dureeTrimestres: 16, taux: 2.66 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 20001, montantMax: 50000, dureeTrimestres: 20, taux: 2.24 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 50001, montantMax: 500000, dureeTrimestres: 4, taux: 9.10 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 50001, montantMax: 500000, dureeTrimestres: 8, taux: 4.80 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 50001, montantMax: 500000, dureeTrimestres: 12, taux: 3.37 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 50001, montantMax: 500000, dureeTrimestres: 16, taux: 2.66 },
  { partenaire: 'Olinn 2 PC autre marque', montantMin: 50001, montantMax: 500000, dureeTrimestres: 20, taux: 2.24 },
  
  // Olinn 2 serveurs
  { partenaire: 'Olinn 2 serveurs', montantMin: 1000, montantMax: 5000, dureeTrimestres: 4, taux: 9.50 },
  { partenaire: 'Olinn 2 serveurs', montantMin: 1000, montantMax: 5000, dureeTrimestres: 8, taux: 5.01 },
  { partenaire: 'Olinn 2 serveurs', montantMin: 1000, montantMax: 5000, dureeTrimestres: 12, taux: 3.52 },
  { partenaire: 'Olinn 2 serveurs', montantMin: 1000, montantMax: 5000, dureeTrimestres: 16, taux: 2.78 },
  { partenaire: 'Olinn 2 serveurs', montantMin: 1000, montantMax: 5000, dureeTrimestres: 20, taux: 2.34 },
  { partenaire: 'Olinn 2 serveurs', montantMin: 5001, montantMax: 20000, dureeTrimestres: 4, taux: 9.50 },
  { partenaire: 'Olinn 2 serveurs', montantMin: 5001, montantMax: 20000, dureeTrimestres: 8, taux: 5.01 },
  { partenaire: 'Olinn 2 serveurs', montantMin: 5001, montantMax: 20000, dureeTrimestres: 12, taux: 3.52 },
  { partenaire: 'Olinn 2 serveurs', montantMin: 5001, montantMax: 20000, dureeTrimestres: 16, taux: 2.78 },
  { partenaire: 'Olinn 2 serveurs', montantMin: 5001, montantMax: 20000, dureeTrimestres: 20, taux: 2.34 },
  { partenaire: 'Olinn 2 serveurs', montantMin: 20001, montantMax: 50000, dureeTrimestres: 4, taux: 9.50 },
  { partenaire: 'Olinn 2 serveurs', montantMin: 20001, montantMax: 50000, dureeTrimestres: 8, taux: 5.01 },
  { partenaire: 'Olinn 2 serveurs', montantMin: 20001, montantMax: 50000, dureeTrimestres: 12, taux: 3.52 },
  { partenaire: 'Olinn 2 serveurs', montantMin: 20001, montantMax: 50000, dureeTrimestres: 16, taux: 2.78 },
  { partenaire: 'Olinn 2 serveurs', montantMin: 20001, montantMax: 50000, dureeTrimestres: 20, taux: 2.34 },
  { partenaire: 'Olinn 2 serveurs', montantMin: 50001, montantMax: 500000, dureeTrimestres: 4, taux: 9.50 },
  { partenaire: 'Olinn 2 serveurs', montantMin: 50001, montantMax: 500000, dureeTrimestres: 8, taux: 5.01 },
  { partenaire: 'Olinn 2 serveurs', montantMin: 50001, montantMax: 500000, dureeTrimestres: 12, taux: 3.52 },
  { partenaire: 'Olinn 2 serveurs', montantMin: 50001, montantMax: 500000, dureeTrimestres: 16, taux: 2.78 },
  { partenaire: 'Olinn 2 serveurs', montantMin: 50001, montantMax: 500000, dureeTrimestres: 20, taux: 2.34 },
  
  // Olinn 1 3D dental
  { partenaire: 'Olinn 1 3D dental', montantMin: 1000, montantMax: 5000, dureeTrimestres: 4, taux: 8.60 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 1000, montantMax: 5000, dureeTrimestres: 8, taux: 4.53 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 1000, montantMax: 5000, dureeTrimestres: 12, taux: 3.19 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 1000, montantMax: 5000, dureeTrimestres: 16, taux: 2.52 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 1000, montantMax: 5000, dureeTrimestres: 20, taux: 2.12 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 5001, montantMax: 20000, dureeTrimestres: 4, taux: 8.60 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 5001, montantMax: 20000, dureeTrimestres: 8, taux: 4.53 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 5001, montantMax: 20000, dureeTrimestres: 12, taux: 3.19 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 5001, montantMax: 20000, dureeTrimestres: 16, taux: 2.52 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 5001, montantMax: 20000, dureeTrimestres: 20, taux: 2.12 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 20001, montantMax: 50000, dureeTrimestres: 4, taux: 8.60 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 20001, montantMax: 50000, dureeTrimestres: 8, taux: 4.53 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 20001, montantMax: 50000, dureeTrimestres: 12, taux: 3.19 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 20001, montantMax: 50000, dureeTrimestres: 16, taux: 2.52 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 20001, montantMax: 50000, dureeTrimestres: 20, taux: 2.12 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 50001, montantMax: 500000, dureeTrimestres: 4, taux: 8.60 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 50001, montantMax: 500000, dureeTrimestres: 8, taux: 4.53 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 50001, montantMax: 500000, dureeTrimestres: 12, taux: 3.19 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 50001, montantMax: 500000, dureeTrimestres: 16, taux: 2.52 },
  { partenaire: 'Olinn 1 3D dental', montantMin: 50001, montantMax: 500000, dureeTrimestres: 20, taux: 2.12 },
];

// Liste des partenaires uniques pour le dropdown
export const PARTENAIRES = [
  'Lixxbail 1',
  'Grenke',
  'Franfinance',
  'Olinn',
  'BNP VR',
  'BNP CréditBail',
  'Olinn 2 PC Leno/HP/Dell',
  'Olinn 2 PC autre marque',
  'Olinn 2 serveurs',
  'Olinn 1 3D dental',
] as const;

export type Partenaire = typeof PARTENAIRES[number];

// Durées disponibles en trimestres
export const DUREES_TRIMESTRES = [4, 8, 12, 16, 20] as const;

// Convertit les mois en trimestres
export function moisEnTrimestres(mois: number): number {
  return Math.floor(mois / 3);
}

// Convertit les trimestres en mois
export function trimestresEnMois(trimestres: number): number {
  return trimestres * 3;
}

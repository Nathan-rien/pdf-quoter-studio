import { RepriseGradeRow } from '@/stores/rentalProposalStore';

const TVA_RATE = 0.20;

export interface RepriseGradeComputed extends RepriseGradeRow {
  margeGeneree: number;
  totalHT: number;
  tva: number;
  totalTTC: number;
}

export function computeRepriseGrades(
  grades: RepriseGradeRow[],
  marge: number,
): RepriseGradeComputed[] {
  return grades.map((g) => {
    const margeGeneree = Math.round(g.prixPartenaire * marge * 100) / 100;
    const totalHT = Math.round((g.prixPartenaire - margeGeneree) * 100) / 100;
    const tva = Math.round(totalHT * TVA_RATE * 100) / 100;
    const totalTTC = Math.round((totalHT + tva) * 100) / 100;
    return { ...g, margeGeneree, totalHT, tva, totalTTC };
  });
}

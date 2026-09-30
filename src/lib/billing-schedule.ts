import { addMonths, getDaysInMonth, getDate, setDate, isBefore } from 'date-fns';

export interface ProchaineFacturation {
  date: Date | null;
  enRetard: boolean;
}

/**
 * Prochaine échéance de facturation d'un contrat.
 * - Le jour cible est `override` si renseigné, sinon le jour de `dateMiseEnPlace`.
 * - On avance d'une période (mensuelle ou trimestrielle) depuis `derniereFacturationLe`
 *   si renseignée, sinon depuis `dateMiseEnPlace`.
 * - Si le jour cible n'existe pas dans le mois calculé (ex: 31 en février), on retombe
 *   sur le dernier jour de ce mois.
 */
export function getProchaineFacturation(
  dateMiseEnPlace: Date,
  periodicite: 'mensuel' | 'trimestriel',
  override: number | null,
  dateFin: Date | null,
  derniereFacturationLe: Date | null,
): ProchaineFacturation {
  const base = derniereFacturationLe ?? dateMiseEnPlace;
  const step = periodicite === 'trimestriel' ? 3 : 1;
  const targetDay = override ?? getDate(dateMiseEnPlace);

  const advanced = addMonths(base, step);
  const clampedDay = Math.min(targetDay, getDaysInMonth(advanced));
  const candidate = setDate(advanced, clampedDay);

  if (dateFin && isBefore(dateFin, candidate)) {
    return { date: null, enRetard: false };
  }

  return { date: candidate, enRetard: isBefore(candidate, new Date()) };
}

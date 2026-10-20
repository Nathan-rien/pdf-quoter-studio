import { addMonths, getDate, getDaysInMonth, isBefore, setDate, startOfDay, startOfMonth } from 'date-fns';

export interface ProchaineFacturation {
  date: Date | null;
  enRetard: boolean;
}

export interface ProchaineFacturationInput {
  dateMiseEnPlace: Date;
  periodicite: 'mensuel' | 'trimestriel';
  /** Jour de facturation forcé ; sinon on utilise le jour de la mise en place. */
  jourOverride: number | null;
  /** Durée du contrat en mois ; null = pas de fin. */
  dureeMois: number | null;
  derniereFacturationLe: Date | null;
  /** Date de clôture du contrat (ISO) ; si renseignée, plus rien à facturer. */
  closedAt: string | null;
  /** Injectable pour les tests. */
  today?: Date;
}

/** Place `day` dans le mois de `monthRef`, en retombant sur le dernier jour si le mois est plus court. */
function withTargetDay(monthRef: Date, day: number): Date {
  const first = startOfMonth(monthRef);
  return setDate(first, Math.min(day, getDaysInMonth(first)));
}

/**
 * Prochaine échéance de facturation d'un contrat de services.
 * - Aucune facturation enregistrée : la facture tombe à la mise en place, sur le jour cible.
 * - Sinon : dernière facturation + 1 période (1 ou 3 mois), recalée sur le jour cible
 *   (clamp en fin de mois, ex. 31 → 28/29 février).
 * - Aucune échéance à partir de la fin de contrat (mise en place + durée, borne exclue) ni si le contrat est clos.
 * - En retard : échéance strictement avant aujourd'hui.
 */
export function getProchaineFacturation({
  dateMiseEnPlace,
  periodicite,
  jourOverride,
  dureeMois,
  derniereFacturationLe,
  closedAt,
  today = new Date(),
}: ProchaineFacturationInput): ProchaineFacturation {
  if (closedAt) return { date: null, enRetard: false };

  const targetDay = jourOverride ?? getDate(dateMiseEnPlace);
  const step = periodicite === 'trimestriel' ? 3 : 1;

  const candidate = derniereFacturationLe
    ? withTargetDay(addMonths(startOfMonth(derniereFacturationLe), step), targetDay)
    : withTargetDay(dateMiseEnPlace, targetDay);

  if (dureeMois != null && !isBefore(candidate, addMonths(dateMiseEnPlace, dureeMois))) {
    return { date: null, enRetard: false };
  }

  return { date: candidate, enRetard: isBefore(candidate, startOfDay(today)) };
}

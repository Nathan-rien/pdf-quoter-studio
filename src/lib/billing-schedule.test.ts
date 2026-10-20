import { describe, expect, it } from 'vitest';
import { getProchaineFacturation, type ProchaineFacturationInput } from './billing-schedule';

const d = (iso: string) => new Date(`${iso}T00:00:00`);
const iso = (date: Date | null) =>
  date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    : null;

const base: ProchaineFacturationInput = {
  dateMiseEnPlace: d('2026-01-10'),
  periodicite: 'mensuel',
  jourOverride: null,
  dureeMois: 36,
  derniereFacturationLe: null,
  closedAt: null,
  today: d('2025-12-01'),
};
const next = (over: Partial<ProchaineFacturationInput> = {}) => getProchaineFacturation({ ...base, ...over });

describe('getProchaineFacturation', () => {
  it('tombe à la date de mise en place si rien n\'a été facturé', () => {
    expect(iso(next().date)).toBe('2026-01-10');
  });

  it('utilise le jour override pour la première facture', () => {
    expect(iso(next({ jourOverride: 15 }).date)).toBe('2026-01-15');
  });

  it('mensuel : dernière facturation + 1 mois', () => {
    expect(iso(next({ derniereFacturationLe: d('2026-03-10') }).date)).toBe('2026-04-10');
  });

  it('trimestriel : dernière facturation + 3 mois', () => {
    expect(iso(next({ periodicite: 'trimestriel', derniereFacturationLe: d('2026-03-10') }).date)).toBe('2026-06-10');
  });

  it('recale sur le jour override même si la dernière facturation a eu lieu un autre jour', () => {
    expect(iso(next({ jourOverride: 15, derniereFacturationLe: d('2026-03-22') }).date)).toBe('2026-04-15');
  });

  it('clamp 31 → fin février (année non bissextile)', () => {
    expect(iso(next({ jourOverride: 31, derniereFacturationLe: d('2027-01-31') }).date)).toBe('2027-02-28');
  });

  it('clamp 31 → 29 février (année bissextile)', () => {
    expect(iso(next({ jourOverride: 31, derniereFacturationLe: d('2028-01-31') }).date)).toBe('2028-02-29');
  });

  it('clamp aussi quand le jour de mise en place est le 31', () => {
    const r = next({ dateMiseEnPlace: d('2026-01-31'), derniereFacturationLe: d('2026-01-31') });
    expect(iso(r.date)).toBe('2026-02-28');
  });

  it('revient au jour cible après un mois court', () => {
    const r = next({ jourOverride: 31, derniereFacturationLe: d('2027-02-28') });
    expect(iso(r.date)).toBe('2027-03-31');
  });

  it('pas de prochaine facture une fois la fin de contrat dépassée', () => {
    const r = next({ dureeMois: 12, derniereFacturationLe: d('2027-01-10') });
    expect(r).toEqual({ date: null, enRetard: false });
  });

  it('facture encore possible le jour exact de fin de contrat', () => {
    expect(iso(next({ dureeMois: 12, derniereFacturationLe: d('2026-12-10') }).date)).toBe('2027-01-10');
  });

  it('pas de prochaine facture si le contrat est clos', () => {
    expect(next({ closedAt: '2026-02-01T10:00:00Z' })).toEqual({ date: null, enRetard: false });
  });

  it('sans durée, pas de fin de contrat', () => {
    expect(iso(next({ dureeMois: null, derniereFacturationLe: d('2040-01-10') }).date)).toBe('2040-02-10');
  });

  it('en retard quand l\'échéance est avant aujourd\'hui', () => {
    const r = next({ derniereFacturationLe: d('2026-03-10'), today: d('2026-04-11') });
    expect(r.enRetard).toBe(true);
  });

  it('pas en retard le jour même de l\'échéance ni avant', () => {
    expect(next({ derniereFacturationLe: d('2026-03-10'), today: d('2026-04-10') }).enRetard).toBe(false);
    expect(next({ derniereFacturationLe: d('2026-03-10'), today: d('2026-04-09') }).enRetard).toBe(false);
  });

  it('jamais facturé et mise en place passée : en retard', () => {
    expect(next({ today: d('2026-02-01') }).enRetard).toBe(true);
  });
});

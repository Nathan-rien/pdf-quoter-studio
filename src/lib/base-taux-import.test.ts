import { describe, expect, it } from 'vitest';
import { parseBaseTauxSheetRows, planBaseTauxImport, type ParsedImportRow } from './base-taux-import';
import type { BaseTauxRow, FinancialPartner } from './partners';

const partners: FinancialPartner[] = [
  { id: 'g', name: 'Grenke 1', fraisDossier: 0, conditionFinContrat: null, aliases: ['Grenke'], isActive: true, sortOrder: 1 },
];
const existing: BaseTauxRow[] = [
  { id: 'r1', partnerId: 'g', montantMin: 1000, montantMax: 5000, dureeMois: 36, taux: 3, isActive: true },
  { id: 'r2', partnerId: 'g', montantMin: 5001, montantMax: 10000, dureeMois: 36, taux: 2.9, isActive: true },
];
const line = (over: Partial<ParsedImportRow>): ParsedImportRow => ({
  line: 2,
  partnerName: 'Grenke',
  montantMin: 1000,
  montantMax: 5000,
  dureeMois: 36,
  taux: 3,
  ...over,
});

describe('parseBaseTauxSheetRows', () => {
  it('parse les colonnes, convertit les trimestres en mois et applique le max par défaut', () => {
    const { rows, errors } = parseBaseTauxSheetRows([
      ['Partenaire', 'Montant min', 'Montant max', 'Durée Location', 'Taux'],
      ['Grenke 1', '1 000', '5000', 12, '3,05'],
      ['', 1, 2, 3, 4],
      ['Grenke 1', 5001, '', 8, 2.5],
    ]);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ partnerName: 'Grenke 1', montantMin: 1000, dureeMois: 36, taux: 3.05 });
    expect(rows[1]).toMatchObject({ montantMax: 500000, dureeMois: 24 });
  });
  it("lève une erreur sans ligne d'en-tête", () => {
    expect(() => parseBaseTauxSheetRows([['a', 'b', 'c']])).toThrow();
  });
});

describe('planBaseTauxImport', () => {
  it('résout les alias et classe inchangé / modifié / ajouté / supprimé', () => {
    const plan = planBaseTauxImport(partners, existing, [
      line({ taux: 3 }), // inchangé (alias Grenke)
      line({ montantMin: 5001, montantMax: 10000, taux: 2.5 }), // modifié
      line({ montantMin: 10001, montantMax: 20000, taux: 2.4 }), // ajouté
    ]);
    expect(plan.errors).toEqual([]);
    expect(plan.overlaps).toEqual([]);
    const d = plan.diffs[0];
    expect(d.partnerId).toBe('g');
    expect(d.unchanged).toBe(1);
    expect(d.updates.map((u) => u.existing.id)).toEqual(['r2']);
    expect(d.inserts).toHaveLength(1);
    expect(d.deletes).toEqual([]);
  });
  it('supprime les lignes absentes du fichier seulement si deleteMissing', () => {
    const rows = [line({})];
    expect(planBaseTauxImport(partners, existing, rows).diffs[0].deletes.map((r) => r.id)).toEqual(['r2']);
    expect(planBaseTauxImport(partners, existing, rows, { deleteMissing: false }).diffs[0].deletes).toEqual([]);
  });
  it('ne touche pas aux partenaires absents du fichier', () => {
    const plan = planBaseTauxImport(partners, existing, [line({ partnerName: 'Nouveau', montantMin: 1, montantMax: 2 })]);
    expect(plan.diffs).toHaveLength(1);
    expect(plan.diffs[0]).toMatchObject({ isNew: true, partnerId: null, partnerName: 'Nouveau' });
  });
  it('ignore les partenaires inconnus refusés', () => {
    const plan = planBaseTauxImport(partners, existing, [line({ partnerName: 'Nouveau' })], {
      skipNewPartners: new Set(['nouveau']),
    });
    expect(plan.diffs).toEqual([]);
  });
  it('signale lignes invalides et doublons sans les importer', () => {
    const plan = planBaseTauxImport(partners, existing, [line({}), line({ line: 3 }), line({ line: 4, taux: 0, montantMin: 20000, montantMax: 30000 })]);
    expect(plan.errors).toHaveLength(2);
  });
  it("détecte un chevauchement dans l'état final", () => {
    const plan = planBaseTauxImport(partners, existing, [line({}), line({ line: 3, montantMin: 4000, montantMax: 8000 })], {
      deleteMissing: false,
    });
    expect(plan.overlaps.length).toBeGreaterThan(0);
  });
});

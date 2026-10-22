import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { BaseTauxRow, FinancialPartner } from './partners';
import { setBaseTauxCache, setPartnersCache } from './partners-cache';
import { useRentalProposalStore } from '@/stores/rentalProposalStore';

const partners: FinancialPartner[] = [
  { id: 'ff', name: 'Franfinance 1', fraisDossier: 118, aliases: [], isActive: true, sortOrder: 1, conditionFinContrat: null },
  { id: 'gr', name: 'Grenke', fraisDossier: 150, aliases: [], isActive: true, sortOrder: 2, conditionFinContrat: null },
];
const rows: BaseTauxRow[] = [
  { id: 'r1', partnerId: 'ff', montantMin: 1500, montantMax: 19999, dureeMois: 36, taux: 3, fraisDossier: 60, isActive: true },
  { id: 'r2', partnerId: 'gr', montantMin: 1500, montantMax: 19999, dureeMois: 36, taux: 3, fraisDossier: null, isActive: true },
];
const oldProposal = { id: 'p1', montantInvestissement: 5000, duree: 36, refinanceur: 'Franfinance 1', margeAppliquee: 6, coefficientOverride: null };
const store = () => useRentalProposalStore.getState();
const fees = () => store().getAllProposalsCalculations().map((c) => c.calculations.fraisDossier);

beforeEach(() => { setPartnersCache(partners); setBaseTauxCache(rows); store().startNewProposal(); });
afterEach(() => { setPartnersCache([]); setBaseTauxCache([]); });

describe('frais de dossier des anciennes propositions', () => {
  it('une ancienne proposition rechargée garde 118 €', () => {
    store().loadFromExport({ proposals: [oldProposal] });
    expect(fees()).toEqual([118]);
    expect(store().getCalculatedValues().fraisDossierActuel).toBe(60);
    expect(store().getCalculatedValues().fraisDossierDiffere).toBe(true);
  });
  it('une nouvelle proposition prend 60 €', () => {
    store().updateProposal(store().proposals[0].id, { montantInvestissement: 5000, duree: 36, refinanceur: 'Franfinance 1' });
    expect(fees()).toEqual([60]);
  });
  it('un montant enregistré à l\'export est repris tel quel au rechargement', () => {
    store().loadFromExport({ proposals: [{ ...oldProposal, fraisDossierFige: 75 }] });
    expect(fees()).toEqual([75]);
  });
  it('la duplication d\'une ancienne proposition prend le tarif actuel', () => {
    store().loadFromExport({ proposals: [oldProposal] });
    store().duplicateProposal('p1');
    expect(fees()).toEqual([118, 60]);
  });
  it('« Appliquer les frais actuels » passe à 60 €', () => {
    store().loadFromExport({ proposals: [oldProposal] });
    store().applyCurrentFraisDossier();
    expect(fees()).toEqual([60]);
    expect(store().getCalculatedValues().fraisDossierDiffere).toBe(false);
  });
  it('changer de refinanceur abandonne l\'ancien montant', () => {
    store().loadFromExport({ proposals: [oldProposal] });
    store().updateProposal('p1', { refinanceur: 'Grenke' });
    expect(fees()).toEqual([150]);
  });
});

describe('« Appliquer les frais actuels » avec plusieurs scénarios', () => {
  const multiPartners: FinancialPartner[] = [
    { id: 'ff', name: 'Franfinance 1', fraisDossier: 118, aliases: [], isActive: true, sortOrder: 1, conditionFinContrat: null },
    { id: 'gr', name: 'Grenke 1', fraisDossier: 0, aliases: [], isActive: true, sortOrder: 2, conditionFinContrat: null },
  ];
  const multiRows: BaseTauxRow[] = [
    { id: 'a', partnerId: 'ff', montantMin: 1500, montantMax: 19999, dureeMois: 36, taux: 3, fraisDossier: 60, isActive: true },
    { id: 'b', partnerId: 'ff', montantMin: 20000, montantMax: 49999, dureeMois: 36, taux: 2.9, fraisDossier: null, isActive: true },
    { id: 'c', partnerId: 'gr', montantMin: 1500, montantMax: 49999, dureeMois: 36, taux: 3, fraisDossier: null, isActive: true },
  ];
  const base = { duree: 36, margeAppliquee: 6, coefficientOverride: null };
  const scenarios = [
    { ...base, id: 's1', montantInvestissement: 15000, refinanceur: 'Franfinance 1' },
    { ...base, id: 's2', montantInvestissement: 15000, refinanceur: 'Grenke 1' },
    { ...base, id: 's3', montantInvestissement: 25000, refinanceur: 'Franfinance 1' },
  ];
  beforeEach(() => { setPartnersCache(multiPartners); setBaseTauxCache(multiRows); });

  it('une ancienne proposition garde 118 € puis chaque scénario prend son propre tarif', () => {
    store().loadFromExport({ proposals: scenarios });
    expect(fees()).toEqual([118, 0, 118]);
    store().applyCurrentFraisDossier();
    expect(fees()).toEqual([60, 0, 118]);
  });

  it('une nouvelle proposition à 3 scénarios prend directement 60 / 0 / 118', () => {
    store().loadFromExport({ proposals: scenarios.map((s) => ({ ...s, fraisDossierFige: undefined })) });
    store().applyCurrentFraisDossier();
    expect(fees()).toEqual([60, 0, 118]);
  });
});

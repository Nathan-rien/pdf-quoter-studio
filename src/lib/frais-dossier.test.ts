import { afterEach, describe, expect, it } from 'vitest';
import { getFraisDossierIn, lookupCoefficientIn, type BaseTauxRow, type FinancialPartner } from './partners';
import { setBaseTauxCache, setPartnersCache } from './partners-cache';
import { calculateAllMatriceValues } from './rental-calculations';
import { substituteDynamicPlaceholders } from './template-render-utils';

const partners: FinancialPartner[] = [{ id: 'franfinance', name: 'Franfinance 1', fraisDossier: 118,
  aliases: ['Franfinance'], isActive: true, sortOrder: 1, conditionFinContrat: null }];
const rows: BaseTauxRow[] = [24, 36, 48, 60].flatMap((dureeMois) => [
  { id: `first-${dureeMois}`, partnerId: 'franfinance', montantMin: 1500, montantMax: 19999, dureeMois, taux: 3, fraisDossier: 60, isActive: true },
  { id: `second-${dureeMois}`, partnerId: 'franfinance', montantMin: 20000, montantMax: 49999, dureeMois, taux: 2, fraisDossier: null, isActive: true },
  { id: `third-${dureeMois}`, partnerId: 'franfinance', montantMin: 50000, montantMax: 149999, dureeMois, taux: 1, fraisDossier: null, isActive: true },
]);
afterEach(() => { setPartnersCache([]); setBaseTauxCache([]); });
describe('frais par tranche Franfinance', () => {
  it.each([24, 36, 48, 60])('60 € sur la première tranche à %i mois', (duration) => {
    expect(getFraisDossierIn(partners, 'Franfinance 1', rows, 5000, duration)).toBe(60);
  });
  it.each([24, 36, 48, 60])('118 € sur les autres tranches à %i mois', (duration) => {
    expect(getFraisDossierIn(partners, 'Franfinance 1', rows, 20000, duration)).toBe(118);
    expect(getFraisDossierIn(partners, 'Franfinance 1', rows, 50000, duration)).toBe(118);
  });
  it('bornes inclusives 1500 et 19999, tranche suivante à 20000', () => {
    expect(getFraisDossierIn(partners, 'Franfinance', rows, 1500, 24)).toBe(60);
    expect(getFraisDossierIn(partners, 'Franfinance', rows, 19999, 24)).toBe(60);
    expect(getFraisDossierIn(partners, 'Franfinance', rows, 20000, 24)).toBe(118);
  });
  it('zéro explicite ne reprend pas 118 €', () => {
    expect(getFraisDossierIn(partners, 'Franfinance', [{ ...rows[0], fraisDossier: 0 }], 5000, 24)).toBe(0);
  });
  it('sans ligne correspondante : défaut partenaire', () => {
    expect(getFraisDossierIn(partners, 'Franfinance', rows, 1000, 24)).toBe(118);
    expect(getFraisDossierIn(partners, 'Franfinance', rows, 5000, 18)).toBe(118);
  });
  it('même ligne active que le coefficient, y compris défaut NULL', () => {
    const overlapping = [{ ...rows[0], isActive: false }, { ...rows[0], id: 'active', taux: 4, fraisDossier: null }];
    expect(lookupCoefficientIn(partners, overlapping, 'Franfinance', 5000, 24)).toBe(4);
    expect(getFraisDossierIn(partners, 'Franfinance', overlapping, 5000, 24)).toBe(118);
  });
  it('Matrice et substitution PDF reçoivent 60 €, sans modifier le loyer ni le coefficient manuel', () => {
    setPartnersCache(partners); setBaseTauxCache(rows);
    const values = calculateAllMatriceValues(5000, 24, 'Franfinance', 0, [], 4);
    expect(values.fraisDossier).toBe(60);
    expect(values.coefficient).toBe(4);
    expect(values.loyerMensuel).toBe(200);
    expect(substituteDynamicPlaceholders('{{FRAIS_DOSSIER}}', { fraisDossier: values.fraisDossier })).toBe('60,00');
  });
});
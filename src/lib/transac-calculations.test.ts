import { describe, expect, it } from 'vitest';
import type { BaseTauxRow, FinancialPartner } from './partners';
import {
  computeTransacRental, computeTransacTotals, lineMargin, realMarkupRate, suggestedUnitPrice, type TransacLine,
} from './transac-calculations';
import { generateTransacQuoteHtml, toPrintModel } from './transac-html-generator';
import { TRANSAC_BRAND_DEFAULTS } from './transac-brands';

const line = (p: Partial<TransacLine>): TransacLine => ({
  id: Math.random().toString(), lineType: 'product', reference: '', designation: 'X', ecoParticipation: null,
  unitPriceHt: 0, quantity: 1, purchasePrice: null, supplier: '', supplierRef: '', markupRate: null, ...p,
});

describe('PU suggéré et taux de marque', () => {
  it('PU = achat / (1 − taux)', () => {
    expect(suggestedUnitPrice(75, 25)).toBe(100);
    expect(suggestedUnitPrice(100, 12.5)).toBe(114.29);
  });
  it('taux ≥ 100 % refusé', () => expect(suggestedUnitPrice(100, 100)).toBeNull());
  it('taux réel recalculé quand le PU est modifié', () => expect(realMarkupRate(120, 90)).toBe(25));
});

describe('marges et totaux', () => {
  it('marge ligne et totale, TVA 20 % et TTC au centime', () => {
    const t = computeTransacTotals([
      line({ unitPriceHt: 100, quantity: 3, purchasePrice: 75 }),
      line({ unitPriceHt: 10.333, quantity: 1, purchasePrice: 5 }),
    ]);
    expect(t.totalHt).toBe(310.33);
    expect(t.totalTva).toBe(62.07);
    expect(t.totalTtc).toBe(372.4);
    expect(t.margin).toBe(80.33);
    expect(t.hasNegativeMargin).toBe(false);
  });
  it('marge négative sur une ligne détectée même si le total reste positif', () => {
    const neg = line({ unitPriceHt: 80, quantity: 2, purchasePrice: 100 });
    expect(lineMargin(neg)).toBe(-40);
    const t = computeTransacTotals([neg, line({ unitPriceHt: 200, purchasePrice: 100 })]);
    expect(t.margin).toBe(60);
    expect(t.negativeLineIds).toEqual([neg.id]);
    expect(t.hasNegativeMargin).toBe(true);
  });
  it('marge totale négative', () => {
    expect(computeTransacTotals([line({ unitPriceHt: 50, purchasePrice: 60 })]).margin).toBe(-10);
  });
});

const partners: FinancialPartner[] = [
  { id: 'ff', name: 'Franfinance 1', fraisDossier: 118, aliases: [], isActive: true, sortOrder: 1, conditionFinContrat: null },
  { id: 'gr', name: 'Grenke 1', fraisDossier: 0, aliases: [], isActive: true, sortOrder: 2, conditionFinContrat: null },
  { id: 'old', name: 'Ancien', fraisDossier: 10, aliases: [], isActive: false, sortOrder: 3, conditionFinContrat: null },
];
const rows: BaseTauxRow[] = [
  { id: '1', partnerId: 'ff', montantMin: 1500, montantMax: 19999, dureeMois: 36, taux: 3.2, fraisDossier: 60, isActive: true },
  { id: '2', partnerId: 'ff', montantMin: 20000, montantMax: 49999, dureeMois: 36, taux: 3.0, fraisDossier: null, isActive: true },
  { id: '3', partnerId: 'gr', montantMin: 1000, montantMax: 49999, dureeMois: 36, taux: 3.1, isActive: true },
  { id: '4', partnerId: 'old', montantMin: 1000, montantMax: 49999, dureeMois: 36, taux: 1, isActive: true },
];

describe('option location via la base taux', () => {
  it('partenaire choisi : loyer, coût total, frais de tranche', () => {
    const r = computeTransacRental(partners, rows, { amount: 10000, durationMonths: 36, partnerName: 'Franfinance 1', periodicity: 'mensuel' });
    expect(r).toMatchObject({ status: 'ok', coefficient: 3.2, monthlyRent: 320, periodRent: 320, periods: 36, totalCost: 11520, fraisDossier: 60 });
  });
  it('trimestriel = 3 × mensuel, 12 périodes sur 36 mois', () => {
    const r = computeTransacRental(partners, rows, { amount: 10000, durationMonths: 36, partnerName: 'Franfinance 1', periodicity: 'trimestriel' });
    expect(r).toMatchObject({ status: 'ok', periodRent: 960, periods: 12, totalCost: 11520 });
  });
  it('meilleur coefficient parmi les partenaires actifs (inactif ignoré)', () => {
    const r = computeTransacRental(partners, rows, { amount: 10000, durationMonths: 36, partnerName: null, periodicity: 'mensuel' });
    expect(r).toMatchObject({ status: 'ok', partnerName: 'Grenke 1', coefficient: 3.1, fraisDossier: 0 });
  });
  it('Franfinance tranche 2 : frais du partenaire 118 €', () => {
    const r = computeTransacRental(partners, rows, { amount: 25000, durationMonths: 36, partnerName: 'Franfinance 1', periodicity: 'mensuel' });
    expect(r).toMatchObject({ status: 'ok', fraisDossier: 118 });
  });
  it('montant hors tranches : pas de loyer', () => {
    const r = computeTransacRental(partners, rows, { amount: 80000, durationMonths: 36, partnerName: null, periodicity: 'mensuel' });
    expect(r.status).toBe('out_of_range');
  });
});

describe('HTML exporté', () => {
  it("ne contient aucun champ interne et masque le partenaire", () => {
    const rental = computeTransacRental(partners, rows, { amount: 10000, durationMonths: 36, partnerName: 'Franfinance 1', periodicity: 'mensuel' });
    const html = generateTransacQuoteHtml(toPrintModel({
      brand: 'grosbill-pro', quoteNumber: 'Q-1', clientNumber: 'C1', clientName: 'ACME', quoteDate: '2026-10-23', validUntil: '2026-10-30',
      commercialName: 'Jonathan Breton', commercialPhone: '01', commercialEmail: 'j@x.fr', deliveryAddress: { name: 'ACME' }, billingAddress: {},
      billingSameAsDelivery: true, comment: '', rental,
      lines: [line({ designation: 'PC', unitPriceHt: 10000, purchasePrice: 7777.77, supplier: 'GROSSISTE-SECRET', supplierRef: 'REF-FOURN-SECRET', markupRate: 22.22 })],
    }, TRANSAC_BRAND_DEFAULTS['grosbill-pro'], 'logo.svg'));
    expect(html).not.toContain('7777');
    expect(html).not.toContain('GROSSISTE-SECRET');
    expect(html).not.toContain('REF-FOURN-SECRET');
    expect(html).not.toContain('22,22');
    expect(html).not.toContain('Franfinance');
    expect(html).toContain('Proposition de financement');
    expect(html).toContain('Indemnité légale de frais de recouvrement : 40 €');
  });
});

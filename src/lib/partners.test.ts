import { describe, expect, it } from 'vitest';
import {
  canonicalPartnerName,
  countReferences,
  findNameConflict,
  findOverlaps,
  getConditionFinContratIn,
  getFraisDossierIn,
  lookupCoefficientIn,
  normalizePartnerName,
  resolvePartner,
  validateBaseTauxDraft,
  type BaseTauxRow,
  type FinancialPartner,
} from './partners';

const partner = (over: Partial<FinancialPartner> & Pick<FinancialPartner, 'id' | 'name'>): FinancialPartner => ({
  fraisDossier: null,
  conditionFinContrat: null,
  aliases: [],
  isActive: true,
  sortOrder: null,
  ...over,
});

const partners: FinancialPartner[] = [
  partner({ id: 'grenke', name: 'Grenke 1', fraisDossier: 0, conditionFinContrat: 'Cession client possible', aliases: ['Grenke'] }),
  partner({
    id: 'olinn1',
    name: 'Olinn 1 3D dental',
    fraisDossier: 135,
    conditionFinContrat: 'Cession client possible',
    aliases: ['Olinn', 'Olinn 1'],
    isActive: false,
  }),
  partner({ id: 'lix2', name: 'Lixxbail 2', isActive: false }),
];

const row = (over: Partial<BaseTauxRow> & Pick<BaseTauxRow, 'partnerId'>): BaseTauxRow => ({
  id: Math.random().toString(36).slice(2),
  montantMin: 1000,
  montantMax: 5000,
  dureeMois: 36,
  taux: 3,
  isActive: true,
  ...over,
});

const rows: BaseTauxRow[] = [
  row({ id: 'g1', partnerId: 'grenke', montantMin: 1000, montantMax: 5000, taux: 3.1 }),
  row({ id: 'g2', partnerId: 'grenke', montantMin: 5001, montantMax: 10000, taux: 3.0 }),
  row({ id: 'o1', partnerId: 'olinn1', montantMin: 1000, montantMax: 5000, taux: 2.5 }),
];

describe('normalizePartnerName', () => {
  it('ignore casse et espaces de début/fin/internes', () => {
    expect(normalizePartnerName('  Lixxbail   1 ')).toBe('lixxbail 1');
    expect(normalizePartnerName(null)).toBe('');
  });
});

describe('resolvePartner', () => {
  it('résout par nom, insensible à la casse et aux espaces', () => {
    expect(resolvePartner(partners, ' grenke 1 ')?.id).toBe('grenke');
  });
  it('résout par alias', () => {
    expect(resolvePartner(partners, 'GRENKE')?.id).toBe('grenke');
    expect(resolvePartner(partners, 'Olinn')?.id).toBe('olinn1');
    expect(resolvePartner(partners, 'olinn 1')?.id).toBe('olinn1');
  });
  it('résout un partenaire inactif', () => {
    expect(resolvePartner(partners, 'Lixxbail 2')?.isActive).toBe(false);
  });
  it('retourne null si inconnu ou vide', () => {
    expect(resolvePartner(partners, 'Inconnu')).toBeNull();
    expect(resolvePartner(partners, '  ')).toBeNull();
    expect(resolvePartner(partners, null)).toBeNull();
  });
  it('canonicalPartnerName regroupe les variantes et garde la saisie si inconnu', () => {
    expect(canonicalPartnerName(partners, 'Olinn 1')).toBe('Olinn 1 3D dental');
    expect(canonicalPartnerName(partners, ' Autre ')).toBe('Autre');
  });
});

describe('frais de dossier et condition de fin de contrat', () => {
  it('résolus via alias, y compris partenaire inactif', () => {
    expect(getFraisDossierIn(partners, 'Olinn')).toBe(135);
    expect(getConditionFinContratIn(partners, 'Olinn')).toBe('Cession client possible');
  });
  it('null si partenaire inconnu ou valeur non renseignée', () => {
    expect(getFraisDossierIn(partners, 'Inconnu')).toBeNull();
    expect(getConditionFinContratIn(partners, 'Lixxbail 2')).toBeNull();
  });
});

describe('lookupCoefficientIn', () => {
  it('partenaire actif : trouve la tranche (bornes incluses)', () => {
    expect(lookupCoefficientIn(partners, rows, 'Grenke 1', 1000, 36)).toBe(3.1);
    expect(lookupCoefficientIn(partners, rows, 'Grenke 1', 5000, 36)).toBe(3.1);
    expect(lookupCoefficientIn(partners, rows, 'Grenke 1', 5001, 36)).toBe(3.0);
  });
  it('partenaire inactif : le coefficient reste disponible', () => {
    expect(lookupCoefficientIn(partners, rows, 'Olinn 1 3D dental', 2000, 36)).toBe(2.5);
  });
  it('alias : même résultat que le nom officiel', () => {
    expect(lookupCoefficientIn(partners, rows, 'grenke', 2000, 36)).toBe(3.1);
    expect(lookupCoefficientIn(partners, rows, ' Olinn ', 2000, 36)).toBe(2.5);
  });
  it('tranche ou durée absente, partenaire inconnu, entrées nulles : null', () => {
    expect(lookupCoefficientIn(partners, rows, 'Grenke 1', 999, 36)).toBeNull();
    expect(lookupCoefficientIn(partners, rows, 'Grenke 1', 2000, 48)).toBeNull();
    expect(lookupCoefficientIn(partners, rows, 'Inconnu', 2000, 36)).toBeNull();
    expect(lookupCoefficientIn(partners, rows, 'Grenke 1', null, 36)).toBeNull();
    expect(lookupCoefficientIn(partners, rows, 'Grenke 1', 2000, null)).toBeNull();
    expect(lookupCoefficientIn(partners, rows, 'Lixxbail 2', 2000, 36)).toBeNull();
  });
  it('préfère une ligne active à une ligne inactive de la même tranche', () => {
    const withInactive = [row({ id: 'x', partnerId: 'grenke', taux: 9, isActive: false }), ...rows];
    expect(lookupCoefficientIn(partners, withInactive, 'Grenke 1', 2000, 36)).toBe(3.1);
    const onlyInactive = [row({ id: 'y', partnerId: 'grenke', montantMin: 20000, montantMax: 30000, taux: 1.5, isActive: false })];
    expect(lookupCoefficientIn(partners, onlyInactive, 'Grenke 1', 25000, 36)).toBe(1.5);
  });
});

describe('validation et chevauchements', () => {
  const base = { partnerId: 'grenke', montantMin: 20000, montantMax: 30000, dureeMois: 36, taux: 2 };
  it('accepte un brouillon valide', () => {
    expect(validateBaseTauxDraft(base)).toEqual([]);
  });
  it('refuse min >= max, taux <= 0, durée non entière', () => {
    expect(validateBaseTauxDraft({ ...base, montantMin: 30000 })).toHaveLength(1);
    expect(validateBaseTauxDraft({ ...base, taux: 0 })).toHaveLength(1);
    expect(validateBaseTauxDraft({ ...base, dureeMois: 36.5 })).toHaveLength(1);
  });
  it('détecte un chevauchement pour même partenaire et durée, bornes incluses', () => {
    expect(findOverlaps(rows, { ...base, montantMin: 5000, montantMax: 6000 }).map((r) => r.id)).toEqual(['g1', 'g2']);
  });
  it('ignore tranches adjacentes, autre durée, autre partenaire et la ligne éditée', () => {
    expect(findOverlaps(rows, { ...base, montantMin: 10001, montantMax: 20000 })).toEqual([]);
    expect(findOverlaps(rows, { ...base, montantMin: 1000, montantMax: 5000, dureeMois: 48 })).toEqual([]);
    expect(findOverlaps(rows, { ...base, partnerId: 'lix2', montantMin: 1000, montantMax: 5000 })).toEqual([]);
    expect(findOverlaps(rows, { id: 'g1', ...base, montantMin: 1000, montantMax: 4000 })).toEqual([]);
  });
});

describe('conflits de noms et références', () => {
  it('détecte un nom ou alias déjà pris par un autre partenaire', () => {
    expect(findNameConflict(partners, ['olinn'])).toContain('Olinn 1 3D dental');
    expect(findNameConflict(partners, ['GRENKE 1'], 'olinn1')).toContain('Grenke 1');
    expect(findNameConflict(partners, ['Grenke'], 'grenke')).toBeNull();
    expect(findNameConflict(partners, ['Nouveau'])).toBeNull();
  });
  it('compte les références via nom et alias', () => {
    const values = ['Olinn', 'olinn 1', 'Olinn 1 3D dental', ' OLINN ', 'Grenke', null];
    expect(countReferences(partners[1], values)).toBe(4);
  });
});

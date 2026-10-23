// Mentions par marque des devis transactionnels. Valeurs par défaut ici,
// surchargées par les admins via admin_settings (clé transac_brand_<marque>).
export type TransacBrand = 'cybertek-pro' | 'grosbill-pro';

export interface TransacBrandSettings {
  label: string;
  phone: string;
  email: string;
  website: string;
  cgvUrl: string;
  legalFooter: string;
  conditions: string;
}

const conditions = (cgvLine: string) =>
  [
    'Délai de livraison : 24 à 48h sur stock disponible',
    "Date d'échéance : date de facture",
    'Intérêts de retard : taux 1,5 % par mois – Indemnité légale de frais de recouvrement : 40 €',
    'Escompte pour paiement anticipé : néant',
    cgvLine,
  ].join('\n');

export const TRANSAC_BRAND_DEFAULTS: Record<TransacBrand, TransacBrandSettings> = {
  'cybertek-pro': {
    label: 'Cybertek Pro',
    phone: '05 56 11 88 99',
    email: 'commercial@cybertek-pro.fr',
    website: 'www.cybertek-pro.fr',
    cgvUrl: 'www.cybertek.fr',
    legalFooter:
      'S.A.S. GROUPE CYBERTEK au capital de 4 471 800 € — Siège social : 130 rue Achard, Bât. U, 33300 Bordeaux — 408 772 960 RCS Bordeaux — TVA intracommunautaire FR78 408 772 960',
    conditions: conditions(
      'Les conditions générales de vente de CYBERTEK sont applicables. Elles sont régulièrement actualisées et tenues à jour sur le site www.cybertek.fr',
    ),
  },
  'grosbill-pro': {
    label: 'Grosbill Pro',
    phone: '01 84 25 92 72',
    email: 'contact@grosbill-pro.com',
    website: 'www.grosbill-pro.com',
    cgvUrl: 'https://www.grosbill-pro.com/cgv',
    legalFooter:
      'GROSBILL-PRO, entité commerciale du GROUPE CYBERTEK, SAS au capital de 4 471 800 € — 130 rue Achard, Bât. U, 33300 Bordeaux — SIRET 408 772 960 00022 — APE 4741Z — TVA intracommunautaire FR78 408 772 960',
    conditions: conditions(
      'Les conditions générales de vente de GROSBILL-PRO sont applicables. Elles sont régulièrement actualisées et tenues à jour sur le site https://www.grosbill-pro.com/cgv',
    ),
  },
};

export const brandSettingsKey = (b: TransacBrand) => `transac_brand_${b}`;

export function mergeBrandSettings(brand: TransacBrand, raw: string | null | undefined): TransacBrandSettings {
  const base = TRANSAC_BRAND_DEFAULTS[brand];
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Partial<TransacBrandSettings>;
    const out = { ...base };
    (Object.keys(base) as (keyof TransacBrandSettings)[]).forEach((k) => {
      if (typeof parsed[k] === 'string' && parsed[k]!.trim()) out[k] = parsed[k]!;
    });
    return out;
  } catch {
    return base;
  }
}

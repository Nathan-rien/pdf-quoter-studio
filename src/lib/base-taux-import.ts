// Import Excel de la base taux : parsing tolérant + calcul du plan de changements.
// Fonctions pures (aucun accès réseau) ; l'écriture en base est faite après confirmation.
import {
  resolvePartner,
  validateBaseTauxDraft,
  type BaseTauxRow,
  type FinancialPartner,
} from '@/lib/partners';

export interface ParsedImportRow {
  line: number; // numéro de ligne dans la feuille (1-indexé)
  partnerName: string;
  montantMin: number;
  montantMax: number;
  dureeMois: number;
  taux: number;
}

const toNumber = (v: unknown): number =>
  parseFloat(String(v ?? '0').replace(/[^\d.,]/g, '').replace(',', '.'));

// Anciennes feuilles Excel : durée exprimée en trimestres.
const QUARTERS_TO_MONTHS: Record<number, number> = { 6: 18, 8: 24, 12: 36, 16: 48, 20: 60 };

/** Parse les lignes brutes d'un onglet « Base Taux » (sheet_to_json, header: 1). */
export function parseBaseTauxSheetRows(sheet: unknown[][]): { rows: ParsedImportRow[]; errors: string[] } {
  const errors: string[] = [];
  let headerIdx = -1;
  for (let i = 0; i < Math.min(10, sheet.length); i++) {
    const row = sheet[i];
    if (!Array.isArray(row)) continue;
    const str = row.map((c) => String(c ?? '').toLowerCase()).join(' ');
    if (str.includes('partenaire') && (str.includes('taux') || str.includes('coef'))) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) {
    throw new Error('En-têtes non trouvés. Colonnes attendues: Partenaire, Montant min, Montant max, Durée, Taux');
  }
  const header = (sheet[headerIdx] as unknown[]).map((c) => String(c ?? '').toLowerCase());
  const idx = {
    partner: header.findIndex((h) => h.includes('partenaire')),
    min: header.findIndex((h) => h.includes('min')),
    max: header.findIndex((h) => h.includes('max')),
    duree: header.findIndex((h) => h.includes('dur') || h.includes('mois')),
    taux: header.findIndex((h) => h.includes('taux') || h.includes('coef')),
  };

  const rows: ParsedImportRow[] = [];
  for (let i = headerIdx + 1; i < sheet.length; i++) {
    const r = sheet[i];
    if (!Array.isArray(r) || r.length < 3) continue;
    const partnerName = String(r[idx.partner] ?? '').trim();
    if (!partnerName) continue;
    const montantMin = toNumber(r[idx.min]);
    const montantMaxRaw = toNumber(r[idx.max]);
    const dureeRaw = toNumber(r[idx.duree]);
    const taux = toNumber(r[idx.taux]);
    if ([montantMin, dureeRaw, taux].some(Number.isNaN)) {
      errors.push(`Ligne ${i + 1}: valeurs numériques invalides`);
      continue;
    }
    rows.push({
      line: i + 1,
      partnerName,
      montantMin,
      montantMax: montantMaxRaw || 500000,
      dureeMois: QUARTERS_TO_MONTHS[dureeRaw] ?? dureeRaw,
      taux,
    });
  }
  return { rows, errors };
}

export interface PartnerImportDiff {
  partnerName: string; // nom canonique si connu, sinon nom du fichier
  partnerId: string | null; // null = partenaire inconnu (à créer)
  isNew: boolean;
  inserts: ParsedImportRow[];
  updates: { existing: BaseTauxRow; row: ParsedImportRow }[];
  deletes: BaseTauxRow[];
  unchanged: number;
}

export interface ImportPlan {
  diffs: PartnerImportDiff[];
  errors: string[]; // lignes invalides ou doublons (ignorées)
  overlaps: string[]; // chevauchements dans l'état final : bloquants
}

const sameKey = (a: { montantMin: number; montantMax: number; dureeMois: number }, b: typeof a) =>
  a.dureeMois === b.dureeMois && a.montantMin === b.montantMin && a.montantMax === b.montantMax;

/**
 * Compare le fichier à la base, partenaire par partenaire.
 * Seuls les partenaires présents dans le fichier sont touchés.
 * `deleteMissing` : supprimer les lignes en base absentes du fichier (pour ces partenaires).
 * `skipNewPartners` : noms de partenaires inconnus que l'utilisateur refuse de créer (ignorés).
 */
export function planBaseTauxImport(
  partners: readonly FinancialPartner[],
  existing: readonly BaseTauxRow[],
  parsed: readonly ParsedImportRow[],
  opts: { deleteMissing?: boolean; skipNewPartners?: ReadonlySet<string> } = {},
): ImportPlan {
  const { deleteMissing = true, skipNewPartners = new Set<string>() } = opts;
  const errors: string[] = [];
  const groups = new Map<string, { partner: FinancialPartner | null; name: string; rows: ParsedImportRow[] }>();

  for (const row of parsed) {
    const partner = resolvePartner(partners, row.partnerName);
    const groupKey = partner ? `id:${partner.id}` : `new:${row.partnerName.trim().toLowerCase()}`;
    if (!partner && skipNewPartners.has(row.partnerName.trim().toLowerCase())) continue;
    const validation = validateBaseTauxDraft({ ...row, partnerId: partner?.id ?? 'new' });
    if (validation.length) {
      errors.push(`Ligne ${row.line} (${row.partnerName}): ${validation.join(', ')}`);
      continue;
    }
    const group = groups.get(groupKey) ?? { partner, name: partner?.name ?? row.partnerName.trim(), rows: [] };
    if (group.rows.some((r) => sameKey(r, row))) {
      errors.push(`Ligne ${row.line} (${row.partnerName}): tranche en doublon dans le fichier, ignorée`);
      continue;
    }
    group.rows.push(row);
    groups.set(groupKey, group);
  }

  const diffs: PartnerImportDiff[] = [];
  const overlaps: string[] = [];

  for (const group of groups.values()) {
    const current = group.partner ? existing.filter((r) => r.partnerId === group.partner!.id) : [];
    const diff: PartnerImportDiff = {
      partnerName: group.name,
      partnerId: group.partner?.id ?? null,
      isNew: !group.partner,
      inserts: [],
      updates: [],
      deletes: [],
      unchanged: 0,
    };
    const matched = new Set<string>();
    for (const row of group.rows) {
      const found = current.find((c) => !matched.has(c.id) && sameKey(c, row));
      if (!found) {
        diff.inserts.push(row);
        continue;
      }
      matched.add(found.id);
      if (Math.abs(found.taux - row.taux) < 1e-9) diff.unchanged++;
      else diff.updates.push({ existing: found, row });
    }
    if (deleteMissing) diff.deletes = current.filter((c) => !matched.has(c.id));
    diffs.push(diff);

    // Chevauchements dans l'état final (lignes actives uniquement, comme en édition manuelle).
    const finalRows = [
      ...group.rows.map((r) => ({ ...r, active: true })),
      ...(deleteMissing ? [] : current.filter((c) => !matched.has(c.id)).map((c) => ({ ...c, active: c.isActive }))),
    ].filter((r) => r.active);
    for (let i = 0; i < finalRows.length; i++) {
      for (let j = i + 1; j < finalRows.length; j++) {
        const a = finalRows[i];
        const b = finalRows[j];
        if (a.dureeMois === b.dureeMois && a.montantMin <= b.montantMax && b.montantMin <= a.montantMax) {
          overlaps.push(
            `${group.name}, ${a.dureeMois} mois : ${a.montantMin}–${a.montantMax} € chevauche ${b.montantMin}–${b.montantMax} €`,
          );
        }
      }
    }
  }

  diffs.sort((a, b) => a.partnerName.localeCompare(b.partnerName));
  return { diffs, errors, overlaps };
}

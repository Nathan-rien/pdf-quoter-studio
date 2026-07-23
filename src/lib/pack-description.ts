import type { ServiceOptionDefinition, ServiceItem } from '@/types/options-admin';
import type { OptionService } from '@/stores/rentalProposalStore';

const serviceItemToLines = (item: ServiceItem | string): string => {
  const text = typeof item === 'string' ? item : item.text;
  const subItems = typeof item === 'string' ? [] : item.subItems || [];
  if (subItems.length > 0) {
    return `${text}\n  - ${subItems.join('\n  - ')}`;
  }
  return text;
};

/**
 * Build the description of a Pack from its composition (packServiceIds).
 * Each included service is listed by its title, optionally followed by its own
 * sub-items as bullet points. Manual `services` lines on the pack itself are
 * appended after (not overwritten).
 */
export function buildPackDescription(
  pack: ServiceOptionDefinition,
  adminOptions: ServiceOptionDefinition[],
): string {
  const includedIds = pack.packServiceIds || [];
  const includedLines: string[] = [];
  for (const id of includedIds) {
    const svc = adminOptions.find((o) => o.id === id);
    if (!svc) continue;
    const subs = (svc.services || []).map(serviceItemToLines);
    if (subs.length > 0) {
      includedLines.push(`${svc.title}\n  - ${subs.join('\n  - ')}`);
    } else {
      includedLines.push(svc.title);
    }
  }
  const manualLines = (pack.services || []).map(serviceItemToLines);
  return [...includedLines, ...manualLines].join('\n');
}

/**
 * Resolve the description to display for a nosOption at render time.
 * If the option was imported from a pack (sourcePackId set) and that pack
 * still exists in the admin catalog, always recompute the description from
 * the current pack composition — so admin-side edits stay visible.
 */
export function resolvePackDescription(
  opt: OptionService,
  adminOptions: ServiceOptionDefinition[],
): string {
  // 1) Description manuelle non vide → priorité
  const manual = (opt.description || '').trim();
  if (manual) return opt.description;

  // 2) Pack : recomposer depuis packServiceIds
  const sourcePackId = (opt as OptionService & { sourcePackId?: string | null }).sourcePackId;
  if (sourcePackId) {
    const pack = adminOptions.find((o) => o.id === sourcePackId && o.kind === 'pack');
    if (pack) return buildPackDescription(pack, adminOptions);
  }

  // 3) Fallback : service admin homonyme → composer depuis ses services
  const name = (opt.name || '').trim().toLowerCase();
  if (name) {
    const svc = adminOptions.find((o) => (o.title || '').trim().toLowerCase() === name);
    if (svc) {
      if (svc.kind === 'pack') return buildPackDescription(svc, adminOptions);
      const lines = (svc.services || []).map(serviceItemToLines);
      if (lines.length > 0) return lines.join('\n');
    }
  }

  return '';
}

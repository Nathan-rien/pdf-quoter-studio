/**
 * Runtime overrides for commercial data fetched from the database
 * (e.g., updated phone numbers in `pre_registered_commercials`).
 *
 * The Zustand store uses the static `getCommercialById` from `@/data/commerciaux`
 * which doesn't know about DB-side edits. This module lets the React layer
 * (via `useCommerciaux`) push the merged data into a module-level registry that
 * the store getter can consult.
 */

import type { Commercial } from '@/data/commerciaux';
import { getCommercialById as getStaticCommercialById } from '@/data/commerciaux';

let runtimeOverrides: Record<string, Partial<Commercial>> = {};

export function setCommercialOverrides(merged: Commercial[]): void {
  const next: Record<string, Partial<Commercial>> = {};
  for (const c of merged) {
    next[c.id] = { telephone: c.telephone };
  }
  runtimeOverrides = next;
}

export function getCommercialByIdRuntime(id: string): Commercial | null {
  const base = getStaticCommercialById(id);
  if (!base) return null;
  const override = runtimeOverrides[id];
  if (!override) return base;
  return { ...base, ...override };
}

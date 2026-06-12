/**
 * Runtime registry for commercial data — supports both:
 *  - overrides on existing static commercials (e.g. updated phone numbers)
 *  - dynamically-added commercials (created via the admin "Gestion des accès" UI
 *    and stored in `pre_registered_commercials`).
 *
 * The Zustand store uses `getCommercialByIdRuntime` so it can find commercials
 * that don't exist in the static `COMMERCIAUX` list.
 */

import type { Commercial } from '@/data/commerciaux';
import { getCommercialById as getStaticCommercialById } from '@/data/commerciaux';

let runtimeRegistry: Record<string, Commercial> = {};

export function setCommercialOverrides(merged: Commercial[]): void {
  const next: Record<string, Commercial> = {};
  for (const c of merged) next[c.id] = c;
  runtimeRegistry = next;
}

export function getCommercialByIdRuntime(id: string): Commercial | null {
  return runtimeRegistry[id] ?? getStaticCommercialById(id);
}



## Problem

The previous fix incorrectly:
1. Removed `nosOptions` from `servicesBlocs` (page 5 pagination)
2. Created a separate `optionsPageNum` resolver that forced options onto page 6, overwriting the static "Offre de services" template page

## Correct Behavior (restore original)

- Page 5 = Services Inclus + Nos Options together (if they fit)
- If too many items, services stay on page 5, options overflow to **auto-generated continuation pages** (inserted between page 5 and page 6)
- Page 6 = Static "Offre de services" (never overwritten)

## Changes

### 1. `RentalProposalPreview.tsx` — Restore `nosOptions` in `servicesBlocs` (lines 252-255)

```typescript
const servicesBlocs: ServiceBloc[] = [
  { type: 'services-location' },
  ...selectedOptions.map(o => ({ type: 'option' as const, data: o })),
  ...(selectedNosOptions.length > 0 ? [{ type: 'nos-options-title' as const }] : []),
  ...selectedNosOptions.map(o => ({ type: 'nos-option' as const, data: o })),
];
```

### 2. `RentalProposalPreview.tsx` — Remove `optionsPageNum` resolver (lines 1263-1277)

Delete the entire `optionsPageNum` IIFE block. It's no longer needed since options are part of the services pagination.

### 3. `RentalProposalPreview.tsx` — Remove options routing in `renderCurrentPage` (lines 1509-1512)

Remove the `if (realPageNum === optionsPageNum)` check so page 6 renders as a normal static/template page.

### 4. `RentalProposalPreview.tsx` — Fix price display in `renderServicesInclusPage`

Keep the `getOptionPriceLabel` helper usage for `nos-option` blocs (already done) to ensure Pro-déploiement prices display correctly.

### 5. `RentalProposalExport.tsx` — Restore `nosOptions` in export `servicesBlocs`

Same restoration: add back `nosOptions` into the services blocs array and remove the `optionsPageNum` resolver that overwrites page 6.


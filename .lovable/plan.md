## Changes to Reprise table (preview + PDF export)

1. **Title**: Rename "Synthèse reprise" → "Votre reprise" in both `RentalProposalPreview.tsx` (`renderRepriseContent`) and `RentalProposalExport.tsx` (`repriseHTML`).

2. **Header row simplification**: Remove A/B/C/D columns from the top `<thead>`. New header: `Description` (colSpan=5) | `Quantités`.
   - Description cell spans columns 1–5 so product description rows naturally extend across the freed space.
   - Product line rows: Description cell uses `colSpan=5`, followed by Quantités cell.
   - Free description rows (custom): same colSpan treatment.

3. **A/B/C/D headers preserved**: They remain in the gray "SYNTHÈSE" sub-header row (already implemented), and Total HT / TVA / Total TTC rows keep their 4 grade cells + Quantités cell.

### Files
- `src/components/rental-proposal/RentalProposalPreview.tsx`
- `src/components/rental-proposal/RentalProposalExport.tsx`

No business logic, calculations, or data structures change.
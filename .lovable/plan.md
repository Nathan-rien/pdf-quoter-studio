

## Problem

The new "Quotation" format from 3D Dental Store uses English labels and a different layout compared to the existing French "Devis" format. Several fields fail to extract: filename not detected, client name missed, date/expiration labels differ, salesperson label differs, and totals use English labels. Additionally, the template "Proposition Commerciale 3D dental" must be auto-selected when a Dental PDF is imported.

## Field Mapping Analysis

| Field | Données tab | New PDF value | Parser status |
|-------|------------|---------------|---------------|
| Source | — | "3D DENTAL STORE" | ✅ Text detection works |
| Filename | — | "Quotation_-_SO77452.pdf" | ❌ Not matched |
| Réf. devis | devis.reference | SO77452 | ✅ Works |
| Date | devis.date | 02/25/2026 (US) | ❌ Label "Quotation Date" missed |
| Validité | devis.validite | 03/27/2026 | ❌ Label "Expiration" missed |
| N° client | devis.numeroClient | 55177 | ❌ Label "Reference : 55177" missed |
| Client nom | clientData.nom | Jérôme Turpin | ❌ Not uppercase/CABINET |
| Client adresse | clientData.adresse | 116 rue des Nouettes | ❌ Falls through |
| Client CP | clientData.codePostal | 85180 | ❌ Falls through |
| Client ville | clientData.ville | CHATEAU D OLONNE | ❌ Falls through |
| Commercial | commercial.nom | Ambre-Lise SAVOÏA | ❌ Label "Salesperson" missed |
| Produit | lignesData | Caméra intra orale... | ✅ Qty pattern works |
| Total HT | totaux.totalHT | 9500.00 € | ❌ Label "Untaxed Amount" missed |
| TVA | totaux.tva | 1900.00 € | ✅ "Taxes" pattern works |
| Total TTC | totaux.totalTTC | 11400.00 € | ✅ "Total" pattern works |
| Template | selectedTemplateId | 3D dental | ❌ No auto-selection |

## Changes

### 1. `src/lib/pdf-import-parser.ts` — `detectSourceFromFilename`

Add `quotation` pattern to dental detection:
```typescript
if (lowerName.includes('dental') || /(?:devis|quotation)[\s_-]+so\d+/i.test(lowerName)) {
  return 'dental';
}
```

### 2. `src/lib/pdf-import-parser.ts` — `parseDentalText` metadata section (~lines 1593-1648)

Add English label fallbacks for all metadata fields:

- **Date**: Add fallback `Quotation\s+Date\s*(\d{2}\/\d{2}\/\d{4})` (keep raw format, the app displays as-is)
- **Expiration**: Add fallback `Expiration\s*(\d{2}\/\d{2}\/\d{4})`
- **Client number**: Add fallback `Reference\s*:\s*(\d+)` (the "Reference : 55177" line)
- **Salesperson**: Add fallback `Salesperson\s+([A-Za-zÀ-ÿ\s\-']+)`

### 3. `src/lib/pdf-import-parser.ts` — `parseDentalText` client section (~lines 1615-1648)

Add fallback for non-CABINET client names. After the existing loop, if `client.nom` is still null, scan for the client block that appears between the 3D DENTAL STORE address and the "Customer" / "Reference" line. The pattern: look for a name line (mixed case, not a known header) followed by a street address and postal code.

### 4. `src/lib/pdf-import-parser.ts` — `parseDentalText` totals section (~lines 1650-1681)

Add English label fallback for Total HT:
```typescript
// Fallback: "Untaxed Amount 9 500,00 €"
const untaxedMatch = text.match(/Untaxed\s+Amount[\s\n]*([\d\s]+[,.][\d]{2})\s*€/i);
```

### 5. `src/components/rental-proposal/RentalWorkflow.tsx` — Auto-select template on dental import

Currently, template auto-selection is tied to the commercial's entity (Cybertek/Grosbill). For dental PDFs, the source is `dental` but the user may not have a commercial entity mapped. Add logic to auto-select the dental template based on `pdfImportStatus.source === 'dental'`:

- Add a `SOURCE_TEMPLATE_MAP` for PDF-source-based template selection
- In the existing `useEffect`, also check if `pdfImportStatus.source` has a mapped template when no entity-based template applies

```typescript
const SOURCE_TEMPLATE_MAP: Record<string, string> = {
  'dental': '1bc823c7-1771-4939-8179-177193917944',
};
```

### 6. `src/components/rental-proposal/RentalWorkflow.tsx` — Skip template step for dental source

Extend `skipTemplateStep` to also be true when source is dental and a template is auto-selected.

## Technical details

- The `parseDentalProductsWithMultilineDescriptions` function uses `(\d+[,.]?\d*)\s*Unit[eé]\(?s?\)?` which matches `1.000 Unit(s)` — quantity extraction will yield 1 (after `Math.round`). Product extraction is confirmed working.
- The date `02/25/2026` is stored as-is (string). The app only displays it, no date arithmetic is needed.
- The `Amount Incl. Tax` column value `11400.00 €` on the product line is the TTC per item — the multi-line parser uses second-to-last amount as HT which would correctly pick `9500.00` (unit price) if only one product. Need to verify the amounts array: `[9500.00, 11400.00]` → `amounts[-2] = 9500.00` ✅.




## Problem

The dental PDF multi-line parser (`parseDentalProductsWithMultilineDescriptions`) has three issues when extracting product designations:

1. **Backwards scan picks up column headers**: Fragments like "HT", "TTC", "Montant" from the table header row are included in the product name (e.g., `[i900M 3YW fidelite] HT TTC MEDIT i-Series...`)

2. **Forward scan is too greedy**: All notes, warranty text, support info, and even the seller address block from subsequent pages are appended to the designation (e.g., "Un ordinateur adapté doit être utilisé...", "Service support disponible...", "75 route de Lyons la Forêt...")

3. **Section titles and categories are duplicated**: The backwards scan picks up section headers like "Scanner Intra Oral" or "Assistance Premium" that also appear in the product description, causing duplication

## Fix — `src/lib/pdf-import-parser.ts`

### 1. Backwards scan (lines 1542-1553) — Add filters for column header noise

Add a regex to skip lines that are column header fragments:
```typescript
// Skip column header fragments
if (/^(Montant|HT|TTC|Rem\.?%?|Prix\s*unitaire|Excl|Incl|Tax)/i.test(prevLine)) break;
```

Also deduplicate: if the backwards-scanned title is already contained in `descriptionLine`, skip it.

### 2. Forward scan (lines 1558-1580) — Add stop patterns for notes/boilerplate

Add a "noise stop" regex to detect lines that are clearly boilerplate notes rather than product description:
```typescript
const noisePatterns = /^(Un ordinateur|Mises à jour|Merci de|Service support|MERCI DE|support@|•\s*(Le|La)\s)/i;
```

Also add stop for:
- Seller address: `/^(3D\s*DENTAL\s*STORE|75\s*route|76000|France$)/i`
- Lines starting with `•` bullet points (service plan details)
- Lines matching address patterns (number + street name)

### 3. Deduplication of section titles

After building `descriptionParts`, check if the first entry (from backwards scan) is a substring of the second entry (the main description line) and remove the duplicate.

### Summary

Single file change (`src/lib/pdf-import-parser.ts`), approximately 15-20 lines of edits in the `parseDentalProductsWithMultilineDescriptions` function. The result: only the core product name and reference are kept as designation, without column headers, notes, addresses, or duplicated section titles.


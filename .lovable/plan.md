

## Problem

The forward scan in `parseDentalProductsWithMultilineDescriptions` is still too greedy. After capturing the core product description, it continues appending:
- The seller address ("75 route de Lyons la Forêt / 76000 ROUEN / France") when it appears mid-text (not at line start matching the hardcoded pattern)
- Warranty/usage notes ("Un ordinateur adapté…", "Mises à jour…")  
- Detailed spec lists starting with `-` ("- Ordinateur portable comprenant : …")
- Service condition paragraphs ("MERCI DE CONSERVER L'EMBALLAGE…")

The backwards scan deduplication also still lets section titles through in some cases.

## Fix — `src/lib/pdf-import-parser.ts`, function `parseDentalProductsWithMultilineDescriptions`

### 1. Limit forward scan aggressively

Add these stop conditions to the forward scan (lines 1567-1595):

```typescript
// Stop on list items (spec details)
if (/^-\s/.test(nextLine)) break;

// Stop on address-like patterns (number + street keyword)
if (/^\d+\s+(rue|route|avenue|boulevard|place|chemin|cours|impasse|allée)/i.test(nextLine)) break;

// Stop on postal code lines
if (/^\d{5}\s+[A-Z]/.test(nextLine)) break;

// Stop on long sentence-like lines (notes, not product names) — lines with verbs/articles suggesting prose
if (/^(Le |La |Les |L'|Un |Une |Des |Ce |Cette |Cet |Équipement|Garantie|Validité)/i.test(nextLine)) break;
```

### 2. Add a maximum forward continuation limit

Cap the forward scan at **4 lines** maximum after the product line. Product descriptions rarely span more than that; anything beyond is notes/boilerplate.

```typescript
let continuationCount = 0;
// inside the for loop:
continuationCount++;
if (continuationCount > 4) break;
```

### 3. Clean up the designation after assembly

After joining `descriptionParts`, strip any trailing address or boilerplate that slipped through:

```typescript
// Remove trailing address/boilerplate from assembled description
fullDescription = fullDescription
  .replace(/\n?\d+\s+(rue|route|avenue|boulevard).*$/is, '')
  .replace(/\n?\d{5}\s+[A-Z].*$/is, '')
  .replace(/\n?France\s*$/i, '')
  .trim();
```

### Summary

Single file change, ~15 lines of additions in the forward scan section. The result: product designations contain only the reference + core product name (e.g., `[OP] Station de travail 3D portable`), without addresses, spec lists, or warranty notes.


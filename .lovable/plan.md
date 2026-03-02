

## Problem

Two issues with the 3D Dental "Quotation" English format:

1. **Product description is incomplete**: The title line "Caméra intra orale medit I700W garantie 3 ans" appears on a line BEFORE the product quantity line `[i700w 3YW]...1.000 Unit(s)...`. The current parser only captures text on the same line (before the qty marker) and lines AFTER. It never looks backwards, so the title is lost.

2. **Client extraction fragile**: The fallback client block works for `Jérôme Turpin` → `116 rue des Nouettes` → `85180 CHATEAU D OLONNE`, but:
   - The English `Customer Reference : 55177` pattern is not explicitly matched (only `Reference\s*:\s*(\d+)` catches it, but `Customer Reference` should also be added to the skip list in the fallback to avoid false matches)
   - `Subtotal` (English) is missing from stop markers, so product description accumulation may bleed into section boundaries

3. **Stop markers missing English variants**: `Subtotal`, `Untaxed Amount`, `Amount Excl.`, `Amount Incl.` are not in the stop markers for multi-line description accumulation.

## Changes

### 1. `src/lib/pdf-import-parser.ts` — `parseDentalProductsWithMultilineDescriptions` (~line 1476)

Add English stop markers to the `stopMarkers` regex:

```typescript
const stopMarkers = /^(Sous-total|Subtotal|Informatique|Livraison|Formation|Compte\s+bancaire|Page\s+\d+|Montant\s+hors\s+taxes|Untaxed\s+Amount|Taxes|Total\s+[\d])/i;
```

### 2. `src/lib/pdf-import-parser.ts` — `parseDentalProductsWithMultilineDescriptions` (~lines 1507-1520)

After extracting `descriptionLine` from the product line, scan BACKWARDS to collect preceding title/header lines. Walk from `i-1` upwards, collecting lines that are not:
- empty / too short
- stop markers / headers (`Description`, `Quantity`, `Amount`, etc.)
- another product line (matching `productLinePattern`)
- known skip patterns (3D DENTAL, amounts-only, dates, metadata)

Prepend collected lines (in order) to `descriptionParts` before the product line text:

```typescript
// Scan backwards for title lines preceding this product
const titleLines: string[] = [];
for (let k = i - 1; k >= 0; k--) {
  const prevLine = lines[k];
  if (!prevLine || prevLine.length < 3) break;
  if (stopMarkers.test(prevLine)) break;
  if (productLinePattern.test(prevLine)) break;
  if (/^(Description|Quantit|Prix|Amount|Quantity|Unit\s*Price|Taxes|3D\s*DENTAL|Sous-total|Subtotal)/i.test(prevLine)) break;
  if (euroAmountPattern.test(prevLine) && prevLine.match(euroAmountPattern)!.length > 1) break;
  titleLines.unshift(prevLine);
}

const descriptionParts = [...titleLines, descriptionLine];
```

### 3. `src/lib/pdf-import-parser.ts` — `parseDentalText` client fallback (~line 1626)

Add `Subtotal|Customer\s+Reference|Your\s+Reference|Quantity|Unit\s+Price|Amount\s+Excl|Amount\s+Incl` to the skip regex on line 1626 and line 1660 so these English headers don't interfere with client/name detection.

### 4. `src/lib/pdf-import-parser.ts` — `parseDentalText` client number (~line 1610)

Add explicit `Customer\s+Reference` pattern:

```typescript
const clientNumMatch = text.match(/R[eé]f[eé]rence\s+Client\s*:?\s*(\d+)/i)
    || text.match(/Customer\s+Reference\s*:?\s*(\d+)/i)
    || text.match(/Reference\s*:\s*(\d+)/i);
```

## Summary

These changes ensure:
- The full multi-line product description (title + ref line + trailing notes) is captured into the Invest tab designation
- The English client address block is reliably extracted
- English section boundaries (`Subtotal`, `Untaxed Amount`) properly delimit product descriptions


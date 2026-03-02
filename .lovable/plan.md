

## Problem

The dental PDF parser's fallback client extraction captures the **seller's address block** (3D DENTAL STORE, 75 route de Lyons la Forêt, 76000 ROUEN) as the client instead of the actual client (Jérôme Turpin, 116 rue des Nouettes, 85180 CHATEAU D OLONNE).

This happens because the fallback loop (line 1692) skips "3D DENTAL STORE" via the regex but does NOT skip the subsequent seller address lines. "75 route de Lyons la Forêt" is treated as a candidate name since the next line "76000 ROUEN" matches the address pattern `^\d+\s+`.

## Fix

### `src/lib/pdf-import-parser.ts` — Fallback client extraction (~lines 1692-1718)

Add logic to skip the seller's address block. When iterating lines in the fallback:

1. Track a `pastSellerBlock` state. When we encounter a "3D DENTAL STORE" line, skip forward past the seller address block (skip until we pass a "France" line or exhaust ~4 lines).
2. Only start looking for client candidates after the seller block is passed.

```typescript
// Fallback: skip seller address block
if (!result.client!.nom) {
  let pastSellerBlock = false;
  let skipUntilFrance = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect seller header — skip its address block
    if (/3D\s*DENTAL\s*STORE/i.test(line)) {
      skipUntilFrance = true;
      continue;
    }
    if (skipUntilFrance) {
      if (/^France$/i.test(line)) {
        skipUntilFrance = false;
        pastSellerBlock = true;
      }
      continue;  // skip seller address lines
    }
    
    // Skip known headers/metadata (existing regex)
    if (/Devis|Date|Vendeur|Salesperson|Customer\s+Reference|...|Quotation/i.test(line)) continue;
    
    // ... rest of candidate matching logic unchanged
  }
}
```

This ensures the parser jumps past "75 route de Lyons la Forêt / 76000 ROUEN / France" and correctly lands on "Jérôme Turpin" as the first client candidate, with "116 rue des Nouettes" as the address and "85180 CHATEAU D OLONNE" as postal+city.

No other files need changes — the issue is purely in the dental text parser's client fallback logic.


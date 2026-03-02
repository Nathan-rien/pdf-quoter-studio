

## Problem

The `isDentalNoiseLine` function and the forward scan cap (4 lines) are too aggressive. They remove useful product content:

- Lines starting with "Un ", "Le ", "La ", "Garantie" → **should be kept** (product specs/notes)
- Lines starting with `- ` (bullet specs) → **should be kept**
- Forward scan capped at 4 lines → **too short** for multi-paragraph product descriptions

**Expected**: Full product description blocks (specs, support details, guarantees) minus only addresses, SIRET/IBAN, seller email, legal mentions.

## Fix — `src/lib/pdf-import-parser.ts`

### 1. Slim down `isDentalNoiseLine` (lines 1502-1521)

Remove these overly aggressive patterns that kill useful content:
```
// REMOVE: these filter real product descriptions
/^(Le |La |Les |L'|Un |Une |Des |Ce |Cette |Cet |Équipement|Garantie|Validité)/i
/^[-•]\s/
```

Keep only true administrative noise:
- Address patterns (street, postal code, "France")
- Legal/banking (SIRET, IBAN, RCS, Capital, TVA)
- Seller name ("3D DENTAL STORE")
- Column headers (HT, TTC, Montant, Rem%)
- Support email line (`support@3ddentalstore.fr`)
- Page markers

### 2. Increase forward scan limit (line 1640)

Change `continuationCount > 4` to `continuationCount > 30` to allow full multi-paragraph product descriptions. The stop markers (next product line, "Sous-total", section headers) will still correctly terminate the scan.

### 3. Remove redundant boilerplate stop conditions (lines 1650-1651)

Remove the explicit `if (/^(Un ordinateur|Mises à jour|Merci de|...)/)` stop — these are valid product description lines that should be kept.

### 4. Keep the noise stop on seller email

Add `support@3ddentalstore.fr` to `isDentalNoiseLine` (already there) and keep forwarding stopping only on true section/product boundaries.

### Result

Designations will contain the full product description block (specs, guarantees, support details) without addresses, seller info, or legal mentions. Example for `[OP]`:

> `[OP] Station de travail 3D portable - Ordinateur portable comprenant : écran 16 pouces ; carte graphique Nvidia RTX 5060 (8Go) ; processeur Ryzen 7 AI ; disque dur 1To ; RAM 32GB ; Wifi ; Souris - Garantie constructeur 2 ans - Ordinateur portable neuf...`




## Problem

The client data model currently has a single `nom` field ("Nom / Raison sociale"). The user wants two separate fields: **Prénom** (first name) and **Nom** (last name), both populated from PDF import.

From the screenshot, the current `nom` field contains an address ("75 route de Lyons la Forêt") instead of the client name — confirming the extraction is wrong and splitting into prénom/nom will also help with validation.

## Changes

### 1. `src/lib/pdf-import-parser.ts` — Add `prenom` to `PDFParseResult.client`

Add `prenom: string | null` to the client interface (line 15) and all initialization sites (lines 127, 1142, 1588, 1835).

### 2. `src/lib/pdf-import-parser.ts` — Split name in all parsers

- **Cybertek** (`parseCybertekText`): The client name line is already extracted as `nom`. Split on first space: first word → `prenom`, rest → `nom`.
- **Grosbill** (`parseGrosbillText`): Same split logic on the extracted name.
- **Dental** (`parseDentalText`): The name "Jérôme Turpin" is extracted — split into `prenom: "Jérôme"`, `nom: "Turpin"`.
- **Unknown** fallback: Same split logic.

Split helper function:
```typescript
function splitName(fullName: string): { prenom: string; nom: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { prenom: '', nom: fullName.trim() };
  return { prenom: parts[0], nom: parts.slice(1).join(' ') };
}
```

For "raison sociale" (company names like "CABINET DENTAIRE..."), put everything in `nom` and leave `prenom` empty.

### 3. `src/stores/rentalProposalStore.ts` — Add `prenom` to `ClientData`

- Add `prenom: string` to the `ClientData` interface (line 22)
- Add `prenom: ''` to `initialClientData` (line 215)
- Map `result.client.prenom` in `importFromPDF` (line 306)

### 4. `src/components/rental-proposal/RentalDataEditor.tsx` — Add Prénom field

Replace the single "Nom / Raison sociale" field with two fields side by side:
- **Prénom** (left)
- **Nom** (right)

Keep Email on its own row or alongside.

### 5. `src/components/rental-proposal/RentalProposalPreview.tsx` — Display prénom + nom

Update the client name display (lines 776, 827) to show `${clientData.prenom} ${clientData.nom}`.

### 6. `src/components/rental-proposal/RentalProposalExport.tsx` — Display prénom + nom

Update the export client name display (lines 329, 761) and filename generation (line 87) to use `${clientData.prenom} ${clientData.nom}`.

### 7. Persistence migration

In the `merge` function of the persist middleware (~line 816), ensure `prenom` defaults to `''` if missing from persisted state.

## Technical details

- The `splitName` helper detects company names (starting with "CABINET", "SAS", "SARL", etc. or all-uppercase multi-word) and keeps them entirely in `nom` with empty `prenom`.
- The `proposalName` generation uses the full name `${prenom} ${nom}`.
- All existing references to `clientData.nom` that display the client name need to be updated to `${clientData.prenom} ${clientData.nom}`.trim().


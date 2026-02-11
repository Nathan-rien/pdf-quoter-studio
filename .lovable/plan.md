

## Retirer le point final de "Services location."

### Modifications

**2 fichiers a modifier :**

1. **`src/components/rental-proposal/RentalProposalPreview.tsx`** (ligne 837)
   - Changer `Services location.` en `Services location`

2. **`src/components/rental-proposal/RentalProposalExport.tsx`** (ligne 402)
   - Changer `Services location.` en `Services location` (version export PDF)

### Detail
Modification simple : retirer le caractere `.` a la fin du texte "Services location." dans les deux endroits ou il apparait (apercu et export).


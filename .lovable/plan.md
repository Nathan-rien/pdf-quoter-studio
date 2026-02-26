

## Pagination intelligente : "Nos options" sur nouvelle page si débordement

### Problème

Actuellement, le chunking des blocs services/options est purement séquentiel : les 8 premiers blocs vont sur la page 1, le reste sur les pages suivantes. Si les options sont coupées en milieu de section, une partie apparaît en bas de la page services et le reste sur la page suivante.

### Règle souhaitée

- Si **tous** les blocs (services + options) tiennent sur une seule page (≤ SERVICES_ITEMS_PAGE1) → tout sur une page.
- Sinon → page 1 = uniquement les services inclus (services-location + options "inclus"), page 2+ = "Nos options" avec pagination standard (SERVICES_ITEMS_CONTINUATION).

### Modifications

| Fichier | Modification |
|---|---|
| `RentalProposalPreview.tsx` (lignes 258-267) | Remplacer le chunking séquentiel par un chunking intelligent : séparer les blocs "services" (types `services-location`, `option`) des blocs "options" (types `nos-options-title`, `nos-option`). Si tout tient → 1 chunk. Sinon → chunk 1 = services seuls, chunks suivants = options avec pagination SERVICES_ITEMS_CONTINUATION. |
| `RentalProposalExport.tsx` (lignes 612-621) | Même logique de chunking intelligent pour l'export PDF. |

### Logique de chunking (identique dans les deux fichiers)

```text
serviceOnlyBlocs = blocs de type services-location + option
optionBlocs      = blocs de type nos-options-title + nos-option

if (total <= SERVICES_ITEMS_PAGE1) → [allBlocs]
else →
  chunk[0] = serviceOnlyBlocs
  chunks[1..n] = optionBlocs paginés par SERVICES_ITEMS_CONTINUATION
```


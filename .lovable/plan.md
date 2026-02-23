

## Decaler le logo client de 1% vers la gauche

Modification simple : soustraire 1 au pourcentage calcule pour `logoLeftPct` dans les deux fichiers.

### Fichiers modifies

| Fichier | Ligne | Modification |
|---|---|---|
| `RentalProposalPreview.tsx` | 611 | `logoLeftPct = ... - 1` |
| `RentalProposalExport.tsx` | 282 | `logoLeftPct = ... - 1` |

### Detail

```text
// Avant (ligne 611 / 282)
const logoLeftPct = dateCenterXPct !== null ? Math.max(dateCenterXPct, minLeftPct) : minLeftPct;

// Apres
const logoLeftPct = (dateCenterXPct !== null ? Math.max(dateCenterXPct, minLeftPct) : minLeftPct) - 1;
```

Cela decale le logo client de 1% vers la gauche par rapport a sa position actuelle, tout en gardant la logique de centrage sous la date et la contrainte de rester a droite du logo entite.

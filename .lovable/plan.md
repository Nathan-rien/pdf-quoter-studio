

## Positionner le logo client sous la date, a droite du logo entite

### Probleme actuel

Le logo client est aligne verticalement **au meme niveau** que la date (`dateElement.position.y`), alors que l'utilisateur veut qu'il soit **en dessous** de la date. La position horizontale (a droite du logo entite) est correcte.

### Solution

Utiliser `dateElement.position.y + dateElement.size.height` (le bas de la date) au lieu de `dateElement.position.y` (le haut de la date), avec un petit offset pour l'espacement.

### Modifications

**Fichier : `src/components/rental-proposal/RentalProposalPreview.tsx`** (ligne 598-602)

Remplacer le calcul de `logoTopPct` :
```typescript
// Avant
const logoTopPct = dateElement 
  ? (dateElement.position.y / CANVAS_SCALE.height) * 100
  : ...

// Apres
const logoTopPct = dateElement 
  ? ((dateElement.position.y + dateElement.size.height) / CANVAS_SCALE.height) * 100 + 0.5
  : ...
```

**Fichier : `src/components/rental-proposal/RentalProposalExport.tsx`** (ligne 271-275)

Meme modification pour l'export PDF.

### Resume

| Fichier | Modification |
|---|---|
| `RentalProposalPreview.tsx` | Logo client positionne sous la date (bas de l'element date + offset) |
| `RentalProposalExport.tsx` | Meme logique pour l'export PDF |


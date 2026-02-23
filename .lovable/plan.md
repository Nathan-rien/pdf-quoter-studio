

## Repositionner le logo client sous la date, aligne avec le logo entite

### Probleme actuel

Le logo client est positionne **a droite** du logo entite (Grosbill) en calculant `left = entityLogo.x + entityLogo.width`. L'utilisateur souhaite qu'il soit place **en dessous** du logo entite, aligne horizontalement (meme position X).

### Solution

Changer le calcul de positionnement pour :
- **X (left)** : utiliser la meme position X que le logo entite (au lieu de x + width)
- **Y (top)** : placer le logo client juste en dessous du logo entite (y + height + petit espacement)

### Modifications

**Fichier : `src/components/rental-proposal/RentalProposalPreview.tsx`** (lignes 590-592)

Remplacer :
```typescript
const logoTopPct = entityLogo ? (entityLogo.position.y / CANVAS_SCALE.height) * 100 : 2;
const rawLeftPct = entityLogo ? ((entityLogo.position.x + entityLogo.size.width) / CANVAS_SCALE.width) * 100 + 1.5 : 70;
const logoLeftPct = Math.min(rawLeftPct, 82);
```

Par :
```typescript
// Positionner le logo client SOUS le logo entite, meme alignement horizontal
const logoTopPct = entityLogo 
  ? ((entityLogo.position.y + entityLogo.size.height) / CANVAS_SCALE.height) * 100 + 0.5
  : 6;
const logoLeftPct = entityLogo 
  ? (entityLogo.position.x / CANVAS_SCALE.width) * 100 
  : 2;
```

**Fichier : `src/components/rental-proposal/RentalProposalExport.tsx`** (lignes 263-265)

Meme changement de calcul pour l'export PDF.

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Logo client positionne sous le logo entite (meme X, Y + height) |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Meme logique dans l'export PDF |

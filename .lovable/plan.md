

## Enregistrer la position par defaut du logo client

### Ce qui change
Actuellement, le logo client est positionne automatiquement **sous la date**. D'apres votre positionnement manuel (capture d'ecran), vous souhaitez que le logo client soit place **a la meme hauteur que le logo entite**, juste a sa droite.

### Modifications

**1. `src/components/rental-proposal/RentalProposalPreview.tsx`**
Changer le calcul automatique de `autoTopPct` pour aligner le logo client verticalement avec le **centre** du logo entite (au lieu de le placer sous la date) :
- `autoTopPct` : calcule a partir de la position Y du logo entite (centre vertical), au lieu de la position sous la date
- `autoLeftPct` : garde la logique actuelle (juste a droite du logo entite + 2%)
- Supprime le `translateX(-50%)` car le logo n'est plus centre sous la date

**2. `src/components/rental-proposal/RentalProposalExport.tsx`**
Appliquer exactement le meme changement au calcul de position pour l'export PDF.

### Detail technique

```text
// AVANT (sous la date)
autoTopPct = ((dateElement.y + dateElement.height) / canvasHeight) * 100 + 0.5

// APRES (aligne avec le logo entite)
autoTopPct = entityLogo 
  ? ((entityLogo.y + entityLogo.height / 2) / canvasHeight) * 100 - 1.5
  : dateElement 
    ? ((dateElement.y + dateElement.height) / canvasHeight) * 100 + 0.5
    : 6

autoLeftPct = minLeftPct  // directement a droite du logo entite, sans centrage sous la date
```

Le positionnement manuel (drag/resize) reste disponible pour des ajustements fins, mais la position par defaut sera desormais celle que vous avez definie.

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `RentalProposalPreview.tsx` | Nouveau calcul par defaut de la position du logo client |
| `RentalProposalExport.tsx` | Meme calcul par defaut pour l'export PDF |


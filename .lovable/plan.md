

## Centrer le logo client sous la date

### Modification unique
Fichier : `RentalProposalPreview.tsx`, lignes 618-631

Deux changements dans `getLogoPositionData` :

1. **Position verticale (`autoTopPct`)** : placer le logo sous la date au lieu de le centrer verticalement par rapport au logo entite
2. **Position horizontale (`autoLeftPct`)** : centrer sur le milieu horizontal de la date au lieu de le placer a droite du logo entite
3. **`useTranslate: true`** : reactiver `translateX(-50%)` pour que le `left` represente le centre du logo

### Detail technique

```text
// AVANT (ligne 618-623)
const autoTopPct = entityLogo 
  ? entityCenterPct - (clientLogoHeightForCenter / CANVAS_SCALE.height * 100) / 2
  : dateElement 
    ? ((dateElement.position.y + dateElement.size.height) / CANVAS_SCALE.height) * 100 + 0.5
    : 6;
const autoLeftPct = minLeftPct;

// APRES
const autoTopPct = dateElement
  ? ((dateElement.position.y + dateElement.size.height) / CANVAS_SCALE.height) * 100 + 1
  : 6;
const autoLeftPct = dateElement
  ? ((dateElement.position.x + dateElement.size.width / 2) / CANVAS_SCALE.width) * 100
  : 50;
```

Et ligne 631 : `useTranslate: true` au lieu de `false`.

Rien d'autre n'est modifie : la taille fixe (50x50), la largeur par defaut, les overrides manuels restent identiques.


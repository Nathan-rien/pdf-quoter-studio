

## Aligner le logo client a cote du logo entite (comme Grosbill Pro)

### Probleme

Le positionnement actuel place le logo client **sous la date** (`dateElement.y + height + 2%`), centre horizontalement. Sur Grosbill Pro, cela donne un bon resultat par coincidence (la date et le logo entite sont proches verticalement). Sur Cybertek Pro, la date est plus haute, donc le logo client se retrouve decale vers le bas, sous le logo entite au lieu d'etre a cote.

### Solution

Changer la logique pour positionner le logo client **a droite du logo entite, verticalement centre avec lui** -- ce qui correspond au rendu Grosbill Pro visible sur la capture de reference.

| Axe | Ancien calcul | Nouveau calcul |
|---|---|---|
| **Top (Y)** | Sous la date + 2% | Centre vertical du logo entite - moitie de la hauteur du logo client |
| **Left (X)** | Centre de la date | Bord droit du logo entite + 2% de marge |

### Fichiers modifies

**`src/components/rental-proposal/RentalProposalPreview.tsx`** (lignes ~618-627)

Remplacer le calcul de `autoTopPct` et `autoLeftPct` :

```
// autoTopPct : centrer verticalement avec le logo entite
const clientLogoHalfHeightPct = (CLIENT_LOGO_SIZE.height / 2 / CANVAS_SCALE.height) * 100;
const autoTopPct = entityLogo
  ? entityCenterPct - clientLogoHalfHeightPct
  : dateElement
    ? ((dateElement.position.y + dateElement.size.height) / CANVAS_SCALE.height) * 100 + 2
    : 6;
// autoLeftPct : a droite du logo entite
const autoLeftPct = entityLogo
  ? ((entityLogo.position.x + entityLogo.size.width) / CANVAS_SCALE.width) * 100 + 2
  : 50;
```

Desactiver `translateX(-50%)` quand le logo est positionne a droite du logo entite (le bord gauche = position souhaitee) :

```
useTranslate: !entityLogo,
```

**`src/components/rental-proposal/RentalProposalExport.tsx`** (lignes ~279-291)

Meme logique appliquee a l'identique, avec un `transform: translateX(-50%)` conditionnel (absent si positionne a droite du logo entite).

### Ce qui ne change pas
- Taille du logo client (50x50 unites canvas)
- Mode drag-and-drop et `clientLogoOverride`
- Rendu des autres elements


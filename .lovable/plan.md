

## Recentrer le logo client sous la date

### Probleme
Le logo client est actuellement positionne a droite du logo entite. Il doit etre centre horizontalement sous la date ("23 fevrier 2026"), comme c'etait le cas avant.

### Solution
Modifier le calcul de `autoLeftPct` dans `getLogoPositionData` pour utiliser le centre horizontal de l'element date au lieu de la position a droite du logo entite. Reactiver `translateX(-50%)` pour centrer le logo sur ce point.

### Fichier modifie

| Fichier | Modification |
|---|---|
| `RentalProposalPreview.tsx` | Modifier `getLogoPositionData` : calculer `autoLeftPct` a partir du centre de l'element date, et remettre `useTranslate: true` |

### Detail technique

**Avant :**
```text
const autoLeftPct = minLeftPct;  // = droite du logo entite + 2%
return { ..., useTranslate: false };
```

**Apres :**
```text
const autoLeftPct = dateElement
  ? ((dateElement.position.x + dateElement.size.width / 2) / CANVAS_SCALE.width) * 100
  : 50;  // fallback centre de la page
return { ..., useTranslate: true };  // translateX(-50%) pour centrer
```

Le centrage vertical par rapport au logo entite est conserve. Seul le positionnement horizontal change pour revenir sous la date.




## Uniformiser le positionnement du logo client (style Grosbill Pro)

### Probleme
Le dernier changement a centre le logo client sous la date (`translateX(-50%)`). Sur le template Grosbill Pro ca fonctionne visuellement, mais sur Cybertek Pro le logo se retrouve a un endroit different et trop gros. Le rendu doit etre identique sur les deux templates : logo client place a droite du logo entite, aligne verticalement avec lui.

### Solution
Revenir au positionnement "a droite du logo entite" (`autoLeftPct = minLeftPct`) et desactiver `translateX(-50%)` (`useTranslate: false`), exactement comme avant le changement de centrage.

### Fichier modifie

| Fichier | Modification |
|---|---|
| `RentalProposalPreview.tsx` | Remettre `autoLeftPct = minLeftPct` et `useTranslate: false` dans `getLogoPositionData` |

### Detail technique

Lignes 623-633 de `RentalProposalPreview.tsx` :

```text
// AVANT (actuel, casse Cybertek Pro)
const autoLeftPct = dateElement
  ? ((dateElement.position.x + dateElement.size.width / 2) / CANVAS_SCALE.width) * 100
  : 50;
return { ..., useTranslate: true };

// APRES (revient au style Grosbill Pro)
const autoLeftPct = minLeftPct;
return { ..., useTranslate: false };
```

Cela positionne le logo client juste a droite du logo entite (+ 2% de marge) et le centre verticalement par rapport a lui, quel que soit le template utilise.


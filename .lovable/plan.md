

## Corriger la visibilite du logo client sur la page 1

### Cause racine

Le calcul de `logoLeftPct` peut depasser 100% selon la position et la taille du logo entite dans le template. Comme le conteneur de la page a `overflow-hidden`, le logo client est rendu en dehors de la zone visible.

Exemple : si le logo entite est a `x=484` avec `width=156`, le calcul donne `(484+156)/650*100 + 2 = 100.5%` -- le logo est hors champ.

### Correction

**Fichier : `src/components/rental-proposal/RentalProposalPreview.tsx`**

Changer la logique de positionnement pour placer le logo client **a droite** du logo entite avec un clamp pour rester dans les limites visibles :
- Calculer `logoLeftPct` comme avant mais avec `Math.min(..., 85)` pour garantir la visibilite
- Aligner verticalement au centre du logo entite (pas juste au top) en utilisant la hauteur du logo entite
- Si le logo deborde a droite, le placer en dessous du logo entite plutot qu'a cote

**Fichier : `src/components/rental-proposal/RentalProposalExport.tsx`**

Appliquer le meme clamp dans le HTML genere pour le PDF.

### Detail technique

```
// Preview
const entityLogo = page1Elements.find(el => el.type === 'image');
const logoTopPct = entityLogo 
  ? (entityLogo.position.y / CANVAS_SCALE.height) * 100 
  : 2;
const rawLeftPct = entityLogo 
  ? ((entityLogo.position.x + entityLogo.size.width) / CANVAS_SCALE.width) * 100 + 1.5 
  : 70;
const logoLeftPct = Math.min(rawLeftPct, 82);
```

Le meme clamp est applique dans l'export PDF.

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Clamp du positionnement horizontal du logo client pour rester visible |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Meme clamp dans le HTML genere |


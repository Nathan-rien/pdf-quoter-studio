

## Positionner le logo client a cote du logo entite superieur (sous la date)

### Probleme

Il y a deux logos avec `logoId` sur la page 1 du template : un en haut a gauche (le logo principal, sous la date) et un en bas a droite (le footer). Le `find` actuel retourne le premier dans l'ordre du tableau, qui est probablement le logo du footer. Le client logo se retrouve donc positionne pres du bas de la page, hors de la zone attendue.

### Solution

Selectionner specifiquement le logo **le plus haut** sur la page (celui avec la plus petite valeur `y`), puis placer le logo client a sa droite, au meme niveau vertical.

### Modifications

**Fichier : `src/components/rental-proposal/RentalProposalPreview.tsx`** (lignes 586-589)

Remplacer la selection par `find` par un filtrage puis tri par position Y :

```typescript
// Trouver TOUS les logos entite sur la page 1, puis prendre celui le plus haut (plus petit Y)
const entityLogos = page1Elements.filter(el => 
  el.type === 'image' && (el.content as ImageContent)?.logoId
);
const entityLogo = entityLogos.length > 0 
  ? entityLogos.reduce((top, el) => el.position.y < top.position.y ? el : top)
  : null;
```

Le reste du calcul (logoTopPct, logoLeftPct avec clamp) reste identique.

**Fichier : `src/components/rental-proposal/RentalProposalExport.tsx`** (lignes 259-262)

Meme logique : filtrer puis selectionner le logo avec le Y minimum.

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Selectionner le logo entite le plus haut (min Y) au lieu du premier trouve |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Meme logique dans l'export PDF |

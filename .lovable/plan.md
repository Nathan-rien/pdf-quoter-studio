

## Aligner le logo client avec le logo entite et la date

### Probleme actuel

Le logo client est positionne a `left: 70%` (fixe), ce qui le place trop a droite, completement deconnecte du logo entite. L'utilisateur souhaite :
- **Alignement horizontal** (meme X) avec le logo entite le plus haut (ex: Grosbill)
- **Alignement vertical** (meme Y) avec la date du template ("23 fevrier 2026")

### Solution

Detecter la position de la date sur le template (element texte contenant un pattern de date ou le placeholder `{{DATE}}`), puis positionner le logo client :
- **X** : meme position que le logo entite (`entityLogo.position.x`)
- **Y** : meme position que l'element date sur le template

Si la date n'est pas trouvee, utiliser la position Y du logo entite comme fallback.

### Modifications

**Fichier : `src/components/rental-proposal/RentalProposalPreview.tsx`** (lignes 590-594)

Remplacer :
```typescript
const logoTopPct = entityLogo 
  ? ((entityLogo.position.y + entityLogo.size.height) / CANVAS_SCALE.height) * 100 + 1
  : 6;
const logoLeftPct = 70;
```

Par :
```typescript
// Trouver l'element date sur le template pour aligner verticalement
const dateElement = page1Elements.find(el => {
  if (el.type !== 'text') return false;
  const text = (el.content as TextContent)?.text || '';
  return text.includes('{{DATE}}') || /janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre/i.test(text);
});

// X : aligne avec le logo entite | Y : aligne avec la date
const logoTopPct = dateElement 
  ? (dateElement.position.y / CANVAS_SCALE.height) * 100
  : entityLogo 
    ? (entityLogo.position.y / CANVAS_SCALE.height) * 100
    : 2;
const logoLeftPct = entityLogo 
  ? (entityLogo.position.x / CANVAS_SCALE.width) * 100
  : 2;
```

**Fichier : `src/components/rental-proposal/RentalProposalExport.tsx`** (lignes 263-267)

Meme logique : detecter la date, aligner X avec le logo entite et Y avec la date.

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Logo client aligne horizontalement avec le logo entite et verticalement avec la date |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Meme logique pour l'export PDF |




## Corriger le positionnement du logo client sur la page 1

### Cause racine

Le code actuel utilise `page1Elements.find(el => el.type === 'image')` pour trouver le logo entite. Or, cela trouve le **premier** element image de la page, qui est l'image de fond (le batiment), pas le logo Grosbill. Le logo entite se distingue par la presence d'un `logoId` dans son `ImageContent`.

### Correction

**Fichier : `src/components/rental-proposal/RentalProposalPreview.tsx`** (ligne ~586)

Remplacer :
```
const entityLogo = page1Elements.find(el => el.type === 'image');
```
Par :
```
const entityLogo = page1Elements.find(el => 
  el.type === 'image' && (el.content as ImageContent)?.logoId
);
```

Cela cible specifiquement l'element logo (qui a un `logoId`) et ignore l'image de fond.

**Fichier : `src/components/rental-proposal/RentalProposalExport.tsx`** (ligne ~259)

Meme correction :
```
const entityLogo = page1Elements.find((el: any) => 
  el.type === 'image' && el.content?.logoId
);
```

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Filtrer sur `logoId` pour trouver le vrai logo entite |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Meme filtre dans l'export PDF |


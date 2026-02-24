

## Corriger la coherence du positionnement entre mode edition et mode lecture

### Cause racine

Le wrapper du contenu dynamique a un positionnement different selon le mode :
- **Mode edition** (`PreviewEditableCanvas.tsx` ligne 644) : `position: absolute; inset: 0` -- couvre tout le canvas
- **Mode lecture** (`RentalProposalPreview.tsx` ligne 554) : `<div>` sans positionnement -- taille determinee par le contenu enfant

Le `transform: translate(X%, Y%)` est calcule en pourcentage de la taille du conteneur. Comme la taille du conteneur change entre les deux modes, le deplacement visuel est different.

### Correction

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/RentalProposalPreview.tsx` (lignes 553-561) | Ajouter `position: absolute; inset: 0; pointerEvents: none` au wrapper du contenu dynamique en mode lecture pour qu'il ait exactement les memes dimensions que le wrapper en mode edition |

### Detail technique

Le wrapper en mode lecture passe de :

```text
<div style={{
  transform: ...
  transformOrigin: 'top left',
}}>
```

a :

```text
<div style={{
  position: 'absolute',
  inset: 0,
  transform: ...
  transformOrigin: 'top left',
  pointerEvents: 'none',
}}>
```

Cela garantit que le conteneur a les memes dimensions (100% du canvas) dans les deux modes, ce qui rend le calcul de `translate(X%, Y%)` identique. Le `pointerEvents: none` empeche toute interaction en mode lecture.

### Impact

- Le contenu dynamique apparaitra au meme endroit en mode lecture et en mode edition
- Aucun impact sur l'export PDF
- Aucun impact sur les interactions en mode lecture (pointer-events desactives)




## Corriger le deplacement et le redimensionnement des elements dynamiques

### Cause racine

Le wrapper du contenu dynamique dans `PreviewEditableCanvas.tsx` utilise `position: relative`, mais son contenu enfant (tableaux, offres) utilise `position: absolute`. En CSS, les enfants absolus ne contribuent pas a la hauteur du parent, ce qui fait que le wrapper s'effondre a 0px de hauteur. Resultat : aucune zone cliquable, pas de poignees visibles, pas de badge visible.

### Correction

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/PreviewEditableCanvas.tsx` | Changer le wrapper dynamique de `relative` a `absolute inset-0` pour qu'il couvre toute la surface du canvas et capte les evenements souris |

### Detail technique

**Ligne 641-685 du fichier PreviewEditableCanvas.tsx**

Remplacer la classe `relative` du wrapper par `absolute inset-0` :

Avant :
```text
className={cn(
  "relative",
  isEditMode && onDynamicContentDrag
    ? "cursor-move border-2 border-dashed border-primary/40 rounded"
    : "pointer-events-none"
)}
```

Apres :
```text
className={cn(
  "absolute inset-0",
  isEditMode && onDynamicContentDrag
    ? "cursor-move"
    : "pointer-events-none"
)}
```

On retire aussi le `border-dashed` du wrapper (il couvre maintenant tout le canvas, la bordure serait trompeuse). Le badge "Deplacer / Redimensionner" est repositionne en `top-1 left-1` au lieu de `-top-5` (puisque le wrapper couvre desormais tout le canvas, le badge doit etre a l'interieur).

Les poignees de redimensionnement aux 4 coins fonctionneront naturellement : elles se positionnent aux coins du wrapper qui couvre le canvas entier. Le scale (0.3 a 1.5) s'applique via `transform: scale()` sur ce meme wrapper, et le contenu absolu a l'interieur suit la transformation.

### Impact

- Le deplacement (drag) du contenu dynamique fonctionnera en cliquant n'importe ou sur le contenu
- Les 4 poignees de redimensionnement seront visibles aux coins du canvas en mode edition
- Aucun impact sur le mode lecture ni sur l'export PDF
- Le badge sera visible en haut a gauche du canvas en mode edition


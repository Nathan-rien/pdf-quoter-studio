

## Redimensionner et deplacer les elements dynamiques en mode edition

### Contexte

Actuellement, les blocs de contenu dynamique (tableau d'investissement, propositions locatives, avantages, etc.) peuvent etre deplaces en mode edition mais pas redimensionnes. L'objectif est d'ajouter des poignees de redimensionnement sur ces blocs pour permettre de les reduire ou agrandir via un facteur d'echelle (CSS `transform: scale()`).

### Approche technique

Utiliser un facteur de scale (`scaleX`, `scaleY`) applique via `transform: scale()` sur le wrapper du contenu dynamique, combine avec le deplacement existant. Des poignees de redimensionnement apparaitront aux 4 coins du bloc en mode edition.

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `src/stores/rentalProposalStore.ts` | Etendre le type `dynamicContentOffsets` pour inclure un facteur de scale (`scaleX`, `scaleY`) en plus de `x` et `y`. Ajouter une action `updateDynamicContentScale`. |
| `src/components/rental-proposal/PreviewEditableCanvas.tsx` | Ajouter des poignees de resize sur le wrapper du contenu dynamique. Gerer le drag des poignees pour calculer le nouveau scale. Appliquer `transform: scale()` combine avec `translate()`. |
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Passer le scale au canvas et le callback de mise a jour. |

### Detail technique

**1. Store - Nouveau type et action**

Le type de `dynamicContentOffsets` evolue de :
```text
Record<number, { x: number; y: number }>
```
a :
```text
Record<number, { x: number; y: number; scaleX: number; scaleY: number }>
```

Valeurs par defaut du scale : `scaleX: 1, scaleY: 1`. Les actions existantes `updateDynamicContentOffset` integrent le scale. Une nouvelle action `updateDynamicContentScale` permet de modifier uniquement le scale.

**2. PreviewEditableCanvas - Poignees de resize**

- Ajouter un state `dynamicResizeState` (similaire au `resizeState` existant pour les elements statiques) qui track le coin tire et les dimensions de depart.
- En mode edition, afficher 4 poignees de coin (petits carres 8x8px) sur le wrapper du contenu dynamique.
- Au drag d'une poignee, calculer le ratio de scale en divisant le nouveau delta par la taille initiale du bloc.
- Limiter le scale entre 0.3 (minimum) et 1.5 (maximum) pour eviter les debordements ou le contenu illisible.
- Appliquer `transform: translate(...) scale(scaleX, scaleY)` avec `transform-origin: top left`.
- Le badge affichera "Deplacer / Redimensionner".

**3. RentalProposalPreview - Transmission du scale**

- Extraire `scaleX` et `scaleY` depuis `dynamicContentOffsets[pageNum]` (defaut 1).
- Les passer au `PreviewEditableCanvas` via les props existantes `dynamicContentOffset`.
- Le callback `onDynamicContentDrag` transmet deja l'objet complet avec x/y ; on y ajoutera scaleX/scaleY.

### Rendu visuel en mode edition

```text
+--[Deplacer / Redimensionner]----+
|  o                            o |   <- poignees coin (nw, ne)
|                                 |
|   [Contenu dynamique scale]     |
|                                 |
|  o                            o |   <- poignees coin (sw, se)
+---------------------------------+
```

### Impact sur l'export PDF

Aucun impact sur l'export PDF : le scale est un ajustement visuel pour l'apercu uniquement (les offsets ne sont deja pas utilises pour l'export).


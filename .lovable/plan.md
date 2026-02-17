

## Rendre les blocs dynamiques deplacables dans l'Apercu

### Contexte

Dans l'apercu de la proposition, le mode "Edition" permet deja de deplacer les elements statiques du template (textes, images, formes). Cependant, les contenus dynamiques (tableau d'investissements, "Votre offre", services inclus, options) sont proteges par `pointer-events-none` et ne peuvent pas etre deplaces.

### Solution

Ajouter un systeme de drag pour les blocs de contenu dynamique dans le `PreviewEditableCanvas`. Chaque bloc dynamique pourra etre deplace en glissant son conteneur. Les offsets de position seront stockes dans le store de proposition pour persister pendant la session.

### Architecture

Le contenu dynamique est rendu via `renderDynamicContent()` dans `PreviewEditableCanvas`. Actuellement, ce contenu est enveloppe dans un `div` avec `pointer-events-none`. La modification consiste a :

1. Retirer `pointer-events-none` en mode edition
2. Ajouter des evenements de drag sur le conteneur dynamique
3. Stocker les offsets de position par page dans `rentalProposalStore`
4. Appliquer ces offsets via `transform: translate()` sur le bloc dynamique

### Modifications

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/PreviewEditableCanvas.tsx` | Rendre le wrapper du contenu dynamique draggable en mode edition avec curseur move et gestion du drag |
| `src/stores/rentalProposalStore.ts` | Ajouter un state `dynamicContentOffsets` (Record par page) et une action `updateDynamicContentOffset` |
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Passer les offsets au `PreviewEditableCanvas` et les appliquer sur les blocs dynamiques |

### Details techniques

**Store (rentalProposalStore)** : Ajouter un champ `dynamicContentOffsets: Record<number, { x: number; y: number }>` qui stocke le decalage en pixels canvas pour le bloc dynamique de chaque page. Action `updateDynamicContentOffset(pageNumber, offset)`.

**PreviewEditableCanvas** : 
- Nouvelle prop `dynamicContentOffset?: { x: number; y: number }` et callback `onDynamicContentDrag?: (offset: { x: number; y: number }) => void`
- Le wrapper du contenu dynamique recoit des evenements `onMouseDown/Move/Up` pour le drag
- En mode edition, le wrapper affiche un curseur `move` et un indicateur visuel (bordure en pointilles + badge "Deplacer")
- Le `transform: translate(deltaX%, deltaY%)` est applique sur le wrapper

**RentalProposalPreview** :
- Lire les offsets depuis le store et les passer au canvas
- Mettre a jour le store via le callback de drag

### Limites

- Les offsets sont en session uniquement (non persistes dans le template cloud)
- Le deplacement s'applique au bloc dynamique entier, pas a ses sous-elements individuels
- Les offsets sont reinitialises si on change de template


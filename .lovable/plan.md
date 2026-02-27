

## Problème identifié

Dans `renderNosOptionsPage()` (ligne 1324), les éléments **statiques** du template de la page 6 (textes avec noms d'options, cercles décoratifs) sont rendus EN PLUS du contenu dynamique. Le contenu dynamique (cases à cocher, prix, descriptions formatées) est caché derrière les éléments statiques du template.

C'est le même pattern que `renderServicesInclusPage` qui filtre les éléments statiques pour ne garder que les images de fond sur les pages de continuation (ligne 1258).

## Correction (1 fichier, 1 ligne)

**`src/components/rental-proposal/RentalProposalPreview.tsx`** — ligne 1324 :

Filtrer les éléments statiques pour ne garder que les images (fonds de page), exactement comme pour les pages services :

```typescript
// Avant :
return renderPageWithEditMode(6 as PDFPageNumber, staticElements, renderNosOptionsContent);

// Après :
return renderPageWithEditMode(6 as PDFPageNumber, staticElements.filter(el => el.type === 'image'), renderNosOptionsContent);
```

Cela supprime les textes et formes statiques du template qui masquent le rendu dynamique avec les cases à cocher et les prix.


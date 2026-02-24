
## Rendre les poignées de redimensionnement visibles et utilisables

### Probleme

Les poignées de redimensionnement (4 petits cercles de 8x8px) sont positionnées aux coins du wrapper `absolute inset-0`, c'est-a-dire aux coins de la **page entiere**. Elles sont quasiment invisibles car :
1. Elles font seulement 8x8 pixels (`w-2 h-2`)
2. Elles se trouvent aux extremites de la page, loin du contenu reel
3. Elles se confondent avec les bords

### Correction

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/PreviewEditableCanvas.tsx` | Agrandir les poignees (de `w-2 h-2` a `w-4 h-4`), ajouter une bordure blanche et une ombre pour le contraste, et ajouter un anneau visuel (`ring-2 ring-white`) |

### Detail technique

Les 4 poignees aux coins (`nw`, `ne`, `sw`, `se`) passent de :

```text
"absolute w-2 h-2 bg-primary rounded-full z-50"
```

a :

```text
"absolute w-4 h-4 bg-primary border-2 border-white rounded-full z-50 shadow-md"
```

Cela triple la surface cliquable (16x16px au lieu de 8x8px), ajoute un contour blanc pour le contraste sur fond clair, et une ombre pour la visibilite. Les poignees restent aux coins du wrapper (page entiere), ce qui est coherent avec le comportement actuel de redimensionnement par echelle globale.

### Resultat attendu

Les 4 poignees seront clairement visibles aux coins de la page en mode edition, avec un style similaire aux poignees de l'editeur de template.

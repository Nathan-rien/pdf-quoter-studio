

## Corriger le rendu tronque de la page 4 dans l'export PDF

### Probleme
L'apercu (Preview) utilise un systeme de "flux relatif" pour la page 4 : les elements statiques du template situes sous le tableau de produits (ex: "Avantages", "Condition de l'offre") suivent naturellement le tableau grace a un rendu en flux (`renderFlowElement`). Leur position s'adapte a la hauteur variable du contenu dynamique.

L'export PDF, en revanche, rend **tous** les elements statiques en position absolue a leurs coordonnees originales dans le template. Le contenu dynamique (tableau produits + propositions financieres) est lui aussi en position absolue a `top: 15%`. Quand le contenu dynamique est volumineux, il chevauche les elements statiques "Avantages" et "Condition de l'offre" qui restent fixes plus bas sur la page.

### Solution
Reproduire dans l'export PDF la meme logique de partition et de flux relatif que l'apercu :

1. **Partitionner les elements de la page 4** en "au-dessus" et "en-dessous" de la zone dynamique (identique a `renderProductPage` dans `RentalProposalPreview.tsx`)
2. **Rendre les elements "en-dessous"** en flux relatif a l'interieur du bloc dynamique, apres le tableau des produits et les propositions financieres
3. **Exclure ces elements** du rendu absolu standard de la page

### Fichiers modifies

**1. `src/lib/pdf-html-generator.ts`**
- Modifier `renderPageToHTML` pour accepter un parametre optionnel `excludeElementIds: string[]` qui exclut certains elements du rendu absolu standard
- Ou plus simplement : modifier `generatePDFDocumentHTML` pour passer le filtre d'exclusion lors du rendu de la page 4

**2. `src/components/rental-proposal/RentalProposalExport.tsx`**
- Dans `generateDynamicContentByPage`, pour la page 4 :
  - Recuperer la version du template et les elements de la page 4
  - Calculer le seuil Y de la zone dynamique (identique a l'apercu)
  - Identifier les elements texte situes en-dessous
  - Generer leur HTML en flux relatif (sans `position: absolute`) avec les memes styles que `renderFlowElement` dans l'apercu (font scaling, substitution dynamique, etc.)
  - Les ajouter a la fin du bloc `dynamicContent[4]`, apres les propositions financieres
  - Retourner la liste de leurs IDs pour les exclure du rendu absolu

**3. `src/lib/pdf-html-generator.ts` (ajustement)**
- Ajouter une variante de `renderPageToHTML` ou un parametre d'exclusion pour filtrer les elements deja rendus en flux dans le contenu dynamique
- Modifier `generatePDFDocumentHTML` pour propager cette information pour la page 4

### Detail technique

Le flux de rendu pour la page 4 deviendra :

```text
page-sheet > page
  [Elements statiques AU-DESSUS : position absolue]  (logos, titre haut...)
  [Bloc dynamique : position absolue, top: 5%]
    Titre "Vos investissements"
    Tableau produits
    Total investissement
    Titre "Votre offre"
    Propositions financieres (Location X mois)
    [Elements statiques EN-DESSOUS : flux relatif]  (Avantages, Conditions...)
```

Les elements "en-dessous" sont identifies par :
- `position.y >= dynamicZoneBottomY` (seuil calcule depuis les dynamicZones du template)
- `type === 'text'` (les images/logos restent en absolu)

Leurs styles en flux relatif reproduisent exactement ceux de `renderFlowElement` :
- `font-size` scale par `PREVIEW_FONT_SCALE`
- Substitution dynamique (`{{DATE}}`, `{{FRAIS_DOSSIER}}`)
- Espacement `mt-3` equivalent entre sections (titres bold)
- `margin-top: 16px` avant le premier element en-dessous (equivalent a `mt-4`)

Le `top` du bloc dynamique passe de `15%` a `5%` pour correspondre a l'apercu.


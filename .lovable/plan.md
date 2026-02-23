

## Centrer le logo client sous la date dans l'export PDF

### Probleme identifie

Le positionnement horizontal du logo client dans l'export PDF (`RentalProposalExport.tsx`) est calcule a partir du centre de l'element date du template :

```text
autoLeftPct = (dateElement.position.x + dateElement.size.width / 2) / CANVAS_SCALE.width * 100
```

Or, l'element date utilise `width: fit-content` dans le template, ce qui signifie que `dateElement.size.width` (stocke dans le template) ne correspond pas forcement a la largeur reelle rendue. De plus, le `transform: translateX(-50%)` ne suffit pas toujours a garantir un centrage parfait si le point de reference est decale.

L'apercu (`RentalProposalPreview.tsx`) utilise la meme logique mais via le composant `ClientLogoDraggable`, ce qui peut creer un ecart supplementaire entre apercu et export.

### Solution

Modifier le calcul de positionnement dans les deux fichiers pour :

1. **Centrer le logo client sur le centre horizontal du logo entite** (plutot que sur le centre de l'element date), car l'utilisateur demande un alignement avec le logo entite.
2. **Fallback sur le centre de la date** si aucun logo entite n'est present.
3. **Garantir la parite** entre `RentalProposalPreview.tsx` et `RentalProposalExport.tsx`.

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/RentalProposalExport.tsx` | Recalculer `autoLeftPct` en se basant sur le centre horizontal du logo entite. Conserver le fallback sur la date. |
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Appliquer la meme logique de centrage dans `getLogoPositionData()` pour que l'apercu soit fidelement aligne avec l'export. |

### Detail technique

**Calcul actuel** (les deux fichiers) :
```text
autoLeftPct = (dateElement.x + dateElement.width / 2) / canvasWidth * 100
```

**Nouveau calcul** :
```text
// Priorite : centrer sur le logo entite
if (entityLogo) {
  autoLeftPct = (entityLogo.x + entityLogo.width / 2) / canvasWidth * 100
} else if (dateElement) {
  autoLeftPct = (dateElement.x + dateElement.width / 2) / canvasWidth * 100
} else {
  autoLeftPct = 50 // centre de la page
}
```

Le `top` reste inchange (sous la date + 1%).

### Ce qui ne change pas
- La taille du logo client (50x50 unites canvas)
- Le mode drag-and-drop en mode "Modifier"
- Le `clientLogoOverride` (quand l'utilisateur a manuellement repositionne le logo)
- Le rendu des autres elements de la page 1


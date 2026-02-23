

## Corriger le logo client qui disparait en mode Modifier

### Cause du probleme
Le `ClientLogoDraggable` est rendu a l'interieur de `renderClientData`, qui est passe comme `renderDynamicContent` a `PreviewEditableCanvas`. En mode edition, ce contenu dynamique est place dans un wrapper `<div>` avec `cursor-move` et potentiellement un `transform: translate()` (via `dynamicContentOffset`). Le logo, positionne en `absolute` avec des pourcentages, se retrouve positionne par rapport a ce wrapper au lieu de la page entiere, ce qui le fait disparaitre ou le place hors de la zone visible.

### Solution
Separer le logo client du contenu dynamique. Le logo doit etre rendu directement dans le canvas de la page, independamment du bloc dynamique (carte client/commercial).

### Changements

**1. `src/components/rental-proposal/PreviewEditableCanvas.tsx`**
- Ajouter une prop optionnelle `renderOverlayContent?: () => React.ReactNode` pour du contenu qui se rend directement dans le canvas (hors du wrapper dynamique)
- Rendre ce contenu apres les elements statiques mais en dehors du wrapper dynamique

**2. `src/components/rental-proposal/RentalProposalPreview.tsx`**
- Extraire le rendu du `ClientLogoDraggable` de `renderClientData` dans une fonction separee `renderClientLogo`
- Passer `renderClientLogo` via la nouvelle prop `renderOverlayContent` de `PreviewEditableCanvas`
- `renderClientData` ne contient plus que la carte client/commercial (le bloc en bas de page)
- En mode lecture, le logo continue d'etre rendu normalement dans `renderClientData`

### Detail technique

```text
// PreviewEditableCanvas - nouvelle prop
interface PreviewEditableCanvasProps {
  // ... existant
  renderOverlayContent?: () => React.ReactNode; // NEW
}

// Rendu dans le canvas (hors du wrapper dynamique)
{renderOverlayContent?.()}

// RentalProposalPreview - separation
const renderClientLogo = () => {
  // Calcul de position + rendu de ClientLogoDraggable
  // (le code qui est actuellement au debut de renderClientData)
};

const renderClientData = () => {
  // En mode lecture : logo + carte client (inchange)
  // En mode edit : seulement la carte client (logo via overlay)
};

return renderPageWithEditMode(
  1,
  page1Elements,
  renderClientData,
  fallbackContent,
  isEditMode ? renderClientLogo : undefined  // overlay
);
```

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `PreviewEditableCanvas.tsx` | Ajout prop `renderOverlayContent` + rendu dans le canvas |
| `RentalProposalPreview.tsx` | Separation logo/carte, passage du logo en overlay, adaptation de `renderPageWithEditMode` |


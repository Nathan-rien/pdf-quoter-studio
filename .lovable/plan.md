

## Rendre le logo client deplacable et redimensionnable en mode Modifier

### Contexte
Actuellement, le logo client sur la page 1 est rendu en position calculee automatiquement (centre sous la date, a droite du logo entite). Il n'est pas interactif en mode "Modifier". L'objectif est de permettre a l'utilisateur de deplacer et redimensionner ce logo comme les autres elements du template.

### Approche
Ajouter un etat `clientLogoOverride` dans le store `rentalProposalStore` qui stocke la position et la taille personnalisees du logo client. En mode Modifier, le logo sera rendu avec des poignees de deplacement et de redimensionnement.

### Changements

**1. `src/stores/rentalProposalStore.ts`**
- Ajouter une interface `ClientLogoOverride` avec `position: {x, y}` et `size: {width, height}` (en pourcentages du canvas)
- Ajouter `clientLogoOverride: ClientLogoOverride | null` dans le state
- Ajouter une action `updateClientLogoOverride` pour mettre a jour position/taille
- Ajouter une action `resetClientLogoOverride` pour revenir au placement automatique

**2. `src/components/rental-proposal/RentalProposalPreview.tsx`**
- Dans `renderClientData`, utiliser `clientLogoOverride` si defini, sinon le calcul automatique actuel
- En mode edit, rendre le logo dans un conteneur interactif avec :
  - Curseur `move` et bordure de selection au survol/clic
  - Drag-and-drop pour deplacer (memes mecanismes que PreviewEditableCanvas)
  - Poignees de redimensionnement aux 4 coins
  - Les nouvelles valeurs sont sauvegardees dans le store via `updateClientLogoOverride`
- En mode lecture, rendu inchange (position depuis override ou calcul auto)

**3. `src/components/rental-proposal/RentalProposalExport.tsx`**
- Lire `clientLogoOverride` du store
- Si defini, utiliser les valeurs de position/taille pour le rendu PDF
- Sinon, conserver le calcul automatique actuel

### Detail technique

```text
// Nouveau dans le store
interface ClientLogoOverride {
  top: number;    // % du canvas
  left: number;   // % du canvas
  width: number;  // px (taille de l'image)
  height: number; // px (taille de l'image)
}

// Dans renderClientData (mode edit)
- Wrapper <div> avec onMouseDown pour le drag
- 4 poignees de resize (nw, ne, sw, se)
- Badge "Deplacer" visible au survol (comme les blocs dynamiques)
- Mise a jour du store a chaque mouvement

// Persistence
- Les valeurs sont persistees via zustand/persist (deja configure)
- Un reset est possible pour revenir au placement automatique
```

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `rentalProposalStore.ts` | Ajout interface + state + actions pour clientLogoOverride |
| `RentalProposalPreview.tsx` | Logo client interactif en mode edit (drag + resize) |
| `RentalProposalExport.tsx` | Lecture de clientLogoOverride pour le PDF |


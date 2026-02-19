
## Correction : Déplacer l'adresse de l'entité en bas de page 1, centrée

### Problème identifié

Dans `RentalProposalPreview.tsx`, la fonction `renderClientData` (lignes 584-622) affiche actuellement l'adresse de l'entité du commercial (`selectedCommercial.adresse`) **à l'intérieur du bloc "Votre interlocuteur"** (ligne 612), comme un sous-texte sous l'email.

L'utilisateur souhaite que cette adresse apparaisse **en bas de page, centrée horizontalement**, au même niveau que l'indicateur "Page 1/7" (composant `PageFooter`, positionné en `bottom-0 right-0`).

### Solution

Deux modifications dans `src/components/rental-proposal/RentalProposalPreview.tsx` :

**1. Supprimer l'adresse du bloc "Votre interlocuteur"**

Ligne 612 à retirer :
```tsx
<p className="text-muted-foreground text-[8px] mt-1">{selectedCommercial.adresse}</p>
```

**2. Ajouter l'adresse en pied de page 1, centrée**

La page 1 (`renderPage1`) appelle `renderPageWithEditMode` qui insère `<PageFooter pageNum={pageNum} />` (composant en `absolute bottom-0 right-0`).

La solution la plus propre est d'ajouter l'adresse directement dans `renderClientData` sous forme d'un **second bloc absolu** positionné en bas de page, centré, au même niveau vertical que le `PageFooter`. Ce sera un `absolute bottom-0 left-0 right-0` avec `text-center`.

```tsx
// Adresse de l'entité en pied de page - centrée, même niveau que Page X/Y
<div className="absolute bottom-0 left-0 right-0 pb-1 flex justify-center z-40">
  <span className="text-[9px] text-muted-foreground">
    {selectedCommercial?.adresse}
  </span>
</div>
```

Ce bloc sera rendu via `renderDynamicContent` (déjà passé à `renderPageWithEditMode`), donc il s'affichera correctement par-dessus les éléments du template, aligné avec le `PageFooter`.

### Fichier modifié

- `src/components/rental-proposal/RentalProposalPreview.tsx`
  - Ligne 612 : supprimer la ligne affichant `selectedCommercial.adresse` dans le bloc interlocuteur
  - Après la fermeture du `<div>` de `renderClientData` (avant le `)`) : ajouter le fragment avec l'adresse centrée en `absolute bottom-0`

### Résultat attendu

- **Bloc "Votre interlocuteur"** : affiche uniquement nom, téléphone, email
- **Bas de page 1, centré** : affiche l'adresse de l'entité (`130, rue Achard...` ou `60 Boulevard de l'hôpital...`) au même niveau que "Page 1/7" (qui reste en bas à droite)

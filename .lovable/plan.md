# Ajout d'un champ Description/Texte sous Synthèse reprise

## Objectif
Ajouter un champ texte libre (textarea) sous le tableau "Synthèse reprise" dans l'onglet Reprise. Son contenu sera automatiquement affiché à la suite du tableau dans le PDF généré.

## Changements

### 1. Store (`src/stores/rentalProposalStore.ts`)
- Ajouter un champ `repriseDescription: string` (valeur par défaut `""`) dans `RepriseData`.
- Persisté automatiquement avec le reste de l'état (localStorage).

### 2. UI Onglet Reprise (`src/components/rental-proposal/RepriseTab.tsx`)
- Sous la Card "Synthèse reprise", ajouter une nouvelle Card "Description" contenant un `Textarea` (auto-resize) lié à `repriseData.repriseDescription`.
- Placeholder: "Texte libre affiché sous le tableau dans le PDF".

### 3. Preview (`src/components/rental-proposal/RentalProposalPreview.tsx`)
- Dans le bloc Reprise (après le `<table>` Synthèse), si `repriseDescription` non vide, rendre un `<div>` avec le texte (whitespace-pre-wrap) pour respecter les retours à la ligne.

### 4. Export PDF (`src/components/rental-proposal/RentalProposalExport.tsx`)
- Dans le HTML de la page Reprise (après le tableau Synthèse), injecter le texte échappé entre `<div style="white-space: pre-wrap; ...">...</div>` si non vide.
- Conserver la typographie/espacement cohérents avec le reste du PDF.

## Hors scope
- Pas de calcul, pas de logique métier modifiée.
- Pas de WYSIWYG riche — simple texte libre multi-lignes.

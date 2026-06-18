## Contexte
L'encart "Description" de l'onglet Reprise (sous le tableau Synthèse reprise) dispose d'un champ Titre et d'un champ Texte, ajoutés précédemment. Actuellement, ces deux champs sont initialisés à `''` (vide). L'utilisateur souhaite qu'ils soient pré-remplis par défaut avec les textes visibles sur la capture écran, tout en restant modifiables. Le texte doit ensuite transiter dans le PDF généré.

## Valeurs par défaut à appliquer
- **Titre** : `Valorisation du parc selon typologie et état du matériel en seconde vie`
- **Texte** : `Cette cotation est une estimation de la valeur du matériel repris. Une valorisation définitive sera effectuée par le biais d'un virement en votre faveur après récupération et audit.`

## Modifications prévues

### 1. `src/stores/rentalProposalStore.ts`
**a) Constantes par défaut**
Ajouter deux constantes en haut du fichier :
- `REPRISE_DESC_TITLE_DEFAULT`
- `REPRISE_DESC_TEXT_DEFAULT`

**b) État initial (`initialRepriseData`)**
Remplacer les valeurs `''` de `repriseDescriptionTitle` et `repriseDescription` par les constantes ci-dessus.

**c) Migration des données persistées (zustand/persist)**
Le middleware `persist` de zustand recharge l'état sauvegardé dans `localStorage`. Si un utilisateur a déjà une proposition en cours avec ces champs vides, les valeurs vides seront restaurées, écrasant les nouvelles valeurs par défaut.

Pour corriger cela sans toucher la logique de `persist`, on va injecter un **post-rehydrate** dans le `onRehydrateStorage` (ou via une logique de merge à l'initialisation) qui applique les valeurs par défaut uniquement si le champ est vide (`''` ou `undefined`) :
- Si `repriseDescriptionTitle` est vide → injecter le titre par défaut.
- Si `repriseDescription` est vide → injecter le texte par défaut.
- Si l'utilisateur a déjà modifié la valeur (non vide), la conserver telle quelle.

**d) Actions de réinitialisation**
- `resetAll` et `startNewProposal` : vérifier qu'ils réutilisent bien `initialRepriseData` (ce qui est déjà le cas), donc les nouvelles propositions porteront les textes par défaut.
- `loadFromExport` (rechargement d'historique) : si le snapshot historique ne contient pas ces champs (ancien format), les champs vides seront gérés par la logique de défaut ci-dessus.

### 2. `src/components/rental-proposal/RepriseTab.tsx`
Aucune modification de structure ou de logique n'est requise ici. Les `<Input>` et `<AutoResizeTextarea>` afficheront automatiquement les nouvelles valeurs par défaut car ils sont liés au store. Le placeholder ne sera plus visible puisque la valeur par défaut remplit le champ, ce qui est le comportement attendu.

### 3. `src/components/rental-proposal/RentalProposalPreview.tsx` et `RentalProposalExport.tsx`
Aucune modification n'est requise. Le rendu conditionnel actuel (`repriseData.repriseDescriptionTitle?.trim() || repriseData.repriseDescription?.trim()`) affichera le bloc car les valeurs par défaut ne sont pas vides. Si l'utilisateur efface volontairement le texte, le bloc disparaîtra comme avant.

## Garanties
- Aucun impact sur les fonctionnalités existantes (grades, lignes produits, Blancco, toggle d'affichage, etc.).
- Le texte par défaut sera visible dans la prévisualisation et le PDF dès la création d'une nouvelle proposition.
- Les propositions en cours (localStorage) verront leurs champs vides complétés automatiquement au rechargement.
- Les utilisateurs conservent la possibilité de modifier ou d'effacer le texte à leur convenance.
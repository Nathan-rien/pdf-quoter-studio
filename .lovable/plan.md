## Plan de correction

1. **Fiabiliser le chargement du template dans `ServiceProposalPreview.tsx`**
   - Lire la version depuis l’état frais de `useTemplateEditorStore.getState()` après `loadVersionPages`, au lieu de dépendre d’un getter potentiellement refermé sur un état ancien.
   - Inclure `allVersions` dans les dépendances nécessaires pour forcer le re-render quand les pages du template sont injectées dans le store.
   - Afficher un état de chargement tant que `isLoadingVersion` ou `pagesLoaded` n’est pas terminé.

2. **Corriger la sélection du template côté Proposition Services**
   - S’assurer que le template choisi dans l’onglet `Template` est bien recopié dans `serviceProposalStore.selectedTemplateId` avant l’ouverture de l’aperçu/export.
   - Préserver le fallback vers le template actif si aucun template spécifique n’est sélectionné.

3. **Vérifier le rendu**
   - Contrôler que la page 1 affiche bien les éléments du template dans l’onglet `Aperçu & Export`.
   - Vérifier que la pagination reste cohérente : pages template 1-3, puis pages services, puis pages template restantes.

Aucun changement prévu sur la base de données ni sur les autres fonctionnalités.
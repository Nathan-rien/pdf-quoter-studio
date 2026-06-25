## Objectif
Faire charger l’aperçu PDF de **Propositions Services** de façon fiable, en affichant les pages du template sélectionné puis les pages spécifiques “Vos services” et “Services inclus”.

## Diagnostic
Le composant `ServiceProposalPreview.tsx` fige une copie locale `resolvedVersion` et utilise `loadingRef.current` dans le rendu. Comme une ref ne déclenche pas de re-render, l’interface peut rester bloquée sur “Chargement des pages…” ou afficher des pages vides même après le chargement. Le rendu devrait relire la version fraîche directement depuis `useTemplateEditorStore`, comme le fait déjà l’aperçu standard.

## Plan de correction
1. **Remplacer la résolution locale fragile dans `ServiceProposalPreview.tsx`**
   - Supprimer `resolvedVersion` et `loadingRef`.
   - S’abonner explicitement à `allVersions` pour forcer le re-render quand `loadVersionPages` injecte les pages.
   - Calculer `currentVersion` via `useMemo` depuis `activeTemplate` + `allVersions`, en priorité sur la version publiée la plus récente.

2. **Fiabiliser le lazy loading des pages template**
   - Ajouter un état simple `pagesLoaded` / `isLoadingPages`.
   - Quand les métadonnées sont chargées et que la version existe mais `pages.length === 0`, appeler `loadVersionPages(version.id)` une seule fois pour cette version.
   - Recalculer automatiquement `currentVersion` après mise à jour du store.

3. **Corriger les états de rendu**
   - Afficher “Chargement du template…” tant que les métadonnées ne sont pas prêtes.
   - Afficher “Chargement des pages…” pendant le lazy loading.
   - Afficher un état explicite si aucun template/version n’est disponible, au lieu de générer une pagination incohérente.

4. **Préserver la structure PDF demandée**
   - Garder l’ordre : pages template 1 à 3, page “Vos services”, page “Services inclus”, puis les pages template restantes.
   - Maintenir le rendu des éléments texte/image/shape/icon existants.

5. **Vérifier**
   - Contrôler que l’onglet “Aperçu & Export” ne reste plus bloqué en chargement.
   - Vérifier que la page 1 affiche les éléments du template et que la pagination inclut les 2 pages services.
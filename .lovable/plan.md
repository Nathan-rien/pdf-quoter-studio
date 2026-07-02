## Objectif
Retirer entièrement la section "Services inclus" du parcours Propositions Services (édition + aperçu + PDF).

## Modifications

### 1. `src/components/service-proposal/ServiceProposalView.tsx`
- Supprimer l'onglet `TabsTrigger value="services"` "Services inclus" (ligne 347) et son `TabsContent value="services"` (lignes 358+ jusqu'à fin de bloc).
- Retirer les hooks `servicesInclus` / `updateServicesInclus` (lignes 291-292) devenus inutilisés.
- Ajuster `grid-cols-*` de la `TabsList` en conséquence.

### 2. `src/components/service-proposal/ServiceProposalPreview.tsx`
- Supprimer la fonction `renderServicesInclusPage` (lignes 666-695).
- Retirer la ligne d'insertion `if (currentPage === TEMPLATE_PAGES_BEFORE + 1) return renderServicesInclusPage(...)`.
- Recalculer `totalPages = Math.max(1, templatePagesTotal)` et l'offset (retirer le "+1" dédié à la page Services inclus).
- Retirer l'import/usage `servicesInclus` et `FileCheck` si plus utilisés.

### 3. `src/components/service-proposal/ServiceProposalExport.tsx`
- Supprimer la génération de `servicesInclusPageHTML` (lignes 491-522) et l'insertion dans `extraPagesAfter[SERVICES_INSERTION_AFTER_PAGE]` (525-527).
- Retirer `servicesInclus` de la lecture du store et des dépendances du `useMemo/useCallback`.
- Supprimer les constantes/imports devenus orphelins (`SERVICES_INSERTION_AFTER_PAGE` si non réutilisée, `escapeHtml` local si non réutilisée).

### 4. Store (`src/stores/serviceProposalStore.ts`)
- Conserver `servicesInclus` dans le state et les snapshots pour ne pas casser les propositions existantes (rétro-compat de reload), mais ne plus l'exposer dans l'UI ni le PDF.
- Aucune migration DB nécessaire (données stockées dans le snapshot JSONB).

## Vérifications
- Compilation TS OK.
- Aperçu Propositions Services : plus d'onglet "Services inclus", nombre total de pages réduit d'1.
- PDF exporté : aucune page "Les services inclus dans votre offre" insérée après la page 3.
- Reload d'une ancienne proposition contenant `servicesInclus` : pas d'erreur (champ ignoré).
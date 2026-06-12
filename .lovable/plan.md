## Problème

Le tableau "Synthèse reprise" n'apparaît pas dans le preview multi-pages utilisé par le workflow (`RentalProposalPreview`), ni dans l'export PDF. Aujourd'hui, `Page9Reprise` n'est branchée que dans `QuotePreview` (un preview parallèle). De plus, le toggle "Afficher" du bloc Reprise réutilise `matriceData.showCoutLocatifAnnuel`, qui est déjà utilisé par une autre fonctionnalité (ligne "coût locatif annuel" sur la page Votre Offre).

## Plan

1. **Flag dédié `showReprise`**
   - Ajouter `showReprise: boolean` dans `MatriceData` (store) avec valeur par défaut `false`, persistance et rehydratation.
   - `RepriseTab.tsx` : le Switch "Afficher" pilote `showReprise` au lieu de `showCoutLocatifAnnuel`. Le toggle ne s'active que si au moins une ligne de reprise est saisie (sinon désactivé + tooltip).
   - `QuotePreview.tsx` : remplacer la condition par `matriceData.showReprise`.

2. **Insertion d'une page Reprise après la page 4 dans le preview principal** (`RentalProposalPreview.tsx`)
   - Calculer `extraRepriseePages = matriceData.showReprise ? 1 : 0`.
   - `totalPages = templatePages + extraInvestPages + extraServicesPages + extraReprisePages`.
   - Dans `renderCurrentPage`, insérer la page Reprise juste après la dernière page invest (`investPageEnd + 1`) avant le bloc Services. Décaler `servicesPageStart` et le calcul `realPageNum` en conséquence (ajouter `extraReprisePages`).
   - Nouveau `renderReprisePage()` qui réutilise le markup de `Page9Reprise` (tableau Total HT / TVA / Total TTC + lignes descriptions) dans le même conteneur A4 que les autres pages preview (style `aspect-[210/297]`, marges PDF standard).

3. **Export PDF** (`RentalProposalExport.tsx`)
   - Ajouter une section HTML "page-break-before" générée quand `matriceData.showReprise === true`, insérée après le bloc Page 4 (Vos investissements / Votre offre).
   - Réutiliser `computeRepriseGrades(repriseData.grades, repriseData.marge)` pour produire le même tableau de synthèse.
   - Respecter les marges latérales 5% et la mise en page neutre (en-tête noir, totaux Total TTC sur fond noir).

4. **Numérotation**
   - Le footer "Page X/Y" doit refléter la nouvelle page (déjà géré par `totalPages`).
   - Vérifier l'absence de régression sur les décalages servicesPage / lastTemplatePageNum (signature reste sur la dernière page).

## Hors scope

- Aucune modification des calculs Reprise (`reprise-calculations.ts`).
- Aucune modification des onglets Invest / Base Taux.
- Pas d'édition possible du contenu Reprise depuis le preview (lecture seule, comme Page9Reprise actuelle).

## Validation

- Saisir des lignes Reprise + activer "Afficher" → la pagination passe de 7 à 8, la page Reprise apparaît en position 5 (après les pages invest), les pages suivantes (Services, Bon pour accord) restent intactes.
- Désactiver "Afficher" → retour à 7 pages, plus de page Reprise.
- Export PDF (`window.print()`) : la page Reprise s'imprime au bon endroit avec saut de page propre.

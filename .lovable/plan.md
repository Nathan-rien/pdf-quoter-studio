# Ajustements Reprise

## 1. Retirer les toggles "Afficher prix Investissement" et "Afficher montant Offre"
Fichier : `src/components/rental-proposal/RepriseTab.tsx` (lignes 52–68)
- Supprimer les deux blocs `<div>` contenant les `Switch` `reprise-show-prices` et `reprise-show-offer` dans le header du bloc "Lignes produits (Reprise)".
- Conserver le bouton "Ajouter".
- Les champs `repriseShowPrices` / `repriseShowOffer` du store ne sont pas touchés (aucun risque côté données).

## 2. Retirer la colonne "Quantités" du tableau "Synthèse reprise" (vue Données)
Fichier : `src/components/rental-proposal/RepriseTab.tsx` (lignes 308–376)
- Header : supprimer `<TableHead>Quantités</TableHead>`.
- Lignes Total HT / TVA / Total TTC : supprimer les `<TableCell />` correspondant à la colonne Quantités.
- Lignes descriptions ajoutées : supprimer la `<TableCell>` contenant l'`Input` quantité (le champ `quantite` reste stocké pour rester compatible avec l'export PDF qui l'affiche toujours).

## 3. Déplacer la page Reprise après "Les services inclus dans votre offre"

### Export PDF — `src/components/rental-proposal/RentalProposalExport.tsx`
- Lignes 609–610 : remplacer l'insertion dans `extraPagesAfter[4]` par `extraPagesAfter[5]`, de sorte que la page Reprise soit ajoutée après les pages Services (page 5 + chunks).
- Vérifier que `extraPagesAfter[5]` (utilisé pour les chunks Services à la ligne 752) est concaténé et non écrasé : utiliser `if (!extraPagesAfter[5]) extraPagesAfter[5] = []; extraPagesAfter[5].push(repriseHTML);` et s'assurer que cet ajout se fait APRÈS le bloc Services (ou que la fusion préserve l'ordre Services puis Reprise). Déplacer le bloc Reprise sous le bloc Services dans le fichier pour garantir l'ordre.

### Prévisualisation — `src/components/rental-proposal/RentalProposalPreview.tsx`
- Lignes 1539–1557 : déplacer la page Reprise depuis "juste après Invest" vers "juste après la dernière page Services".
- Nouveau calcul :
  - `servicesPageStart = 5 + extraInvestPages` (la reprise ne décale plus le début services).
  - `servicesPageEnd = servicesPageStart + extraServicesPages`.
  - `reprisePageNum = extraReprisePages > 0 ? servicesPageEnd + 1 : -1`.
  - Pages suivantes : `realPageNum = currentPreviewPage - extraInvestPages - extraServicesPages - extraReprisePages`.
- Retirer `+ extraReprisePages` de `servicesPageStart`.

Aucun changement de logique métier, calculs ou schéma de données.

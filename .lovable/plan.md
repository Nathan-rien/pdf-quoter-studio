## Objectif

Pour chaque contrat Location, afficher automatiquement le **loyer mensuel HT** et le **loyer trimestriel HT** issus de la **proposition validée associée** (via `contract.proposal_id → proposal_exports`), au lieu d'un champ manuel qui reprenait à tort le montant d'investissement.

## Comportement cible

- Ligne contrat : affichage lecture seule "Loyer mensuel HT : X € · Loyer trimestriel HT : Y €" à côté du badge de périodicité. Le badge Mensuel/Trimestriel continue de piloter quel montant est mis en avant.
- La valeur provient toujours de la 1re proposition retenue dans `proposal_exports.proposal_state` (même calcul que la matrice : `getAllProposalsCalculations()[0].calculations.loyerMensuel`), le trimestriel étant `mensuel × 3` via `calculateLoyerTrimestriel`.
- Contrats **manuels** (sans `proposal_id` exploitable) ou anciens contrats dont la proposition n'a plus de `proposal_state` : afficher "—" et conserver un petit champ éditable "Loyer mensuel HT" pour saisir la valeur à la main (stockée dans `contracts.monthly_rent_ht`, déjà existant).
- Suppression du champ éditable "Loyer trimestriel HT (€)" actuel, qui prête à confusion.

## Détails techniques

1. `src/hooks/useContracts.ts`
   - Ajouter un hook `useContractProposalRent(proposalId)` : `SELECT proposal_state FROM proposal_exports WHERE id = proposalId` puis calcule le loyer mensuel via `getAllProposalsCalculations` (importé de `@/lib/rental-calculations` — vérifier la signature exacte, sinon reproduire le calcul depuis `proposal_state.proposals[0]` + `matriceData`). Mise en cache React Query par `proposalId`.
   - Ne pas modifier la table `contracts`. `monthly_rent_ht` reste utilisé uniquement comme fallback manuel.

2. `src/components/contracts/ContractRow.tsx`
   - Appeler le nouveau hook avec `contract.proposal_id` (skip si contrat manuel).
   - Calculer `mensuel = proposalRent ?? contract.monthly_rent_ht ?? null` et `trimestriel = mensuel != null ? mensuel * 3 : null`.
   - Remplacer le bloc "Loyer trimestriel HT (€)" par l'affichage lecture seule + champ manuel uniquement si `proposalRent` est absent.
   - Adapter `displayedAmount` (badge Mensuel/Trimestriel) pour utiliser `mensuel`/`trimestriel` dérivés.

3. Nettoyage lié aux changements précédents
   - `RentalProposalExport.tsx` : conserver l'écriture de `loyer_mensuel_ht` (utile comme cache/backfill futur), mais ce champ n'est plus la source d'affichage.
   - `ValidateProposalButton.tsx` / `HistoryView.tsx` : garder le passage de `monthlyRentHt` pour prérempler `contracts.monthly_rent_ht` à la création, en cachet de secours si la proposition est supprimée plus tard.

## Hors périmètre

- Pas de modification de schéma DB.
- Pas de recalcul en masse pour les contrats existants : la valeur est calculée à la volée à chaque affichage.


## Problèmes identifiés

1. **Loyers cumulés sous-évalués** (Vue globale + Contrats Location + Contrats Services)
   - `contracts.monthly_rent_ht` / `quarterly_rent_ht` ne sont renseignés que pour 2 contrats sur 13.
   - Les 11 autres contrats calculent leur loyer côté client via `useContractProposalRent`, à partir de `proposal_exports.loyer_mensuel_ht`, sinon via `calculateAllMatriceValues(proposal_state)`.
   - Les vues stats ignorent ce fallback → la somme est fausse (aujourd'hui 1 256 € affichés au lieu du vrai cumul).

2. **KPI « Investissement cumulé HT » (Vue globale)** = somme des 269 propositions, affiché à côté des KPIs Contrats. Libellé ambigu → doit distinguer Propositions vs Contrats.

## Correctifs

### 1. Nouveau helper de loyers réels par contrat

Créer `src/lib/contract-rent-aggregation.ts` exportant une fonction `useAggregatedContractRents(contracts)` (React Query) qui :

- Récupère en un seul `SELECT` `proposal_exports.id, proposal_state, loyer_mensuel_ht, montant_investissement` pour tous les `contract.proposal_id` non-nuls.
- Pour chaque contrat, applique la même logique que `useContractProposalRent` :
  - Prend `loyer_mensuel_ht` s'il existe.
  - Sinon, pour un `service-proposal` : utilise `totalServicesHt` / `montant_investissement` + ajustement `paymentFrequency`.
  - Sinon, appelle `calculateAllMatriceValues(...)` sur `proposals[0]` + options sélectionnées.
- Fallback final : `contracts.monthly_rent_ht` / `quarterly_rent_ht` s'ils existent.
- Renvoie `Map<contractId, { monthly, quarterly }>` + totaux `monthlySum` / `quarterlySum`.

### 2. `ContractsStatsView.tsx`

- Consommer `useAggregatedContractRents(contracts)`.
- Remplacer `contractMonthly(c)` / `contractQuarterly(c)` par la lecture du `Map`.
- Recalculer `monthlySum`, `quarterlySum`, `topClients`.
- Afficher un `Loader2` tant que l'agrégation charge (déjà en place pour `isLoading` — étendre au chargement des rents).

### 3. `GlobalStatsView.tsx`

- Consommer `useAggregatedContractRents([...locationContracts, ...serviceContracts])` pour un `quarterlySum` correct.
- Remplacer la KPI « Investissement cumulé HT » (aujourd'hui 6.5M€ toutes propositions) par **« Investissement contrats HT »** = `sum(contracts.amount_ht ?? 0)` sur les 13 contrats validés. Cohérent avec « Contrats totaux ».
- Optionnel : ajouter un sous-titre « propositions : 6 597 199 € » sous la KPI Propositions totales pour ne pas perdre l'info globale.

### 4. Vérification

Après implémentation, exécuter en base :
```sql
-- Sanity check : cumul attendu par tab
SELECT proposal_type, sum(amount_ht) FROM contracts GROUP BY proposal_type;
```
et comparer le total « Investissement contrats HT » (≈ 201 586 €) à ce que la vue affiche. Pour les loyers, comparer un contrat au hasard côté ligne contrat (déjà correct) vs cumul stats.

## Détails techniques

- Aucun changement de schéma DB — tout côté client, en réutilisant la logique existante de `useContractProposalRent` pour rester cohérent avec l'affichage ligne à ligne.
- Batch d'une seule requête Supabase (`in('id', [...ids])`) au lieu d'une requête par contrat.
- Mémoisation des résultats via React Query, clé `['contract-rents', ids.sort().join(',')]`.
- La logique de `calculateAllMatriceValues` étant synchrone, l'agrégation peut être calculée dans `queryFn` (pas de rendu bloquant).

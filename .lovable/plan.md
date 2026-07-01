## Problème

Dans la fiche contrat Location, le champ **"Loyer trimestriel HT (€)"** est prérempli avec **9500 × 3** parce que le contrat n'a jamais reçu le vrai loyer mensuel : à la validation, on lui passe `montant_investissement` (9500 €) dans `amount_ht`. Ensuite `ContractRow` utilise `contract.amount_ht` en fallback quand `monthly_rent_ht` est vide, d'où l'affichage `9 500,00 € (mensuel)` dans l'en-tête et `28 500` dans le champ trimestriel.

## Correctif

### 1. Persister le vrai loyer mensuel dès l'export d'une Proposition Location

- Migration : ajouter `loyer_mensuel_ht numeric` sur `public.proposal_exports` (nullable).
- `src/components/rental-proposal/RentalProposalExport.tsx` : lors de l'insert dans `proposal_exports`, calculer le loyer mensuel de la 1ʳᵉ proposition via `calculateAllMatriceValues(...)` (mêmes inputs que la matrice) et écrire `loyer_mensuel_ht`.

### 2. Transmettre ce loyer à la création de contrat

- `src/components/history/HistoryView.tsx` : sélectionner `loyer_mensuel_ht`, l'ajouter à l'interface interne, le passer à `<ValidateProposalButton monthlyRentHt=… />`.
- `src/components/history/ValidateProposalButton.tsx` : accepter `monthlyRentHt`, l'inclure dans l'appel `validateProposal.mutateAsync({... monthly_rent_ht })`.
- `src/hooks/useContracts.ts` (`useValidateProposal`) : accepter `monthly_rent_ht` et l'insérer dans `contracts`. Garder `amount_ht` inchangé (reste = investissement pour compat historique/stats).

### 3. Nettoyer l'affichage dans la fiche contrat

`src/components/contracts/ContractRow.tsx` :
- Retirer le fallback `contract.amount_ht` pour le loyer :
  - `effectiveRent` = `contract.monthly_rent_ht` uniquement.
  - Valeur initiale du champ "Loyer trimestriel HT" = `calculateLoyerTrimestriel(monthly_rent_ht)` si présent, sinon vide.
  - En-tête : n'afficher le badge `€ (mensuel/trimestriel)` que si `monthly_rent_ht` est renseigné.
- Résultat : les contrats existants (sans `monthly_rent_ht`) affichent un champ vide à compléter au lieu du faux montant. Les nouveaux contrats validés depuis l'historique sont préremplis avec le vrai loyer.

### 4. Backfill léger (optionnel, à confirmer)

Pour les contrats déjà validés depuis un export qui possédait `proposal_state`, on peut, dans une migration data séparée, recalculer et remplir `contracts.monthly_rent_ht`. Non inclus par défaut pour éviter d'écraser des saisies manuelles ; à faire seulement si vous le demandez.

## Fichiers modifiés

- migration Supabase (colonne `loyer_mensuel_ht`)
- `src/components/rental-proposal/RentalProposalExport.tsx`
- `src/components/history/HistoryView.tsx`
- `src/components/history/ValidateProposalButton.tsx`
- `src/hooks/useContracts.ts`
- `src/components/contracts/ContractRow.tsx`

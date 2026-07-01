## Contrats Services — parité avec Contrats Location

Aligner **ServiceContractsView** avec **ContractsView** (Location) et masquer le partenaire financier.

1. Remplacer `ServiceContractsView.tsx` par la même structure que `ContractsView.tsx` :
   - Bouton **⚡ Créer contrat rapide** (via `useCreateQuickContract('service')`) avec expansion auto de la nouvelle ligne.
   - Regroupement "Contrats rapides" en tête (même logique `is_quick_contract → __quick__`).
   - Barre de filtres : Enseigne / ~~Partenaire~~ / Commercial (le filtre Partenaire est retiré côté Services).
   - Badge compteur "filtrés / total", bouton "Réinitialiser".
   - Conserver le bouton existant "Créer un contrat manuellement" et l'alerte de renouvellement.

2. Masquer **Partenaire financier** dans le contexte Services :
   - Ajouter une prop `hideFinancialPartner?: boolean` à `ContractRow.tsx`.
   - Quand `true` : ne pas rendre le champ "Partenaire financier" (form + header) et exclure `financial_partner` du payload `handleSave`.
   - `ServiceContractsView` passe `hideFinancialPartner` à chaque `<ContractRow>`.

## Historique Services — bouton "Charger"

3. Ajouter dans `serviceProposalStore.ts` une action `loadFromExport(snapshot)` (calquée sur `rentalProposalStore.loadFromExport`) qui restaure `clientData`, `productLines`, `investData`, `selectedRentalTemplateId`, `serviceOptionsState`, `commercialInfo`, etc. depuis le snapshot JSONB.

4. Modifier `ServiceHistoryView.tsx` :
   - Charger aussi le champ `proposal_state` (au moins l'existence) et ajouter `has_proposal_state` au type.
   - Ajouter un bouton "Charger" (icône `RotateCcw`) identique à `HistoryView.tsx`, avec `AlertDialog` de confirmation.
   - Handler `handleLoadProposal` qui lit `proposal_state`, appelle `useServiceProposalStore.getState().loadFromExport(...)` puis navigue vers la vue `service-proposal` (via une callback `onLoadProposal` exposée et branchée dans `Index.tsx`).

5. Dans `Index.tsx`, brancher `<ServiceHistoryView onLoadProposal={...} />` : appelle `loadFromExport` du store services puis `setCurrentView('service-proposal')`.

## Détails techniques

- `useCreateQuickContract` accepte déjà `proposalType` — pas de migration.
- Aucun changement de schéma DB.
- La logique `hideFinancialPartner` reste purement présentation dans `ContractRow` (le champ DB reste, simplement invisible/non modifié en Services).
- `loadFromExport` service : copier fidèlement le pattern rental (reset store + set des slices présents dans snapshot, tolérant aux champs absents).

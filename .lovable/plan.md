## Objectif
Retirer les colonnes VUN et VTN de l'onglet Invest dans Propositions Services, et supprimer leur affichage dans le PDF/aperçu généré.

## Modifications

### 1. `src/components/service-proposal/ServiceProposalInvestStep.tsx`
- Retirer les colonnes VUN et VTN de l'en-tête et des lignes (grid passe de `[auto_1fr_80px_100px_100px_auto]` à `[auto_1fr_80px_auto]`).
- Retirer les inputs VUN et le calcul/affichage VTN par ligne.
- Retirer le pied de tableau "Total ... € HT".
- Conserver `qty` (Nb) et `designation`. Les champs `vun`/`vtn` restent forcés à 0 dans le state pour compatibilité avec le type `InvestLine`.

### 2. `src/components/service-proposal/ServiceProposalPreview.tsx` et `ServiceProposalExport.tsx`
- Dans le rendu de la zone dynamique `service_invest_table` (ou équivalent), retirer les colonnes VUN, VTN et la ligne Total du tableau injecté dans le template.
- Ne conserver que Désignation + Nb.

### 3. Store `src/stores/serviceProposalStore.ts`
- Aucun changement de schéma. Les champs `vun`/`vtn` restent dans le type pour rétro-compatibilité des snapshots existants, mais ne sont plus édités ni affichés.

## Vérifications
- Onglet Invest : uniquement Désignation + Nb visibles.
- Aperçu et PDF : tableau Invest sans colonnes VUN/VTN ni total HT.
- Rechargement d'anciennes propositions : pas d'erreur.

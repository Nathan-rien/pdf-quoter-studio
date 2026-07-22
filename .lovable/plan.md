## Contexte

Deux problèmes constatés lors de la conversion d'une proposition Services en contrat :

1. **Erreur "service_proposals_payment_mode_check"** : la contrainte SQL actuelle sur `service_proposals.payment_mode` n'autorise que `'prelevement'` et `'virement'`. Le mode `'allin'` (ajouté récemment dans l'UI) est refusé à l'enregistrement.
2. **Perte d'infos au passage en contrat** : `ValidateProposalButton` ne reprend que le client, le commercial et le montant. La durée, la date de mise en place et la périodicité (mensuel/trimestriel) saisies dans la proposition Services ne sont pas propagées vers le contrat créé.

Les deux sont indépendants — le "Allin" n'est pas la cause du 2e point — mais on corrige les deux ensemble.

## Correctifs

### 1. Migration Supabase
Mettre à jour la contrainte `service_proposals_payment_mode_check` pour inclure `'allin'` (`prelevement`, `virement`, `allin`). Drop + recreate.

### 2. `ValidateProposalButton` (contexte Service)
Avant l'insert du contrat, quand `proposalType === 'service'` :
- Récupérer `service_proposal_id` depuis `proposal_exports` (déjà fait plus bas dans le fichier — on le remonte au début).
- Charger `payment_frequency`, `contract_duration`, `start_date` depuis `service_proposals`.
- Les passer au payload du contrat créé :
  - `duration_months` ← `contract_duration`
  - `implementation_month` ← `start_date`
  - `payment_frequency` ← `payment_frequency`
- Recalculer/renseigner `monthly_rent_ht` et `quarterly_rent_ht` à partir du total services et de la durée (même formule que `useContractProposalRent`), pour que les champs "Loyers HT" du contrat soient pré-remplis eux aussi.

Aucun changement d'UI ni de flux : le contrat s'ouvre déjà pré-rempli avec les valeurs de la proposition.

### 3. Vérification
- Recréer un contrat depuis une proposition Services enregistrée avec "Allin" → plus d'erreur.
- Vérifier dans la vue Contrats Services que Durée, Date de mise en place, Périodicité et Loyers HT sont bien remplis.

# Contrat DENTALTEK : seuls 1 service sur 3 dans le contrat généré

## Ce qui se passe réellement

Vérifié en base :

- La proposition DENTALTEK enregistrée ne contient **qu'un seul service** (« Pack support Excellence », 250 €/mois).
- L'instantané de la proposition exportée (celui qui alimente la fiche du contrat que vous voyez à l'écran) contient bien **les 3 services** (Pack support Excellence, Pro-license office 365, Pro-Sauvegarde).

D'où l'écart : la fiche contrat affiche 3 services et 3 240 € (l'instantané), tandis que le PDF régénéré repart de la proposition enregistrée et n'affiche qu'un service et 3 000 €.

## Pourquoi la proposition a perdu 2 services

Les options « Nos Options » sont mémorisées dans le navigateur, sans lien avec la proposition ouverte :

- à l'ouverture d'une proposition, les options déjà présentes dans le navigateur sont conservées telles quelles au lieu d'être remplacées par celles de la proposition ;
- à l'enregistrement, la liste des services est réécrite à partir de ces options.

Résultat : après avoir travaillé sur une autre proposition, un simple enregistrement de DENTALTEK a écrasé ses 3 services par la liste résiduelle.

## Correctifs

1. **Recharger systématiquement les options de la proposition ouverte** : à l'ouverture d'une proposition, les options du navigateur sont remplacées par celles de la proposition (et vidées lors de la création d'une nouvelle proposition). Plus d'écrasement croisé.
2. **Ne plus perdre le détail des options** : enregistrer sur la proposition la liste complète des options (libellé, description, prix, prix affiché ou masqué, pack d'origine) et non plus seulement le libellé et le montant. Le contrat régénéré retrouve alors exactement le contenu du devis, y compris les descriptions et l'option Pro-Sauvegarde sans prix.
3. **Réparer DENTALTEK** : réinjecter dans la proposition les 3 services présents dans l'instantané de l'export, puis régénérer le PDF du contrat pour vérifier l'affichage des 3 lignes et du total 3 240 €.

## Détails techniques

- `src/stores/serviceProposalStore.ts` : `loadFromServiceProposal` seede `nosOptions` uniquement si le store est vide (`existingNos.length > 0 ? existingNos : …`) → toujours reconstruire depuis la proposition ; réinitialiser `nosOptions` sur `CreateForm`.
- `service_proposals` : nouvelle colonne `nos_options jsonb not null default '[]'` (aucun changement de politique d'accès). Écriture dans `buildPayload` (`ServiceProposalView.tsx`), lecture dans `loadFromServiceProposal` et dans `buildHtmlDataFromServiceProposal` (`src/lib/service-proposal-data-builder.ts`) avec repli sur `selected_services` pour les propositions existantes.
- `src/lib/service-contract-generator.ts` : inchangé dans sa logique (priorité à la ligne fraîche), il bénéficie du champ enrichi.
- Réparation ponctuelle : `update service_proposals set selected_services = <3 lignes de proposal_exports.proposal_state->'selectedServices'>, nos_options = <proposal_state->'nosOptions'> where id = 90612eb4-…`.

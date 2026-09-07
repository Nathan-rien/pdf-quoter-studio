# Numéro de facture dans les Propositions Services

## Objectif
Ajouter un champ « Numéro de facture » (un seul par proposition) dans l'onglet **Matériel** des Propositions Services, et l'afficher sur la page 3 du contrat/devis généré, sous le tableau « Matériel concerné ».

## Ce qui sera fait

1. **Base de données** : ajout d'une colonne `invoice_number` (texte, optionnelle) sur la table des propositions de services.

2. **Onglet Matériel** (`ServiceProposalInvestStep.tsx`) : ajout d'un champ de saisie « Numéro de facture » sous la liste du matériel, enregistré avec la proposition (chargement et sauvegarde inclus, y compris au rechargement d'une proposition existante).

3. **PDF / aperçu** (`service-proposal-html-generator.ts`) : dans la zone « Matériel concerné », affichage d'une ligne « N° de facture : XXX » sous le tableau, uniquement si le champ est renseigné. Le style reprend celui des autres encarts (même bandeau/typographie).

## Détails techniques
- Migration : `ALTER TABLE public.service_proposals ADD COLUMN invoice_number text;` (aucun changement de politique d'accès).
- Propagation du champ : `useServiceProposals` (type + mapping save/load), `serviceProposalStore` (champ + `loadFromServiceProposal` / `loadFromExport` / `resetAll`), `ServiceProposalView` (passage au formulaire Matériel et à l'enregistrement).
- Générateur HTML : extension de `renderInvestZone` pour injecter la ligne « N° de facture » sous le tableau quand la valeur existe.
- Vérification : build OK + contrôle visuel de la page 3 (aperçu et export PDF).

## Hors périmètre
- Pas de numéro de facture par ligne de matériel (choix validé : un seul champ par proposition).
- Pas d'affichage dans la vue Contrats de services (sauf demande ultérieure).

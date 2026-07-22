## Objectif

Dans le dialogue « Nouvelle intervention » / « Modifier l'intervention » du Planning Services, dès qu'un client (contrat) est sélectionné, afficher automatiquement les coordonnées client renseignées lors de la proposition Services associée (adresse, téléphone, email, contact opérationnel, sites d'intervention).

## Portée

Fichier : `src/components/technician-tracking/PlanningView.tsx` uniquement. Aucune modification back-end : les données existent déjà dans `service_proposals` (`client_address`, `client_email`, `client_phone`, `client_company`, `client_siret`, `operational_contact`, `site_addresses`) et sont liées aux contrats via `contracts.proposal_id` → `proposal_exports.service_proposal_id` (déjà utilisé ailleurs, cf. `useContractProposalOptions`).

## Changements

1. Étendre `contractsQ` (déjà chargé) pour inclure `proposal_id` afin de retrouver la proposition.
2. Ajouter une nouvelle query `useQuery(['pl-client-info', contractId])` dans `InterventionDialog`, déclenchée uniquement quand `contractId` est défini. Elle :
   - lit `contracts.proposal_id`
   - remonte au `service_proposal` correspondant (via `proposal_exports.service_proposal_id`)
   - renvoie `{ client_company, client_address, client_phone, client_email, operational_contact, site_addresses }`.
3. Sous le `<Select>` client, insérer un encart en lecture seule « Coordonnées client » affichant :
   - Société / SIRET
   - Adresse principale
   - Téléphone + email (cliquables `tel:` / `mailto:`)
   - Contact opérationnel (nom, rôle, téléphone, email) si présent
   - Liste des sites d'intervention (label + adresse) si présent
   - État de chargement / message « Aucune coordonnée renseignée » si vide.
4. Les champs restent purement informatifs (lecture seule) — aucun impact sur la mutation d'enregistrement de l'intervention.

## Détails techniques

- Réutiliser le style de badges/cartes déjà utilisé dans le dialogue (Tailwind, `bg-muted`, `text-xs`).
- Ne pas dupliquer la logique de résolution proposition → utiliser un petit helper local dans le fichier pour rester ciblé.
- Gérer les cas :
  - contrat sans `proposal_id` (ancien contrat rapide) → afficher « Aucune coordonnée liée à ce contrat ».
  - `operational_contact` / `site_addresses` peuvent être `null` ou tableaux vides.

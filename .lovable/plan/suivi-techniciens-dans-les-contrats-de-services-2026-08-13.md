# Suivi Techniciens dans les Contrats de services

Objectif : retrouver, directement dans la vue Contrats de services, les actions aujourd'hui disponibles uniquement dans Suivi Techniciens (planification et gestion des options/services).

## Ce qui sera ajouté

Dans le détail déplié d'un contrat de service, le bloc "Services & options de la proposition" devient un bloc "Services & interventions" qui affiche les vraies lignes de services du contrat (les mêmes que Suivi Techniciens) avec, pour chaque ligne :

- badge Réf. JAJA (avec édition)
- quota de tickets (X / Y) + bouton "Consommer 1 ticket"
- accès à l'historique de consommation
- bouton "Planifier" (ouvre la création d'intervention)
- édition (admin) : Réf. JAJA, tickets initiaux, tickets restants

En en-tête du bloc : bouton "Tout planifier" (même dialogue que dans Suivi Techniciens).

Le récapitulatif tarifaire actuel (prix par option et "Total Service HT") est conservé : les prix restent issus de la proposition, associés par libellé aux lignes de services quand c'est possible ; les options sans ligne de service correspondante restent affichées en lecture seule.

Si un contrat n'a encore aucune ligne de service (contrat rapide ou proposition sans services), le bloc affiche un message et un bouton "Ajouter un service" permettant de créer une ligne manuellement (libellé + Réf. JAJA + tickets).

## Navigation

Le bouton "Planifier" d'une ligne bascule vers l'écran Planning Services avec l'intervention pré-remplie (même mécanisme que depuis Suivi Techniciens). "Tout planifier" ouvre le dialogue de planification groupée sans quitter la vue Contrats.

## Détails techniques

- Extraction des parties réutilisables de `TechnicianTrackingView.tsx` vers un composant partagé `src/components/technician-tracking/ServiceReferencesPanel.tsx` (liste des `client_service_references` d'un contrat, édition, consommation de ticket via la fonction `consume_ticket`, dialogue d'historique, `BulkPlanDialog`). `TechnicianTrackingView` l'utilise ensuite pour chaque contrat, sans changement de comportement.
- `ContractRow.tsx` : pour `proposal_type = 'service'`, intégration du panneau, en gardant les prix issus de `useContractProposalOptions` (association par libellé).
- Nouvelle prop `onPlanIntervention` remontée depuis `ContractRow` → `ServiceContractsView` → `Index.tsx`, qui réutilise le `planningPrefill` existant pour ouvrir Planning Services.
- Création manuelle d'une ligne : insertion dans `client_service_references` (contract_id, service_label, erp_reference, tickets). Aucune modification de schéma ni de politique d'accès n'est nécessaire.
- Invalidation partagée des requêtes `tt-refs` / `pl-refs` pour que Suivi Techniciens, Planning et Contrats restent synchronisés.

# Options avec / sans intervention

Ajouter un indicateur "Avec intervention" sur chaque option et pack du catalogue Options Services. Seules les options cochées peuvent être planifiées dans le Planning Services ; les autres restent visibles dans le contrat mais sans possibilité de planification.

## Catalogue Options Services (Administration)

- Nouvelle case à cocher "Avec intervention" sur chaque carte option/pack, à côté du statut actif.
- Valeur par défaut : cochée (avec intervention), pour ne rien changer aux options existantes.
- L'état est enregistré en base et synchronisé comme les autres champs de la carte.

## Contrats de services / Suivi Techniciens

- Chaque ligne de service du contrat hérite du réglage de l'option au moment de la validation de la proposition.
- Ligne avec intervention : comportement actuel (bouton "Planifier", inclusion dans "Tout planifier").
- Ligne sans intervention : badge discret "Sans intervention", pas de bouton "Planifier", exclue de "Tout planifier".
- Les services ajoutés manuellement à un contrat proposent la même case à cocher (cochée par défaut) et restent modifiables par un administrateur.

## Planning Services

- Le sélecteur de service d'une intervention (nouvelle intervention, planification groupée) ne liste que les services marqués avec intervention.
- Les interventions déjà planifiées ne sont pas supprimées si une option est décochée après coup ; elle devient simplement non planifiable pour les nouvelles.

## Détails techniques

- Migration : `options_services.requires_intervention boolean not null default true` et `client_service_references.requires_intervention boolean not null default true`.
- `src/types/options-admin.ts` + `src/stores/optionsAdminStore.ts` : champ `requiresIntervention` dans le mapping DB <-> store.
- `src/components/options-admin/OptionsServiceCard.tsx` : case à cocher.
- `src/lib/technician-tracking.ts` : recopie du flag depuis `options_services` lors du seed des références.
- `src/components/technician-tracking/ServiceReferencesPanel.tsx` : masquage du bouton "Planifier", badge, filtrage du bulk plan, case à cocher à l'ajout manuel et en édition (admin).
- `src/components/technician-tracking/PlanningView.tsx` et `BulkPlanDialog.tsx` : filtrage des références planifiables.

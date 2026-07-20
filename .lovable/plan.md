## Objectif
Ajouter, dans la vue **Suivi Techniciens**, un bouton "Tout planifier" au niveau de chaque bloc client, permettant de créer en une seule action des interventions pour plusieurs services à la **même date/heure**, avec le **même technicien** et la **même durée**.

## UX

- Nouveau bouton `Tout planifier` (icône calendrier+) dans l'en-tête de chaque carte client, à côté de la date de validation.
- Ouvre un dialogue `BulkPlanDialog` :
  - En-tête : nom du client.
  - Liste des services actifs du client avec cases à cocher (toutes cochées par défaut), affichant `service_label` + badge JAJA.
  - Champs communs : Date & heure (`datetime-local`), Durée (min, défaut 60), Technicien (input texte pré-rempli avec l'utilisateur courant), Commentaire (optionnel).
  - Boutons : `Annuler`, `Planifier N intervention(s)` (compteur dynamique, désactivé si 0 service coché).
- Toast de succès : "N interventions planifiées". Invalide les queries `pl-interventions` et le suivi.

## Logique

- Pour chaque service coché, insertion d'une ligne `intervention_planning` avec la même `date_intervention`, `duree_estimee_minutes`, `technician_name`, `technician_user_id`, `commentaire`, `statut='prevue'`, `created_by=user.id`, `reference_id` = id du service.
- Insertion en un seul `supabase.from('intervention_planning').insert([...rows])`.
- Aucun changement de schéma DB, aucune nouvelle RLS (les policies existantes couvrent l'insertion multi-lignes).

## Fichiers touchés

- `src/components/technician-tracking/TechnicianTrackingView.tsx` : ajout du bouton dans l'en-tête de chaque bloc client + intégration du dialogue.
- `src/components/technician-tracking/BulkPlanDialog.tsx` *(nouveau)* : formulaire de planification groupée, mutation d'insertion multi-lignes, invalidations React Query.

Aucun impact sur `PlanningView.tsx` ni sur la base de données.

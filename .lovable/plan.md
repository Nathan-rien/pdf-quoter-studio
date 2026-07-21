## Corrections demandées

### 1. Afficher la Réf JAJA sur les contrats Services
Dans le bloc « Services & options de la proposition » de la vue contrat (`ContractRow.tsx`), la référence JAJA n'est pas remontée aujourd'hui.

- `src/hooks/useContracts.ts` — `useContractProposalOptions` : inclure `erp_reference` dans le mapping (lecture depuis `nosOptions[].erp_reference` / `optionsServices[].erp_reference`, avec fallback sur le catalogue `options_services` via `option_id` si absent dans le snapshot).
- `src/components/contracts/ContractRow.tsx` : afficher un badge « JAJA : xxx » (ou « JAJA : non renseigné » en muted) à côté du nom de chaque option listée.

### 2. Suivi Technicien : bien reprendre la Réf JAJA
Actuellement `src/lib/technician-tracking.ts` récupère `erp_reference` uniquement via le catalogue `options_services` (match par `option_id`). Si l'option de la proposition a une Réf JAJA saisie directement (override) ou si le lien catalogue est perdu, le badge reste « non renseigné ».

- `src/lib/technician-tracking.ts` : lors de la construction de `client_service_references`, prioriser `erp_reference` provenant de l'option de la proposition (snapshot `nosOptions[].erp_reference`), puis fallback catalogue, puis valeur déjà stockée en base sur `client_service_references.erp_reference`.
- S'assurer que la vue `TechnicianTrackingView.tsx` continue d'afficher ce champ (déjà OK — badge ligne 290).

### 3. Nouvelle intervention : saisir la durée en heures
Aujourd'hui le champ demande une valeur en minutes.

- `src/components/technician-tracking/PlanningView.tsx` (form « Nouvelle intervention ») : renommer le label en **« Durée (heure) »**, input `type="number"` `step=0.25` `min=0.25`, et convertir vers/depuis minutes lors du save (stockage inchangé : `duree_estimee_minutes = heures * 60`).
- `src/components/technician-tracking/BulkPlanDialog.tsx` : même changement (label + conversion) pour cohérence.

## Détails techniques
- Type `ContractProposalOption` étendu avec `erp_reference: string | null`.
- Aucune migration DB nécessaire (les champs existent déjà dans `options_services`, `client_service_references`, et dans le snapshot JSON).
- Pas de changement de logique métier au-delà de l'affichage et de l'unité d'entrée.

Objectif: corriger définitivement le retour des Jalons à leur position initiale et rendre le drag & drop cohérent avec la hiérarchie voulue: **Jalon > Projet > Tâche > Sous-tâche**.

Constat confirmé dans le code actuel:
1) Le DnD est géré dans **une seule liste mixte** (`milestone/project/task`). Quand on dépose un jalon sur des lignes projet/tâche, l’ordre des jalons peut rester inchangé (no-op), donc visuellement il “revient”.
2) La migration précédente a changé le schéma mais **pas la donnée métier**: `gantt_milestones.project_id` contient encore l’ancien lien, et la majorité des `gantt_projects.milestone_id` sont `NULL`. La hiérarchie reste partiellement inversée.

Plan de correction

1. Migration de rattrapage (données + structure)
- Fichier: nouvelle migration SQL.
- Actions:
  - Backfill: copier l’ancien lien `gantt_milestones.project_id -> gantt_projects.milestone_id`.
  - Créer un jalon technique “Sans jalon” (si nécessaire) et y rattacher tous les projets `milestone_id IS NULL`.
  - Passer `gantt_projects.milestone_id` en `NOT NULL` pour forcer la hiérarchie parentale.
  - Supprimer la colonne legacy `gantt_milestones.project_id` (source d’ambiguïté).
- Résultat: plus aucun projet racine hors jalon, modèle univoque.

2. Refactor DnD sidebar en listes “scope par niveau”
- Fichier: `src/components/gantt/GanttSidebar.tsx`.
- Actions:
  - Remplacer la liste draggable globale par des droppables séparés:
    - `milestones-root` (jalons),
    - `projects-in-{milestoneId}` (projets d’un jalon),
    - `tasks-in-{projectId}` (tâches d’un projet).
  - Garder sous-tâches non-draggables (comme aujourd’hui) ou scope dédié ensuite.
- Résultat: indices DnD fiables, plus de collisions entre niveaux.

3. Refaire `handleDragEnd` avec routage par `droppableId`
- Fichier: `src/components/gantt/GanttView.tsx`.
- Actions:
  - Si `source/destination` dans `milestones-root` => `reorderMilestones`.
  - Si dans `projects-in-*` => reorder local + si changement de conteneur: `moveProjectToMilestone` puis reorder source/destination.
  - Si dans `tasks-in-*` => `reorderTasks` (et garder le scope projet).
  - Si drop invalide/no-op => message explicite (pas de silence).
- Résultat: comportement prédictible, sans “snap back” fantôme.

4. Solidifier les mutations de tri côté hook data
- Fichier: `src/hooks/useGanttData.ts`.
- Actions:
  - Uniformiser toutes les fonctions reorder/move avec:
    - optimistic update,
    - rollback complet en erreur,
    - `try/finally` sur `reorderingRef`,
    - retour booléen fiable.
  - Déclencher un refresh contrôlé après succès quand nécessaire.
- Résultat: état local et backend restent synchronisés.

5. Nettoyage UI hiérarchique
- Fichier: `src/components/gantt/GanttView.tsx`, `ProjectDialog.tsx`.
- Actions:
  - Retirer l’affichage des “projets racine” (plus de bloc “Non rattachés”).
  - Projet toujours rattaché à un jalon (champ jalon obligatoire en édition/création, avec valeur valide).
- Résultat: le jalon devient réellement l’élément principal.

Section technique (résumé)
```text
Avant:
[Liste DnD mixte unique]
Milestone + Project + Task dans un seul index global

Après:
[DnD scindé par conteneur]
- milestones-root
  - projects-in-{milestoneId}
    - tasks-in-{projectId}
```

Critères d’acceptation
- Un jalon peut être déplacé en 1ère position et **y rester** après refresh.
- Aucun retour visuel à la position initiale sur drop valide.
- Tous les projets sont sous un jalon (plus d’inversion de hiérarchie).
- Aucun warning/erreur DnD en console lors des déplacements.

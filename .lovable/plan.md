
Objectif: rendre le drag & drop réellement opérationnel pour Projets, Tâches et Jalons (sans retour à la position initiale).

1) Corriger la cause structurelle (scroll imbriqué qui perturbe DnD)
- Fichiers: `src/pages/Index.tsx`, `src/components/gantt/GanttSidebar.tsx` (et éventuellement le conteneur Gantt dans `GanttView.tsx`).
- Actions:
  - Supprimer la configuration qui crée plusieurs parents scrollables pour la zone DnD.
  - Garder un seul conteneur de scroll pour la liste draggable (sidebar Gantt).
  - Mettre le layout Gantt en hauteur contrainte + overflow cohérent.
- Résultat attendu:
  - Disparition du warning `unsupported nested scroll container`.
  - Calculs de drop stables.

2) Refaire la logique `handleDragEnd` pour éviter les “no-op silencieux”
- Fichier: `src/components/gantt/GanttView.tsx`.
- Problème actuel:
  - Le drop est souvent ignoré car trop dépendant du type exact de la ligne cible (`destRow.type`), donc l’item revient visuellement.
- Nouvelle logique:
  - Utiliser `source.index` / `destination.index` pour créer un ordre “post-drop” global des lignes draggables.
  - Puis dériver l’ordre métier:
    - Projet: extraire l’ordre des projets et appeler `reorderProjects(...)`.
    - Tâche/Jalon: extraire l’ordre mixte (tâches + jalons) du projet source et appeler `reorderProjectChildren(...)`.
  - Éviter les retours silencieux: si drop invalide, message explicite (toast) au lieu de rien faire.

3) Uniformiser le comportement Tâches/Jalons dans un même projet
- Fichier: `src/components/gantt/GanttView.tsx`.
- Actions:
  - Faire passer Tâches **et** Jalons par le même pipeline de tri mixte (déjà partiellement présent via `reorderProjectChildren`).
  - Éviter les cas où une tâche ne bouge pas car déposée sur un jalon (ou inversement).
- Résultat attendu:
  - Déplacement fluide entre tâches et jalons d’un même projet, persistant après refresh.

4) Solidifier les fonctions de reorder côté data
- Fichier: `src/hooks/useGanttData.ts`.
- Actions:
  - Sécuriser `reorderingRef` avec `try/finally` pour éviter les états bloqués.
  - Conserver update optimiste + rollback en erreur.
  - Retourner un booléen de succès cohérent pour que la vue sache si l’action a réellement été appliquée.
- Résultat attendu:
  - Plus de faux succès, moins de comportements “ça revient en arrière”.

5) Vérification ciblée (fin de correctif)
- Cas à tester:
  - Déplacer un projet en le déposant sur différentes lignes.
  - Déplacer une tâche avant/après un jalon dans le même projet.
  - Déplacer un jalon avant/après une tâche.
  - Rafraîchir la page et vérifier la persistance de l’ordre.
  - Confirmer la disparition du warning DnD en console.
- Critère d’acceptation:
  - Chaque drop valide déclenche bien une mise à jour d’ordre persistée, sans retour visuel à l’ancienne position.

Hypothèse fonctionnelle (pour ce correctif):
- Le drag & drop réordonne à l’intérieur du périmètre existant (projets entre eux, enfants dans leur projet).
- Le changement d’appartenance d’une tâche/jalon vers un autre projet n’est pas inclus dans ce correctif (peut être traité ensuite si souhaité).

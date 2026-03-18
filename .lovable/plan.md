

## Plan : Axes principaux comme séparateurs visuels + DnD universel

### Diagnostic

Le DnD ne fonctionne pas car la liste est construite hiérarchiquement (milestone → project → task → subtask) et le handler `handleDragEnd` tente de recalculer les relations parent-enfant à chaque drop. De plus, `gantt_projects.milestone_id` est `NOT NULL`, ce qui force chaque projet à être rattaché à un jalon.

L'utilisateur veut des **Axes = titres de section visuels**, librement positionnables, sans lien avec les projets en base.

### Architecture cible

```text
Avant (hiérarchique) :             Après (liste plate) :
Milestone A                        [Axe] Développement commercial
  ├─ Project 1                     [Projet] Structuration des offres
  │   ├─ Task 1.1                  [Tâche] Définir le set documentaire
  │   └─ Task 1.2                  [Axe] Cybersécurité
  └─ Project 2                     [Projet] Offre de cybersécurité
Milestone B                        [Projet] Landing pages
  └─ Project 3                     [Tâche] Recueil du besoin
```

Tout est ordonné par un seul champ `global_sort_order`. Le DnD réécrit juste cet ordre.

### 1. Migration base de données

- `gantt_projects.milestone_id` : rendre **nullable** (les projets ne dépendent plus d'un axe)
- Ajouter `global_sort_order integer NOT NULL DEFAULT 0` sur les 4 tables (`gantt_milestones`, `gantt_projects`, `gantt_tasks`, `gantt_subtasks`)
- Initialiser les `global_sort_order` existants à partir des `sort_order` actuels

### 2. `useGanttData.ts` — Refonte de l'ordering

- Fusionner les 4 listes en une seule liste triée par `global_sort_order`
- Nouveau helper `reorderAll(orderedItems: {type, id}[])` qui met à jour `global_sort_order` sur les 4 tables en batch
- Supprimer `reorderMilestones`, `reorderProjects`, `reorderTasks`, `reorderSubtasks` (remplacés par `reorderAll`)
- Supprimer `moveProjectToMilestone` (plus de lien)
- Simplifier `deleteMilestone` : supprimer juste la ligne milestone, pas les projets/tâches

### 3. `GanttView.tsx` — Liste plate

- Construire `rows` comme une liste plate triée par `global_sort_order` (plus de boucles imbriquées milestone → project → task)
- Supprimer `expandedMilestones`, `expandedProjects`, `expandedTasks` (tout est affiché à plat)
- `handleDragEnd` simplifié : réordonner la liste et appeler `reorderAll`

### 4. `GanttSidebar.tsx` — DnD simplifié

- Chaque ligne = 1 `Draggable` avec le même index
- Milestones (Axes) : fond distinct, texte gras, pas de chevron expand
- Projets/Tâches/Sous-tâches : indentation visuelle par `depth` (mais `depth` est fixe par type : 0 pour axe, 1 pour projet, 2 pour tâche, 3 pour sous-tâche)

### 5. `GanttTimeline.tsx` — Axes sans barre

- Les lignes de type `milestone` ne montrent aucune barre ni diamant dans la timeline
- Elles affichent simplement un fond de section (bande colorée horizontale sur toute la largeur)

### 6. Nettoyage

- `ProjectDialog` : retirer le champ "Jalon parent" (plus de rattachement)
- Renommer "Jalon" → "Axe" dans l'interface (bouton "Créer un jalon" → "Créer un axe", dialogs, labels)
- `MilestoneDialog` : retirer le champ "Date" (un axe n'a pas de date)

### Fichiers modifiés

| Fichier | Changements |
|---------|-------------|
| Migration SQL | `milestone_id` nullable, `global_sort_order` sur 4 tables |
| `useGanttData.ts` | `reorderAll`, suppression helpers hiérarchiques, delete simplifié |
| `GanttView.tsx` | Rows plats, DnD simple, suppression expand states |
| `GanttSidebar.tsx` | DnD plat universel, rendu axe comme séparateur |
| `GanttTimeline.tsx` | Axes = bande section sans barre |
| `ProjectDialog.tsx` | Retirer sélecteur jalon parent |
| `MilestoneDialog.tsx` | Retirer champ date, renommer "Jalon" → "Axe" |
| `GanttFilters.tsx` | Renommer bouton "Créer un jalon" → "Créer un axe" |
| `types/gantt.ts` | `date` optionnel sur `GanttMilestone`, `milestoneId` optionnel sur `GanttRow` |


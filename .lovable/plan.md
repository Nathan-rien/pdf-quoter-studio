

## Diagramme de Gantt — Plan d'implémentation

### 1. Base de données (4 tables + RLS)

**`gantt_projects`** : id, title, description, start_date, end_date, owner, status (enum), created_by (uuid → auth.users), created_at

**`gantt_tasks`** : id, project_id (→ gantt_projects), title, description, start_date, end_date, status, priority (enum: low/medium/high/critical), owner, sort_order

**`gantt_subtasks`** : id, task_id (→ gantt_tasks), title, start_date, end_date, status, sort_order

**`gantt_dependencies`** : id, source_task_id, target_task_id, dependency_type (finish_to_start / start_to_start)

Enum statut : `gantt_status` = `not_started`, `in_progress`, `done`
Enum priorité : `gantt_priority` = `low`, `medium`, `high`, `critical`

RLS : lecture pour tous les authentifiés, écriture pour admins uniquement. Realtime activé sur les 4 tables.

### 2. Navigation

Ajouter `'gantt'` au `ViewType` dans `AppSidebar.tsx`. Nouveau bouton "Planning Gantt" dans la section Administration (admin only), avec l'icône `GanttChart` de Lucide.

### 3. Composants (construction custom React + Tailwind)

Pas de librairie externe — construction sur mesure pour contrôle total et cohérence avec le design system existant.

| Composant | Rôle |
|---|---|
| `GanttView` | Page principale, layout split (sidebar + timeline) |
| `GanttSidebar` | Liste projets/tâches/sous-tâches, arbre pliable |
| `GanttTimeline` | Grille temporelle avec barres horizontales |
| `GanttBar` | Barre d'une tâche (draggable + resizable) |
| `GanttHeader` | En-tête timeline (mois/semaines/jours selon zoom) |
| `GanttFilters` | Filtres (projet, responsable, statut, priorité) + recherche |
| `GanttNavigation` | Boutons Précédent/Suivant/Aujourd'hui + zoom |
| `ProjectDialog` | Formulaire création/édition projet |
| `TaskDialog` | Formulaire création/édition tâche |
| `SubtaskDialog` | Formulaire création/édition sous-tâche |
| `DependencyLines` | SVG overlay pour dessiner les liens entre tâches |

### 4. Interactions

- **Drag horizontal** sur `GanttBar` → décale start_date + end_date → sauvegarde en DB
- **Resize** (poignées gauche/droite) → modifie start_date ou end_date
- **Clic** sur une barre → ouvre le dialog d'édition
- **Zoom** : 3 niveaux (Jour / Semaine / Mois) modifient la largeur des colonnes
- **Navigation** : scroll horizontal + boutons Précédent/Suivant/Aujourd'hui

### 5. Couleurs et statuts

```text
Projets     → bleu (bg-blue-500)
Tâches      → violet (bg-violet-500)  
Sous-tâches → amber (bg-amber-500)

not_started → opacity-60 + bordure pointillée
in_progress → couleur pleine
done        → couleur + hachures ou icône check
```

Labels affichés : "À lancer" / "En cours" / "Terminé"

### 6. Fichiers impactés

| Fichier | Modification |
|---|---|
| `src/components/layout/AppSidebar.tsx` | Ajout entrée "Planning Gantt" + type `gantt` |
| `src/pages/Index.tsx` | Ajout case `gantt` dans renderContent |
| `src/components/gantt/` (nouveau dossier) | Tous les composants Gantt |
| `src/hooks/useGanttData.ts` | Hook fetch/mutation des données Gantt |
| Migration SQL | 4 tables + enums + RLS + realtime |

### 7. Ordre d'implémentation

1. Migration DB (tables + enums + RLS + realtime)
2. Hook `useGanttData` (CRUD via Supabase)
3. `GanttView` + `GanttSidebar` (structure de base)
4. `GanttTimeline` + `GanttHeader` + `GanttBar` (rendu visuel)
5. Dialogs (création/édition projets, tâches, sous-tâches)
6. Drag & resize (interactions)
7. `GanttFilters` + recherche
8. `DependencyLines` (SVG)
9. Navigation sidebar + Index.tsx


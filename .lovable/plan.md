

## Plan : Restructurer la hiérarchie Gantt — Jalon comme élément principal

### Changement fondamental

**Actuel** : Projet (niveau 0) → Tâche/Jalon (niveau 1) → Sous-tâche (niveau 2)
**Cible** : Jalon (niveau 0) → Projet (niveau 1) → Tâche (niveau 2) → Sous-tâche (niveau 3)

---

### 1. Migration base de données

- **`gantt_milestones`** : rendre `project_id` nullable (il ne sera plus parent, le jalon EST le parent)
- **`gantt_projects`** : ajouter colonne `milestone_id UUID REFERENCES gantt_milestones(id) ON DELETE SET NULL` (nullable pour migration douce des projets existants)

```sql
ALTER TABLE gantt_milestones ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE gantt_projects ADD COLUMN milestone_id uuid REFERENCES gantt_milestones(id) ON DELETE SET NULL;
```

### 2. Types (`src/types/gantt.ts`)

- `GanttMilestone` : `project_id` devient optionnel
- `GanttProject` : ajouter `milestone_id?: string | null`
- `GanttRow` : ajouter `milestoneId?: string` pour les projets/tâches rattachés, ajuster les profondeurs (milestone=0, project=1, task=2, subtask=3)

### 3. Hook data (`src/hooks/useGanttData.ts`)

- `createMilestone` : ne plus exiger `project_id` (jalon créé au niveau racine)
- `createProject` : accepter `milestone_id` optionnel pour rattacher à un jalon
- `reorderMilestones` : réordonne les jalons au niveau racine (comme `reorderProjects` actuellement)
- `reorderMilestoneChildren` : nouveau, réordonne les projets à l'intérieur d'un jalon
- Adapter `reorderProjectChildren` pour réordonner tâches dans un projet
- Supprimer `moveMilestoneToProject` (plus pertinent), ajouter `moveProjectToMilestone`

### 4. Vue Gantt (`src/components/gantt/GanttView.tsx`)

- **Construction des `rows`** : itérer d'abord sur les jalons (depth 0), puis pour chaque jalon expansé afficher ses projets (depth 1), puis pour chaque projet expansé ses tâches (depth 2), puis sous-tâches (depth 3). Les projets sans `milestone_id` apparaissent en section "Non rattachés" en bas.
- **`expandedMilestones`** : nouveau Set (remplace le rôle de `expandedProjects` comme niveau racine)
- **`handleDragEnd`** : adapter pour la nouvelle hiérarchie (jalons = top level draggable, projets = children draggable dans un jalon)
- **Filtres** : le filtre projet reste, ajouter filtre jalon si pertinent

### 5. Sidebar (`src/components/gantt/GanttSidebar.tsx`)

- Jalon (depth 0) : chevron expand, icône diamant orange, actions "Ajouter un projet" + éditer/supprimer
- Projet (depth 1) : chevron expand, actions "Ajouter une tâche" + éditer/supprimer
- Tâche (depth 2) : chevron expand, actions "Ajouter sous-tâche"
- Sous-tâche (depth 3) : pas de chevron
- Bouton principal "Créer un jalon" (remplace "Créer un projet" comme action racine)

### 6. Dialogs

- **`MilestoneDialog`** : retirer le champ `projectId` (plus nécessaire, le jalon est racine)
- **`ProjectDialog`** : ajouter champ `milestoneId` (sélecteur du jalon parent)
- Bouton "Créer un jalon" dans `GanttFilters` au lieu de "Créer un projet"

### 7. Timeline (`GanttTimeline`, `GanttBar`)

- Adapter les couleurs/tailles de barres pour 4 niveaux (milestone=plus large, project, task, subtask)
- Le milestone garde sa représentation losange sur la timeline (date unique)

### 8. Données existantes

- Les jalons actuels qui ont un `project_id` seront promus au niveau racine (projet rattaché en dessous)
- Les projets existants sans `milestone_id` apparaîtront dans une section "Sans jalon" ou pourront être rattachés




## Plan : Jalons + Drag & Drop dans le Gantt

### 1. Migration DB — Ajouter `sort_order` aux projets + table `gantt_milestones`

La table `gantt_projects` n'a pas de `sort_order`. Il faut l'ajouter pour le drag & drop, et créer une table jalons.

```sql
-- Ajouter sort_order aux projets
ALTER TABLE public.gantt_projects ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Initialiser les sort_order existants
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) * 10 AS rn
  FROM public.gantt_projects
)
UPDATE public.gantt_projects SET sort_order = numbered.rn FROM numbered WHERE gantt_projects.id = numbered.id;

-- Table jalons
CREATE TABLE public.gantt_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.gantt_projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  date text NOT NULL,
  description text,
  status public.gantt_status NOT NULL DEFAULT 'not_started',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gantt_milestones ENABLE ROW LEVEL SECURITY;

-- RLS identique aux autres tables gantt
CREATE POLICY "Authenticated users can manage milestones"
  ON public.gantt_milestones FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.gantt_milestones;
```

### 2. Types — `src/types/gantt.ts`

- Ajouter `GanttMilestone` interface (`id, project_id, title, date, description, status, sort_order`)
- Ajouter `sort_order` à `GanttProject`
- Étendre `GanttRow.type` avec `'milestone'` et ajouter un champ optionnel `date?: string`

### 3. Hook — `src/hooks/useGanttData.ts`

- Fetch `gantt_milestones` en parallèle des autres tables
- Ordonner les projets par `sort_order` au lieu de `created_at`
- Ajouter CRUD milestones : `createMilestone`, `updateMilestone`, `deleteMilestone`
- Ajouter `updateProjectOrder(id, sort_order)` pour le drag & drop projets
- Ajouter `updateTaskOrder(id, sort_order, project_id?)` pour le drag & drop tâches
- Ajouter abonnement realtime sur `gantt_milestones`

### 4. Sidebar — `src/components/gantt/GanttSidebar.tsx`

- Intégrer `@hello-pangea/dnd` (fork maintenu de react-beautiful-dnd) pour le drag & drop
- Wrapper les lignes projet dans un `<Droppable>` avec des `<Draggable>` par projet
- Wrapper les lignes tâche dans un `<Droppable>` imbriqué par projet
- Ajouter un bouton `+` jalon (icône losange/diamant) visible entre les lignes projet au hover
- Afficher les jalons comme des lignes avec un losange coloré (rouge/orange) au lieu d'un point rond
- Les jalons apparaissent sous le projet (depth 1), avant les tâches

### 5. Timeline — `src/components/gantt/GanttTimeline.tsx` + `GanttBar.tsx`

- Pour les jalons : afficher un losange (diamant) au lieu d'une barre, positionné sur la date unique
- Tooltip spécifique affichant le titre et la date du jalon

### 6. GanttView — `src/components/gantt/GanttView.tsx`

- Intégrer les milestones dans le `rows` useMemo : les insérer après chaque projet (avant les tâches)
- Ajouter un dialog `MilestoneDialog` pour créer/éditer un jalon (titre, date, description, statut)
- Gérer le `onDragEnd` pour réordonner projets et tâches (mise à jour des `sort_order` en batch)
- Passer les callbacks au Sidebar

### 7. Nouveau composant — `src/components/gantt/MilestoneDialog.tsx`

- Dialog formulaire : titre (requis), date (requis), description (optionnel), statut (select)
- Même style que les dialogs existants (ProjectDialog, TaskDialog)

### Dépendance npm

- Installer `@hello-pangea/dnd` pour le drag & drop


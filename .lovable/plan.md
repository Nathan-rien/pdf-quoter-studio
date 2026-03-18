

## Plan : Jalons indépendants + alignement des barres

### Problème 1 — DnD des jalons ne fonctionne pas
Le `Draggable` du jalon **englobe tous ses enfants** (projets, tâches, sous-tâches). Le calcul des positions de drop par la librairie prend en compte la hauteur totale du bloc (jalon + enfants), ce qui fausse les indices et provoque le "snap back".

**Correction** : Rendre la sidebar comme une **liste plate**. Seule la ligne du jalon est un `Draggable`. Les enfants (projets, tâches, sous-tâches) sont rendus en dehors du `Draggable`, comme des éléments statiques indépendants.

```text
Avant (imbriqué) :
<Draggable milestone>
  <MilestoneRow />
  <ProjectRow />     ← inclus dans le Draggable
  <TaskRow />        ← inclus dans le Draggable
</Draggable>

Après (plat) :
<Draggable milestone>
  <MilestoneRow />   ← seul élément draggable
</Draggable>
<ProjectRow />       ← rendu à part, hors Draggable
<TaskRow />          ← rendu à part, hors Draggable
```

### Problème 2 — Barres timeline décalées
La sidebar a un header de **40px** (`h-10`), mais la timeline a 2-3 niveaux de header totalisant **60-84px**. Les lignes ne s'alignent plus verticalement.

**Correction** : Synchroniser la hauteur du header sidebar avec celle de la timeline (variable selon le zoom : 60px pour mois/année, 84px pour jour/semaine).

### Fichiers modifiés

1. **`src/components/gantt/GanttSidebar.tsx`**
   - Aplatir le rendu : itérer sur `rows` directement (liste déjà plate)
   - Envelopper uniquement les lignes `milestone` dans un `Draggable`
   - Passer la hauteur de header en prop pour synchronisation
   - Filtrer les milestones pour calculer le bon index de drag

2. **`src/components/gantt/GanttView.tsx`**
   - Calculer la hauteur header en fonction du zoom et la passer à `GanttSidebar`
   - Simplifier `handleDragEnd` (les indices correspondent directement aux milestones)

3. **`src/components/gantt/GanttTimeline.tsx`**
   - Exposer la hauteur du header via une constante partagée ou prop


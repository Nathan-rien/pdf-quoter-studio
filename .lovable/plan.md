

## Plan : Élargir la colonne sidebar du Gantt

### Problème
La colonne de gauche est fixée à `w-72` (288px), ce qui tronque les titres longs des projets et tâches.

### Solution
Rendre la sidebar redimensionnable avec un handle de drag, ou simplement l'élargir. Vu la capture, une largeur de ~320-340px suffirait, mais un **resize handle** serait plus flexible.

**Approche retenue** : ajouter un resize handle entre la sidebar et la timeline pour que l'utilisateur ajuste la largeur à sa convenance.

### Fichiers modifiés

**`GanttView.tsx`** :
- Ajouter un état `sidebarWidth` (default 320px) 
- Passer cette largeur à `GanttSidebar`
- Ajouter un div « resize handle » (4px de large, cursor col-resize) entre sidebar et timeline
- Gérer le mousedown/mousemove/mouseup pour ajuster `sidebarWidth` (min 200px, max 500px)

**`GanttSidebar.tsx`** :
- Remplacer `w-72 min-w-72` par un style dynamique `width` reçu en prop
- Ajouter la prop `width: number`


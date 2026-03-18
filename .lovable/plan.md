

## Plan : Retour à la ligne des titres dans la sidebar Gantt

### Problème
Les titres sont tronqués (`truncate`) dans la sidebar. L'utilisateur souhaite qu'ils passent à la ligne au lieu d'être coupés.

### Solution
- Retirer `truncate` des `<span>` de titre (lignes 82, 91) et le remplacer par un retour à la ligne naturel
- Retirer la hauteur fixe `ROW_HEIGHT` (40px) sur chaque ligne pour permettre l'expansion verticale — utiliser `min-height: 40px` à la place
- Synchroniser cette hauteur dynamique avec la timeline : passer les hauteurs calculées des lignes à `GanttTimeline` pour que les barres restent alignées

### Impact sur l'alignement sidebar ↔ timeline
C'est le point critique. Actuellement chaque ligne fait exactement 40px des deux côtés. Si la sidebar a des lignes de hauteur variable, la timeline doit suivre.

**Approche** : mesurer les hauteurs réelles des lignes sidebar via `useRef` + `ResizeObserver`, puis passer un tableau `rowHeights: number[]` à `GanttTimeline` qui l'utilise pour positionner chaque barre.

### Fichiers modifiés

| Fichier | Changements |
|---------|-------------|
| `GanttSidebar.tsx` | `truncate` → `break-words`, `height: ROW_HEIGHT` → `minHeight: ROW_HEIGHT`, exposer `rowHeights` via callback |
| `GanttView.tsx` | État `rowHeights`, le passer à `GanttTimeline` |
| `GanttTimeline.tsx` | Utiliser `rowHeights` pour le positionnement vertical des barres au lieu de `index * ROW_HEIGHT` |
| `GanttBar.tsx` | Recevoir `top` et `height` dynamiques au lieu de les calculer depuis l'index |


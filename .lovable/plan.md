

## Plan : Agrandir les éléments du planning Gantt

Augmenter les dimensions des lignes, barres, colonnes et headers pour une meilleure lisibilité.

### Modifications dans 2 fichiers

**`GanttTimeline.tsx`** :
- `ROW_HEIGHT` : 40 → **48**
- `getColWidth` : day 32→**40**, week 18→**24**, month 8→**12**
- Header mois : h-7 → **h-8**, texte `text-[10px]` → **`text-[11px]`**
- Header semaines : h-6 → **h-7**, texte `text-[10px]` → **`text-[11px]`**
- Header jours : hauteur 22/10 → **24/12**, texte `text-[8px]` → **`text-[9px]`**
- Sticky top du header jours : ajuster de `top-[52px]` → **`top-[60px]`** (8+7 = 15 de plus)

**`GanttBar.tsx`** :
- Hauteur barres : project 20→**26**, task 16→**22**, subtask 12→**16**
- Texte sur barre : `text-[10px]` → **`text-[11px]`**
- Poignées resize : w-2 → **w-3**


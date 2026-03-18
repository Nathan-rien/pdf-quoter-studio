

## Plan : Noms des projets sticky au scroll horizontal

### Problème
Quand on scroll horizontalement dans la timeline, le texte affiché sur les barres (notamment les projets) disparaît car il est positionné en `absolute left-2` à l'intérieur de la barre. Si la barre commence avant la zone visible, le label sort de l'écran.

### Solution
Utiliser `position: sticky` sur le label à l'intérieur de la barre pour qu'il reste visible tant que la barre est partiellement dans le viewport. Le container scrollable (`GanttTimeline`) fournit déjà le contexte de scroll nécessaire.

### Fichier modifié

**`src/components/gantt/GanttBar.tsx`** (lignes 96-126)
- Ajouter `overflow: hidden` sur la barre (div parent) pour que le sticky fonctionne dans le bon contexte
- Changer le label (ligne 123) de `absolute left-2` à `sticky left-2` avec `position: sticky`
- Retirer `top-1/2 -translate-y-1/2` du label et utiliser `flex items-center` sur le parent pour le centrage vertical
- Appliquer à tous les types (projets, tâches, sous-tâches) tant que la barre est assez grande


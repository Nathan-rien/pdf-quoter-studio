

## Plan : Ressources + Optimisation timeline du Gantt

### 1. Associer une ressource (commercial existant) aux projets/tâches

Le champ `owner` (texte libre) sera remplacé par un sélecteur basé sur la liste des commerciaux existante (`src/data/commerciaux.ts` + `pre_registered_commercials`).

**Modifications :**

- **`ProjectDialog.tsx`** et **`TaskDialog.tsx`** : remplacer l'`<Input>` "Responsable" par un `<Select>` alimenté par `useCommerciaux()`. Afficher `commercial.nom` comme label, stocker `commercial.id` dans le champ `owner`.
- **`GanttView.tsx`** : appeler `useCommerciaux()` au niveau du composant principal, passer la liste aux dialogs et aux filtres.
- **`GanttFilters.tsx`** : remplacer la liste dynamique `owners` (extraite des données) par la liste complète des commerciaux. Afficher `nom` dans le filtre "Responsable".
- **`GanttSidebar.tsx`** et **`GanttBar.tsx`** (tooltip) : résoudre l'`owner` (id) vers le `nom` du commercial pour l'affichage. Passer une fonction `getOwnerName(id)` ou la map des commerciaux en prop.
- **`GanttView.tsx`** (filtrage) : adapter la logique de filtre `filterOwner` pour comparer sur `commercial.id` au lieu du texte.

Aucune migration DB nécessaire — le champ `owner` (text) stockera le `commercial_id`.

### 2. Optimiser l'affichage de la timeline

**Problèmes actuels :**
- Vue jour : seulement 30 jours affichés, inclut samedi/dimanche
- Vue semaine : seulement ~17 semaines (120 jours)
- Vue mois : seulement 12 mois

**Corrections dans `GanttTimeline.tsx`** :

- **Vue jour** : filtrer `eachDayOfInterval` pour exclure samedi (6) et dimanche (0) → `isWeekend()` de date-fns. Étendre la plage visible à ~60 jours ouvrés. Marquer visuellement les colonnes de weekend si on garde un mode "tout afficher".
- **Vue semaine** : étendre la plage jusqu'à fin décembre 2026 (depuis la date de début de vue).
- **Vue mois** : étendre la plage jusqu'à décembre 2026.
- **Toutes les vues** : calculer la plage comme `viewStart → 31 décembre 2026` (borné), pour que l'utilisateur puisse scroller jusqu'à fin 2026.
- **Weekend shading** : en vue semaine/mois, pas de changement (les jours non ouvrés sont regroupés). En vue jour, les weekends sont simplement exclus de la grille.

**Modification de `getVisibleRange`** :
```typescript
const END_DATE = new Date(2026, 11, 31); // 31 déc 2026

// Vue jour : jours ouvrés uniquement
const allDays = eachDayOfInterval({ start: viewStart, end: END_DATE });
const workDays = allDays.filter(d => !isWeekend(d));

// Vue semaine : toutes les semaines jusqu'à fin 2026
const weeks = eachWeekOfInterval({ start: viewStart, end: END_DATE }, { weekStartsOn: 1 });

// Vue mois : tous les mois jusqu'à fin 2026
const months = eachMonthOfInterval({ start: viewStart, end: END_DATE });
```

**Ajustement `dayToX` / `xToDate`** : en vue jour avec jours ouvrés uniquement, le mapping doit indexer par position dans le tableau filtré plutôt que par différence de jours calendaires.

### 3. Fichiers modifiés

| Fichier | Changement |
|---|---|
| `GanttTimeline.tsx` | Plage étendue à fin 2026, filtrage weekends en vue jour, recalcul dayToX/xToDate |
| `GanttView.tsx` | Intégration `useCommerciaux`, passage aux dialogs/filtres |
| `GanttFilters.tsx` | Select "Responsable" alimenté par commerciaux |
| `ProjectDialog.tsx` | Select commercial au lieu d'input texte libre |
| `TaskDialog.tsx` | Select commercial au lieu d'input texte libre |
| `GanttSidebar.tsx` | Affichage nom commercial résolu depuis l'id |
| `GanttBar.tsx` | Tooltip : nom commercial résolu |

Aucune migration DB requise.


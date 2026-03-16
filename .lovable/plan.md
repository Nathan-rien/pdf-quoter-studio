

## Plan : Ajouter les vues Mois et Année au Gantt

### Modifications

**`src/types/gantt.ts`** — Ajouter `'year'` au type `ZoomLevel` :
```typescript
export type ZoomLevel = 'day' | 'week' | 'month' | 'year';
```

**`src/components/gantt/GanttNavigation.tsx`** — Ajouter les 2 options de zoom :
```typescript
const zoomOptions = [
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
  { value: 'year', label: 'Année' },
];
```

**`src/components/gantt/GanttTimeline.tsx`** — Adapter le rendu selon le zoom :
- `getColWidth` : `month` → 8px/jour, `year` → 2px/jour
- Header adaptatif :
  - **Mois** : Niveau 1 = mois, Niveau 2 = semaines, Niveau 3 = masqué
  - **Année** : Niveau 1 = année, Niveau 2 = mois, Niveau 3 = masqué
- `showDayLabels` : `false` pour `month` et `year`

**`src/components/gantt/GanttView.tsx`** — Adapter la navigation :
- `navigate` pour `year` : avance/recule de 6 mois, "Aujourd'hui" = début d'année
- `navigate` pour `month` : déjà géré (`subMonths/addMonths(3)`)

### Résultat
4 niveaux de zoom : Jour (détail), Semaine (défaut), Mois (vue d'ensemble), Année (vision globale). Les barres, dépendances et drag restent fonctionnels à tous les niveaux.




## Plan : Optimiser la vue Année du Gantt pour la lisibilité

### Problème

Avec `colWidth = 3px` par jour ouvré, une année (~260 jours) ne fait que ~780px — bien en dessous de la largeur du viewport (~1700px). Les labels de mois sont tronqués et l'espace est gaspillé.

### Correction (1 fichier)

**`src/components/gantt/GanttTimeline.tsx`** — Augmenter la largeur par jour en vue année de `3` à `6` px :

```typescript
case 'year': return 6;
```

Cela donne ~1560px pour une année complète, remplissant correctement le viewport. Les labels de mois (≈132px chacun) seront entièrement lisibles sans troncature.

### Résultat

La vue année remplit le viewport, les labels de mois sont lisibles, et la proportionnalité des barres de Gantt est préservée.


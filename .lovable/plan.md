

## Remplacement du graphique par un tableau detaille

### Modification

Remplacer le `BarChart` stacked "Propositions par jour et par commercial" (lignes 651-692 de `StatisticsDashboard.tsx`) par un tableau HTML :

- **Colonnes** : Date (dd/MM/yyyy) | Commercial 1 | Commercial 2 | ... | Total
- **Lignes** : un jour par ligne, les 30 derniers jours actifs, trie du plus recent au plus ancien
- **Cellules** : nombre de propositions (0 affiche en gris, valeurs > 0 en gras)
- **Derniere ligne** : totaux par commercial

### Detail technique

Le calcul `dailyCommercialMap` et `uniqueCommercials` existants sont reutilises tel quel. Seul le rendu change : le `<ResponsiveContainer><BarChart>` est remplace par un `<Table>` avec `<ScrollArea>` horizontal pour gerer beaucoup de commerciaux.

### Structure du tableau

```text
┌──────────┬──────────┬──────────┬───────────┬───────┐
│ Date     │ Comm. A  │ Comm. B  │ Comm. C   │ Total │
├──────────┼──────────┼──────────┼───────────┼───────┤
│ 25/02    │    2     │    0     │     1     │   3   │
│ 24/02    │    5     │    3     │     0     │   8   │
│ ...      │          │          │           │       │
├──────────┼──────────┼──────────┼───────────┼───────┤
│ Total    │    7     │    3     │     1     │  11   │
└──────────┴──────────┴──────────┴───────────┴───────┘
```

### Fichier modifie

| Fichier | Detail |
|---|---|
| `StatisticsDashboard.tsx` | Remplacer le BarChart (lignes 651-692) par un composant Table avec ScrollArea, en reutilisant les donnees `dailyChartData` et `uniqueCommercials` existantes. Tri inverse (plus recent en haut). Ligne de totaux en bas. Cellules a 0 stylees en `text-muted-foreground`. |


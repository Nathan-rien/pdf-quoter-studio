

## Plan : Optimiser la vue Année du Gantt

### Problèmes actuels

1. **`dayToX` en O(n)** : recherche linéaire sur tous les jours ouvrés (~500+), appelé pour chaque barre → lent
2. **Grille trop dense** : les lignes verticales sont dessinées par semaine même en vue année (trop fin, illisible)
3. **Colonnes trop étroites** : 2px/jour = un mois fait ~44px, les labels sont illisibles
4. **Labels tronqués** : le seuil `width > 60` masque le texte sur les barres et `width > 20` masque les labels de header
5. **Vue mois** : même problème à moindre échelle (8px → un mois ~176px, correct mais grille trop dense)

### Corrections (1 fichier : `GanttTimeline.tsx`)

**1. Augmenter la largeur colonne année** : `2` → `3` px/jour (un mois ≈ 66px, lisible)

**2. Optimiser `dayToX` avec recherche binaire** :
```typescript
const dayToX = useCallback((date: Date) => {
  const t = date.getTime();
  let lo = 0, hi = workDays.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    workDays[mid].getTime() < t ? lo = mid + 1 : hi = mid;
  }
  // Vérifier le plus proche entre lo-1 et lo
  return closest * colWidth;
}, [workDays, colWidth]);
```

**3. Adapter les lignes de grille au zoom** :
- Vue année → lignes par mois (monthGroups)
- Vue mois → lignes par mois (monthGroups)
- Vues jour/semaine → lignes par semaine (inchangé)

**4. Adapter les seuils de label des headers** :
- Header 1 en vue année : afficher le label si `width > 40` au lieu de `> 60`
- Header 2 en vue année : afficher si `width > 15` au lieu de `> 20`

### Résultat
Vue année plus lisible avec des colonnes légèrement plus larges, grille mensuelle au lieu d'hebdomadaire, et recherche binaire pour la performance.


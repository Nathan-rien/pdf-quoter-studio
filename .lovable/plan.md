
## Statistiques des options et services les plus proposés

### Contexte et constat technique

La table `proposal_exports` ne stocke actuellement que `options_count` (un nombre entier). Pour savoir **quelles options/services spécifiques** sont les plus proposés, il faut enrichir les données sauvegardées lors de chaque export PDF et exploiter ces nouvelles données dans le dashboard.

### Ce qui est insuffisant aujourd'hui

- `options_count: 3` → on sait qu'il y a 3 options, mais lesquelles ? Impossible à dire.
- Les noms des options (ex: "Pro-Tection", "Pro-Flex") viennent du store Zustand uniquement, pas de la base.

### Plan en 3 étapes

---

### Étape 1 — Migration base de données

Ajouter deux colonnes JSONB dans `proposal_exports` pour stocker les noms des options choisies :

```sql
ALTER TABLE proposal_exports
  ADD COLUMN IF NOT EXISTS selected_options_names jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS selected_nos_options_names jsonb DEFAULT '[]'::jsonb;
```

- `selected_options_names` : tableau des noms des **Services additionnels** cochés (onglet "Services inclus", page 5)
- `selected_nos_options_names` : tableau des noms des **Nos Options** cochées (page 6)

Les anciennes lignes auront `[]` par défaut (rétrocompatible).

---

### Étape 2 — Alimenter les colonnes lors de l'export

Dans `src/components/rental-proposal/RentalProposalExport.tsx`, la fonction `saveToHistory()` (ligne ~105) est enrichie avec :

```typescript
selected_options_names: selectedOptions.map(o => o.name),
selected_nos_options_names: selectedNosOptions.map(o => o.name),
```

Ces données sont déjà disponibles dans le composant (`selectedOptions` et `selectedNosOptions` sont définis lignes 68-69).

---

### Étape 3 — Nouvelles sections dans le dashboard

Dans `src/components/admin/StatisticsDashboard.tsx` :

**3a. Mise à jour de l'interface et du fetch**

```typescript
interface ExportRecord {
  // ... existant ...
  selected_options_names: string[] | null;
  selected_nos_options_names: string[] | null;
}
```

La requête Supabase inclut les deux nouvelles colonnes.

**3b. Calculs d'agrégation**

```typescript
// Top Services additionnels
const optionNamesCount: Record<string, number> = {};
filteredRecords.forEach(r => {
  (r.selected_options_names || []).forEach(name => {
    optionNamesCount[name] = (optionNamesCount[name] || 0) + 1;
  });
});
const topAdditionalOptions = Object.entries(optionNamesCount)
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 8);

// Top Nos Options
const nosOptionNamesCount: Record<string, number> = {};
filteredRecords.forEach(r => {
  (r.selected_nos_options_names || []).forEach(name => {
    nosOptionNamesCount[name] = (nosOptionNamesCount[name] || 0) + 1;
  });
});
const topNosOptions = Object.entries(nosOptionNamesCount)
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 8);
```

**3c. Deux nouvelles cartes visuelles**

Ajoutées à la fin du dashboard (avant le tableau détail par commercial), avec le même style que "Top clients" :

```
┌──────────────────────────────────────────────────────────┐
│  [Wrench]  Services additionnels les plus proposés       │
│                                                          │
│  ● Pro-Tection     ████████████████░░░░  12 prop.       │
│  ● Pro-Flex        ████████████░░░░░░░░   8 prop.       │
│  ● Pro-Spare       ████████░░░░░░░░░░░░   6 prop.       │
│  ...                                                     │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  [Star]  Nos Options les plus proposées                  │
│                                                          │
│  ● Option A        ████████████████░░░░   9 prop.       │
│  ● Option B        ████████░░░░░░░░░░░░   5 prop.       │
│  ...                                                     │
└──────────────────────────────────────────────────────────┘
```

Ces deux cartes sont côte à côte en grille 2 colonnes (ou 1 colonne sur mobile).

Un message informatif est affiché si aucune donnée n'est encore disponible (les nouvelles colonnes étant vides pour les exports historiques) :

> "Les nouvelles exportations alimenteront automatiquement ces statistiques."

---

### Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| Migration SQL | Ajouter `selected_options_names` et `selected_nos_options_names` dans `proposal_exports` |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Sauvegarder les noms des options sélectionnées dans `saveToHistory()` |
| `src/components/admin/StatisticsDashboard.tsx` | Lire les nouvelles colonnes, calculer les tops, afficher 2 nouvelles cartes |

### Icônes

- Services additionnels → `Wrench` (lucide-react)
- Nos Options → `Star` (lucide-react)

### Rétrocompatibilité

- Les exports existants auront `[]` (tableau vide) dans les nouvelles colonnes — aucun impact sur les stats existantes.
- Les cartes affichent un message "Aucune donnée disponible" si les tableaux sont tous vides.
- Aucune modification du workflow utilisateur (l'enrichissement est transparent lors de l'export).

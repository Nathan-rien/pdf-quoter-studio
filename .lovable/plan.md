
## Affichage de tous les services/options dans Statistiques (avec compteur 0 si jamais proposé)

### Problème

Les tableaux accordéon "Services additionnels — détail" et "Nos Options — détail" n'affichent que les services **déjà présents dans au moins une proposition exportée**. Un service qui n'a jamais été sélectionné est invisible.

### Solution

Charger le référentiel complet depuis `options_services` (table base de données) et **fusionner** avec les données de propositions existantes. Chaque service apparaîtra avec son compteur réel (0 si jamais proposé).

### Logique de fusion

```text
Référentiel (options_services)    Propositions (proposal_exports)
──────────────────────────────    ─────────────────────────────────
Pro-Tection                  →    2 propositions  ✓
Pro-Actif                    →    0 propositions  (nouveau — affiché avec 0)
Pro-Flex                     →    0 propositions  (nouveau — affiché avec 0)
Pro-Optimisée                →    1 proposition   ✓
Pro-support informatique     →    3 propositions  ✓
...                               ...
```

### Modifications techniques

**Fichier unique : `src/components/admin/StatisticsDashboard.tsx`**

#### 1. Nouvel état : chargement du référentiel

```typescript
const [allServiceOptions, setAllServiceOptions] = useState<{ id: string; title: string }[]>([]);
```

Dans `fetchData()`, ajouter un appel parallèle à `options_services` :

```typescript
const [exportRes, optionsRes] = await Promise.all([
  supabase.from('proposal_exports').select(...).eq('status', 'success').order('created_at', { ascending: true }),
  supabase.from('options_services').select('id, title, is_active').order('sort_order', { ascending: true })
]);
setRecords(exportRes.data || []);
setAllServiceOptions((optionsRes.data || []).map(o => ({ id: o.id, title: o.title })));
```

#### 2. Fusion avec les propositions

Les deux maps `allOptionsWithProposals` et `allNosOptionsWithProposals` sont recalculées en **partant du référentiel complet** :

```typescript
// Pour Services additionnels (selected_options_names)
const optionProposalsMap: Record<string, ExportRecord[]> = {};
filteredRecords.forEach(r => {
  ((r.selected_options_names as string[]) || []).forEach((name: string) => {
    if (!optionProposalsMap[name]) optionProposalsMap[name] = [];
    optionProposalsMap[name].push(r);
  });
});
// Partir du référentiel, ajouter ceux qui n'ont aucune proposition
const allOptionsWithProposals = allServiceOptions.map(opt => ({
  name: opt.title,
  proposals: optionProposalsMap[opt.title] || [],
})).sort((a, b) => b.proposals.length - a.proposals.length);
// Ajouter les services orphelins (dans propositions mais plus dans le référentiel)
const knownNames = new Set(allServiceOptions.map(o => o.title));
Object.entries(optionProposalsMap)
  .filter(([name]) => !knownNames.has(name))
  .forEach(([name, proposals]) => allOptionsWithProposals.push({ name, proposals }));
```

Idem pour `allNosOptionsWithProposals` avec `selected_nos_options_names`.

#### 3. Adaptation du composant `ServiceDetailTable`

Ajouter un indicateur visuel pour les services à **0 proposition** : compteur affiché en gris neutre au lieu de la couleur de la barre.

```text
▶ Pro-Tection          2 prop.   ← couleur vive
▶ Pro-Actif            0 prop.   ← gris neutre
▶ Pro-Flex             0 prop.   ← gris neutre
▶ Pro-Optimisée        1 prop.   ← couleur vive
```

Dans `ServiceDetailTable`, conditionner le style du badge :

```tsx
const hasProposals = item.proposals.length > 0;
// Badge
<span
  className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
    hasProposals ? '' : 'bg-muted text-muted-foreground'
  }`}
  style={hasProposals ? {
    background: colorSet[i % colorSet.length] + '22',
    color: colorSet[i % colorSet.length]
  } : undefined}
>
  {item.proposals.length} prop.
</span>
```

Le bouton d'expansion est désactivé (`pointer-events-none` ou `cursor-default`) si `proposals.length === 0`.

#### 4. État vide

Si le référentiel `options_services` est vide ET qu'il n'y a aucune proposition, afficher le message "Aucune donnée disponible" comme avant.

### Résultat attendu

| Service | Avant | Après |
|---------|-------|-------|
| Pro-Tection | Visible si proposé | Toujours visible |
| Pro-Actif | Visible si proposé | Toujours visible, 0 prop. |
| Pro-Flex | Invisible si jamais proposé | Visible, 0 prop. |
| Pro-Optimisée | Visible (1 prop.) | Visible (1 prop.) |
| Pro-support informatique | Visible (3 prop.) | Visible (3 prop.) |

Un seul fichier modifié : `StatisticsDashboard.tsx`. Aucune modification de base de données.

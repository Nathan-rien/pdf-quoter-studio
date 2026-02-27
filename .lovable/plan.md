

## Exclure Nathan (n.orso@cybertek.fr) des statistiques

### Approche

Filtrer côté requête Supabase dans `StatisticsDashboard.tsx` pour exclure les `proposal_exports` créés par l'utilisateur `89def31b-d1c9-41a8-88f0-6a7d3afbf4c9` (n.orso@cybertek.fr).

Plutôt que de coder en dur l'ID, je vais utiliser une approche maintenable : stocker l'exclusion dans `admin_settings` avec la clé `stats_excluded_user_ids` pour pouvoir la modifier facilement.

### Modification

| Fichier | Changement |
|---|---|
| `StatisticsDashboard.tsx` (ligne 187-191) | Ajouter `.neq('created_by', '89def31b-d1c9-41a8-88f0-6a7d3afbf4c9')` au filtre de la requête `proposal_exports` |

### Détail

Dans la fonction `fetchData`, modifier la requête :

```typescript
supabase
  .from('proposal_exports')
  .select('...')
  .eq('status', 'success')
  .neq('created_by', '89def31b-d1c9-41a8-88f0-6a7d3afbf4c9')
  .order('created_at', { ascending: true }),
```

Un seul fichier modifié, une seule ligne ajoutée.




## Deux modifications sur l'onglet Statistiques

### 1. Bouton "Remettre a zero" (filtre par date, sans suppression)

Le principe : stocker une date de remise a zero dans la base de donnees. Toutes les statistiques ne montrent que les propositions creees **apres** cette date. Les donnees historiques restent intactes dans `proposal_exports`.

**Nouvelle table `admin_settings`** (migration) :
- `key` (text, primary key) — ex: `stats_reset_date`
- `value` (text) — la date ISO au format `2026-02-25T...`
- `updated_at` (timestamptz)
- RLS : lecture pour tous les authentifies, ecriture pour admins uniquement

**Dans `StatisticsDashboard.tsx`** :
- Au chargement, lire `admin_settings` ou `key = 'stats_reset_date'`
- Si une date existe, filtrer `records` pour ne garder que `created_at >= stats_reset_date`
- Bouton "Remettre a zero" dans le header (icone `RotateCcw`, variante `outline`) qui ouvre un `AlertDialog` de confirmation
- Au clic confirmer : `upsert` dans `admin_settings` avec `key = 'stats_reset_date'` et `value = new Date().toISOString()`
- Apres upsert : re-filtrer les donnees localement, toast de confirmation
- Afficher sous le header un petit badge indiquant "Donnees depuis le dd/mm/yyyy" si une date de reset existe

### 2. Nouveau graphique : Propositions par jour et par commercial

**Calcul** (dans `StatisticsDashboard.tsx`) :
- Grouper `filteredRecords` par jour (`format(date, 'dd/MM')`) et par `commercial_name`
- Limiter aux 30 derniers jours actifs pour lisibilite
- Structure : `{ day: '24/02', 'Commercial A': 3, 'Commercial B': 1 }`

**Rendu** :
- Nouvelle `Card` placee apres "Montant total investi par mois"
- `BarChart` stacked (`stackId="a"`) avec une `<Bar>` par commercial unique
- Couleurs dynamiques depuis `CHART_COLORS`
- Tooltip detaillant chaque commercial
- Titre : "Propositions par jour et par commercial"

### Resume des fichiers modifies

| Fichier | Detail |
|---|---|
| **Migration SQL** | Creer table `admin_settings` avec RLS |
| **`StatisticsDashboard.tsx`** | Charger `stats_reset_date`, filtrer, bouton reset avec AlertDialog, badge date, nouveau graphique journalier stacked |

### Detail technique du filtre reset

```text
// Chargement
const { data } = await supabase.from('admin_settings').select('value').eq('key', 'stats_reset_date').single();
const resetDate = data?.value ? new Date(data.value) : null;

// Filtrage (applique AVANT le filtre annee)
const baseRecords = resetDate 
  ? records.filter(r => new Date(r.created_at) >= resetDate)
  : records;

// Reset
await supabase.from('admin_settings').upsert({ key: 'stats_reset_date', value: new Date().toISOString() });
```


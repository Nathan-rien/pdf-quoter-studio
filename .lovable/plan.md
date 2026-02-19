
## Remplacement du graphique "Évolution du montant moyen" par 4 nouvelles statistiques

### Contexte

Le graphique "Évolution du montant moyen d'investissement" (LineChart) sera supprimé et remplacé par 4 nouvelles statistiques, toutes calculables depuis les données disponibles dans `proposal_exports`.

Note importante : les colonnes `partner_name` et `duration` n'existent pas en base. Les stats "Nombre de propositions par partenaire" et "Durée de contrat la plus choisie" ne peuvent pas être implémentées telles quelles. À la place, des statistiques pertinentes basées sur les champs réellement disponibles (`client_name`, `commercial_name`, `montant_investissement`, `options_count`, `template_name`, `created_at`) seront proposées.

### Ce qui est supprimé

- Le `<LineChart>` "Évolution du montant moyen d'investissement" (lignes 313-345 de `StatisticsDashboard.tsx`)
- L'import `LineChart`, `Line`, `Legend` de recharts (devenus inutilisés)
- L'import `TrendingUp` de lucide-react (devenu inutilisé)
- Le calcul `avgByMonth` / `avgMonthlyData` (devenus inutilisés)

### Ce qui est ajouté à la place

4 nouvelles statistiques remplacent le LineChart, organisées en une grille 2×2 (ou 4 colonnes sur grand écran) sous les graphiques existants :

#### 1. Montant total investi par mois (BarChart cumulé)
Un nouveau graphique à barres montrant la **somme totale** des `montant_investissement` par mois (et non la moyenne).
- Données : `filteredRecords` → sommer `montant_investissement` par mois
- Axe Y : formaté en `k€`
- Tooltip : montant formaté en euros
- Icône : `Euro`

#### 2. Top clients (barres horizontales)
Un classement des clients avec le plus de propositions exportées.
- Données : `filteredRecords` → grouper par `client_name`, trier par count décroissant, top 5
- Affichage : liste avec barres de progression horizontales (même style que "Détail par commercial")
- Icône : `Building2`

#### 3. Propositions avec options (donut)
Un PieChart donut montrant la répartition entre propositions **avec options** (`options_count > 0`) et **sans options**.
- Données : count de `filteredRecords` avec `options_count > 0` vs `=== 0`
- Affichage : donut 2 segments + légende
- Icône : `Package`

#### 4. Template le plus utilisé (barres)
Un petit BarChart ou une liste montrant quels templates ont été utilisés le plus souvent.
- Données : `filteredRecords` → grouper par `template_name`, trier par count
- Affichage : liste avec barres de progression (top 5)
- Icône : `LayoutTemplate`

### Organisation visuelle finale

```text
┌─────────────────────────────────────────────────────────────────┐
│ [KPI x4]                                                        │
├───────────────────────┬─────────────────────────────────────────┤
│ Propositions par mois │ Répartition par commercial (donut)      │
├───────────────────────┴─────────────────────────────────────────┤
│ Montant total investi par mois (nouveau BarChart)               │
├───────────────────────┬─────────────────────────────────────────┤
│ Top clients           │ Propositions avec/sans options (donut)  │
├───────────────────────┴─────────────────────────────────────────┤
│ Détail par commercial (tableau existant)                        │
│ Template le plus utilisé (liste/barres)                         │
└─────────────────────────────────────────────────────────────────┘
```

### Fichier modifié

Uniquement `src/components/admin/StatisticsDashboard.tsx` :

1. Supprimer l'import `LineChart`, `Line`, `Legend`, `TrendingUp`
2. Ajouter l'import `Building2`, `Package`, `LayoutTemplate`
3. Supprimer les calculs `avgByMonth` / `avgMonthlyData`
4. Ajouter les calculs :
   - `totalByMonth` : somme de `montant_investissement` par mois
   - `topClients` : top 5 clients par nombre de propositions
   - `withOptionsPie` : [{ name: 'Avec options', count }, { name: 'Sans option', count }]
   - `templateUsage` : top 5 templates utilisés
5. Supprimer le bloc JSX du LineChart (lignes 313-345)
6. Ajouter les 4 nouveaux blocs JSX à la place

Aucune modification de base de données requise — toutes les données sont déjà disponibles dans `proposal_exports`.

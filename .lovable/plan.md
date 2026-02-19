
## Ajout de la liste détaillée Services/Options avec propositions associées

### Contexte

Le dashboard Statistiques affiche déjà deux cards en bas de page :
- **"Services additionnels les plus proposés"** — basé sur `selected_options_names` (page 5)
- **"Nos Options les plus proposées"** — basé sur `selected_nos_options_names` (page 6)

Ces cards affichent le nom du service + le nombre de propositions, mais sans détail. L'objectif est d'ajouter, sous chacune de ces sections, un tableau exhaustif listant **toutes** les propositions pour chaque service/option (pas seulement le top 8).

### Approche : Tableau expandable (accordéon)

Pour éviter de surcharger la page avec des dizaines de lignes, chaque service aura une **ligne cliquable** qui se développe pour révéler la liste des propositions associées. Le design s'intègre dans les cards existantes.

Structure visuelle par card :

```text
┌─────────────────────────────────────────────────────────┐
│ 🔧 Services additionnels — liste détaillée              │
├─────────────────────────────────────────────────────────┤
│ ▶ Garantie étendue              5 propositions          │
│   └ Acme Corp | 15/02/2026                              │
│   └ Beta SA   | 12/02/2026                              │
│ ▶ Pack déploiement              3 propositions          │
│ ▶ Maintenance préventive        2 propositions          │
└─────────────────────────────────────────────────────────┘
```

### Modification technique

**Fichier : `src/components/admin/StatisticsDashboard.tsx`**

#### 1. Calcul des données détaillées

Deux nouvelles structures calculées à partir de `filteredRecords` :

```typescript
// Pour chaque service (options page 5), liste des propositions
const optionProposalsMap: Record<string, ExportRecord[]> = {};
filteredRecords.forEach(r => {
  ((r.selected_options_names as string[]) || []).forEach((name: string) => {
    if (!optionProposalsMap[name]) optionProposalsMap[name] = [];
    optionProposalsMap[name].push(r);
  });
});
// Trié par nombre de propositions décroissant
const allOptionsWithProposals = Object.entries(optionProposalsMap)
  .map(([name, proposals]) => ({ name, proposals }))
  .sort((a, b) => b.proposals.length - a.proposals.length);

// Idem pour Nos Options (page 6)
const nosOptionProposalsMap: Record<string, ExportRecord[]> = {};
filteredRecords.forEach(r => {
  ((r.selected_nos_options_names as string[]) || []).forEach((name: string) => {
    if (!nosOptionProposalsMap[name]) nosOptionProposalsMap[name] = [];
    nosOptionProposalsMap[name].push(r);
  });
});
const allNosOptionsWithProposals = Object.entries(nosOptionProposalsMap)
  .map(([name, proposals]) => ({ name, proposals }))
  .sort((a, b) => b.proposals.length - a.proposals.length);
```

#### 2. État d'expansion

```typescript
const [expandedOption, setExpandedOption] = useState<string | null>(null);
const [expandedNosOption, setExpandedNosOption] = useState<string | null>(null);
```

#### 3. Composant `ServiceDetailTable`

Un sous-composant inline qui prend la liste `allOptionsWithProposals` et rend le tableau accordéon. Chaque ligne :
- **Ligne principale** : couleur dot + nom du service + badge nombre + chevron
- **Ligne détail** (si expanded) : liste des propositions avec `proposal_name`, `client_name` et date formatée

#### 4. Deux nouvelles cards ajoutées sous les cards existantes (top 8)

- **"Services additionnels — détail par proposition"** (basée sur `selected_options_names`)
- **"Nos Options — détail par proposition"** (basée sur `selected_nos_options_names`)

Ces deux cards sont dans une grille `grid-cols-1 lg:grid-cols-2` (même layout que les cards du top 8 existantes), avec un état vide identique au style existant.

#### 5. Icônes importées

Ajouter `ChevronRight`, `ChevronDown` depuis `lucide-react` (déjà présent dans le projet).

### Résultat attendu

| Section | Avant | Après |
|---------|-------|-------|
| Services additionnels | Top 8 avec barre progression | + Tableau expandable toutes options |
| Nos Options | Top 8 avec barre progression | + Tableau expandable toutes options |

Aucune modification de base de données. Un seul fichier modifié : `StatisticsDashboard.tsx`.

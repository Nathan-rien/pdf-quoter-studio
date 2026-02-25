

## Modifications de la carte "Propositions par jour et par commercial"

### 1. Filtres a ajouter dans le header de la carte

**Filtre par date** : Un input date (ou date picker) permettant de filtrer sur une date specifique. Si aucune date n'est selectionnee, toutes les dates sont affichees (comportement actuel).

**Switch entite** : Un composant Switch avec deux labels "Cybertek Pro" / "Grosbill Pro" permettant de n'afficher que les commerciaux de l'entite selectionnee. Par defaut, aucun filtre (tous les commerciaux). Le switch utilise le referentiel `COMMERCIAUX` de `src/data/commerciaux.ts` pour mapper `commercial_id` (stocke dans `proposal_exports`) vers l'entite correspondante.

### 2. Liens vers les propositions

Chaque cellule avec une valeur > 0 dans le tableau deviendra cliquable. Au clic, le dashboard naviguera vers la vue Historique (`history`) avec les IDs des propositions correspondantes en surbrillance, en utilisant le mecanisme `handleNavigateToHistory` deja existant dans `Index.tsx`.

Pour cela, il faut :
- Passer une callback `onNavigateToHistory` en prop a `StatisticsDashboard`
- Stocker les IDs des propositions dans les donnees du tableau (pas seulement les compteurs)
- Rendre les cellules > 0 cliquables avec un style de lien

### 3. Suppression de la carte "Detail par commercial"

La carte "Detail par commercial" (lignes 806-834) sera supprimee.

### Detail technique

**Donnees enrichies du tableau** : Au lieu de stocker uniquement le compteur par jour/commercial, stocker aussi les IDs des propositions :

```text
dailyCommercialMap[dayKey][commercial] = { count: number, ids: string[] }
```

**Filtre entite** : Utiliser `COMMERCIAUX` pour determiner l'entite d'un `commercial_id`. Les records sans `commercial_id` ou avec un ID inconnu seront affiches dans les deux entites (ou dans "tous").

**Filtre date** : Filtrer `dailyChartData` pour ne montrer que la date selectionnee.

### Fichiers modifies

| Fichier | Detail |
|---|---|
| `StatisticsDashboard.tsx` | Ajouter import `COMMERCIAUX`, `CommercialEntity` depuis `@/data/commerciaux`. Ajouter etats `filterEntity` et `filterDate`. Ajouter filtres dans le CardHeader. Enrichir `dailyCommercialMap` avec les IDs. Rendre cellules cliquables. Supprimer carte "Detail par commercial". Ajouter prop `onNavigateToHistory`. |
| `Index.tsx` | Passer `onNavigateToHistory={handleNavigateToHistory}` a `<StatisticsDashboard />` |

### Structure du header de la carte

```text
┌─────────────────────────────────────────────────────────────────┐
│ 👥 Propositions par jour et par commercial                     │
│                                                                 │
│  [📅 Date: __/__/____] [× effacer]   ○ Cybertek Pro ● Grosbill │
├─────────────────────────────────────────────────────────────────┤
│  Date  │ Commercial A │ Commercial B │ ... │ Total             │
│  25/02 │      2 🔗     │      0       │     │   3               │
│  ...                                                            │
└─────────────────────────────────────────────────────────────────┘
```

Les cellules > 0 sont stylees en bleu/lien et au clic naviguent vers l'historique avec les propositions correspondantes en surbrillance.


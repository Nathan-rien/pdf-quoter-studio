
## Plan d'implémentation complet — Comptes commerciaux, Historique avancé, Notifications & Statistiques

---

### Vue d'ensemble des 4 fonctionnalités

```text
1. Auto-attribution du rôle "commercial" à l'inscription (via trigger DB)
2. Historique enrichi : filtres + vue admin par commercial
3. Notifications en temps réel pour les admins lors d'un export PDF
4. Onglet Statistiques (admin) avec graphiques et métriques
```

---

### Analyse des commerciaux à créer

Depuis `src/data/commerciaux.ts`, les comptes à créer (Nathan = n.orso@cybertek.fr déjà existant, Gregory Moinet exclus des deux entrées) :

| Nom | Email |
|---|---|
| Victor Bordaraud | v.bordaraud@cybertek-pro.fr |
| Johanna Weill | j.weill@cybertek-pro.fr |
| Mathis Houdbert | m.houdbert@cybertek-pro.fr |
| Adil Aboutaib | a.aboutaib@cybertek-pro.fr |
| Christophe Besse | c.besse@picata.fr |
| Mehdi Kharsou | m.kharsou@grosbill-pro.com |
| Malek KADERI | m.kaderi@grosbill-pro.com |
| Jonathan Breton | j.breton@grosbill-pro.com |

---

### Fonctionnalité 1 — Auto-attribution du rôle "commercial" à l'inscription

**Mécanisme** : Un trigger PostgreSQL sur la table `auth.users` (via `handle_new_user`) sera enrichi pour vérifier si l'email qui s'inscrit correspond à l'un des commerciaux pré-enregistrés. Si oui, le rôle `commercial` est automatiquement inséré dans `user_roles`.

**Implémentation** :
- Créer une table `pre_registered_commercials(email text PRIMARY KEY, full_name text, commercial_id text)` contenant les 8 emails des commerciaux
- Modifier le trigger `handle_new_user` pour :
  1. Créer le profil (comportement actuel)
  2. Vérifier si l'email est dans `pre_registered_commercials`
  3. Si oui → insérer automatiquement `role = 'commercial'` dans `user_roles`
- Les admins voient ces comptes dans l'onglet Accès et peuvent changer leur rôle si besoin

**Avantage** : Aucune modification du formulaire d'inscription nécessaire. C'est 100% automatique côté base de données.

---

### Fonctionnalité 2 — Historique enrichi avec filtres et vue admin par commercial

#### Modifications base de données
Ajouter 3 colonnes à `proposal_exports` :
- `commercial_id text` (ex: `vb-cybertek`) — l'identifiant du commercial sélectionné dans le workflow
- `commercial_name text` — nom du commercial pour affichage rapide sans jointure
- `montant_investissement numeric` — pour les stats et filtres

#### Modifications du code d'export
Dans `saveToHistory()` de `RentalProposalExport.tsx`, enrichir l'insert avec le commercial sélectionné et le montant.

#### Refonte de `HistoryView.tsx`
**Vue commerciale (rôle commercial)** : identique à aujourd'hui, filtres mois/année/recherche sur ses propres propositions.

**Vue admin** : 
- Groupement par commercial (accordéon ou onglets)
- Filtres globaux : mois, année, nom client, commercial
- Champ de recherche par mot-clé (proposal_name, client_name)
- Compteur total visible

L'`useAuth` est passé en prop depuis `Index.tsx` pour conditionner l'affichage.

---

### Fonctionnalité 3 — Notifications temps réel pour les admins

**Mécanisme** :
1. Activer Supabase Realtime sur `proposal_exports`
2. Créer un hook `useAdminNotifications` (utilisé uniquement si `isAdmin`)
3. S'abonner aux événements `INSERT` sur `proposal_exports`
4. Stocker les nouvelles notifications dans un state React (liste avec `id`, `commercial_name`, `proposal_name`, `created_at`)
5. Afficher un badge clochette dans le header / sidebar avec le nombre de nouvelles propositions
6. Cliquer sur la notification → navigate vers `history` + passer les IDs à surligner

**Composant `AdminNotificationBell`** : placé dans la sidebar (en haut à droite), affiche un badge rouge avec le compteur. Un popover liste les dernières notifications. Chaque notification est cliquable.

**Dans `Index.tsx`** : si `isAdmin`, rendre `<AdminNotificationBell>` et passer un callback `onNavigateToHistory(highlightedIds)`.

**Dans `HistoryView.tsx`** : accepter une prop `highlightedIds?: string[]` pour surligner les entrées récentes en jaune.

---

### Fonctionnalité 4 — Onglet Statistiques (admin)

**Nouveau composant** `src/components/admin/StatisticsDashboard.tsx`

**Métriques affichées** (toutes calculées depuis `proposal_exports`) :

```text
KPI Cards (en haut)
- Nombre total de propositions
- Montant moyen d'investissement
- Montant le plus haut / le plus bas
- Nombre de propositions ce mois-ci

Graphiques (recharts, déjà installé)
- Bar chart : propositions par mois (12 derniers mois)
- Pie chart : répartition par commercial
- Bar chart : options/services les plus vendus (via options_count + commercial_id)
- Line chart : évolution du montant moyen dans le temps
```

**Ajout dans la sidebar** : Nouveau bouton "Statistiques" (icône `BarChart3`) dans la section Administration, visible uniquement par les admins.

**Types ajoutés dans `AppSidebar.tsx`** : `'statistics'` dans `ViewType`.

---

### Récapitulatif technique — Fichiers modifiés

| Couche | Fichier | Modification |
|---|---|---|
| DB Migration | nouvelle migration | Table `pre_registered_commercials` + trigger enrichi + colonnes `proposal_exports` + realtime |
| Store | `rentalProposalStore.ts` | Aucune modification nécessaire (commercial déjà dans le store) |
| Export | `RentalProposalExport.tsx` | Enrichir `saveToHistory` avec `commercial_id`, `commercial_name`, `montant_investissement` |
| Historique | `HistoryView.tsx` | Refonte complète : filtres, groupement admin, prop `highlightedIds` |
| Nouveau hook | `src/hooks/useAdminNotifications.ts` | Realtime subscription sur `proposal_exports` |
| Nouveau composant | `src/components/admin/AdminNotificationBell.tsx` | Badge clochette + popover |
| Nouveau composant | `src/components/admin/StatisticsDashboard.tsx` | Tableau de bord stats |
| Navigation | `AppSidebar.tsx` | Ajout de `'statistics'` dans `ViewType` + bouton Statistiques |
| Page principale | `Index.tsx` | Intégrer la clochette + le nouveau case `statistics` |

---

### Séquence d'implémentation

1. Migration DB (table pre-enregistrée + trigger + colonnes + realtime)
2. Enrichissement de `saveToHistory` dans `RentalProposalExport.tsx`
3. Hook `useAdminNotifications` + composant `AdminNotificationBell`
4. Refonte `HistoryView.tsx` avec filtres et vue admin
5. `StatisticsDashboard.tsx` + mise à jour sidebar/Index

---

### Précisions sur les données des commerciaux pré-enregistrés

La table `pre_registered_commercials` permet de gérer facilement la liste : un admin peut y ajouter de nouveaux emails sans toucher au code. La vérification à l'inscription se fait entièrement côté PostgreSQL via le trigger existant `handle_new_user`.

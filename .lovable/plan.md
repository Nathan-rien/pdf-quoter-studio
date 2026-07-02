# Statistiques — Vues multiples

## Objectif
Remplacer la vue unique actuelle (basée uniquement sur `proposal_exports` de type location) par un dashboard multi‑vues avec 5 onglets en haut de page :

1. **Vue globale** (par défaut) — synthèse consolidée des 4 périmètres
2. **Propositions Location** — `proposal_exports` où `proposal_type = 'rental-proposal'`
3. **Propositions Services** — `proposal_exports` où `proposal_type = 'service-proposal'`
4. **Contrats Location** — `contracts` où `proposal_type = 'rental-proposal'`
5. **Contrats Services** — `contracts` où `proposal_type = 'service-proposal'`

## UI — switcher
En haut de `StatisticsDashboard`, sous le titre : une barre `Tabs` (shadcn) à 5 boutons, sticky. Icônes : `LayoutDashboard`, `FileText`, `Wrench`, `FileSignature`, `Handshake`. État local `activeView`, défaut `'global'`. Les filtres existants (année, reset, entité, date) restent au‑dessus des rapports et s'appliquent à la vue courante.

## Rapports par vue

### Vue globale (défaut)
KPIs consolidés :
- Total propositions (Location + Services)
- Total contrats actifs (Location + Services)
- Montant investissement cumulé (propositions)
- Loyer trimestriel cumulé (contrats, dérivé comme dans `useContractProposalRent`)

Graphes :
- Répartition Location vs Services (propositions) — PieChart
- Répartition Location vs Services (contrats) — PieChart
- Volume mensuel combiné (barres empilées Location/Services)
- Top 5 commerciaux tous périmètres confondus

### Propositions Location
Réutilise l'ensemble actuel des rapports (KPIs, mensuel, top clients, avec/sans options, templates, commerciaux, tableau quotidien, Top Services additionnels, Top Nos Options) — filtré sur `proposal_type = 'rental-proposal'`.

### Propositions Services
Mêmes rapports que Location, mais alimentés par les exports `service-proposal`. Le bloc « Top Services additionnels » est masqué (pas de page 5 côté Services) ; « Top Nos Options » conservé.

### Contrats Location
Source : table `contracts` filtrée `proposal_type = 'rental-proposal'`.
- KPIs : nb contrats, loyer mensuel cumulé, loyer trimestriel cumulé, durée moyenne
- Contrats par mois (date de création) — BarChart
- Répartition par commercial — BarChart horizontal
- Répartition par enseigne — PieChart
- Répartition par partenaire financier — PieChart
- Répartition Mensuel vs Trimestriel (`payment_frequency`)
- Top 5 clients par loyer trimestriel

### Contrats Services
Mêmes rapports que Contrats Location **sauf** « partenaire financier » (retiré du module Services, conformément à la mémoire projet).

## Implémentation technique
- Fichier principal : `src/components/admin/StatisticsDashboard.tsx`
- Extraire les calculs actuels dans une fonction `computeProposalStats(records)` réutilisable pour Location et Services.
- Nouvelle fonction `computeContractStats(contracts, proposalExportsById)` — jointure côté client sur `contract.proposal_export_id` pour dériver le loyer via la même logique que `useContractProposalRent`.
- Nouvel appel dans `fetchData` :
  - `proposal_exports` : ajouter le champ `proposal_type` au `select` (déjà en DB).
  - `contracts` : `select` complet avec `proposal_type`, `payment_frequency`, `enseigne`, `partenaire_financier`, `commercial_name`, `client_name`, `duration`, `loyer_mensuel_ht`, `proposal_export_id`, `created_at`, `is_quick_contract`.
- Nouveaux sous‑composants (dans le même fichier ou fichiers frères) : `GlobalOverview`, `ProposalStatsView`, `ContractStatsView` — chacun reçoit ses données déjà filtrées.
- Les filtres (année, entité, date, reset) sont appliqués en amont, puis chaque vue reçoit son jeu filtré. Reset date : appliqué aux 2 sources via `created_at`.
- Le bouton « Remettre à zéro » et les filtres restent globaux (au‑dessus du switcher).

## Hors périmètre
- Pas de modif DB ni de types Supabase (`proposal_type` et `payment_frequency` déjà présents).
- Pas de changement de navigation ni de sidebar.
- Pas de modif du parcours Propositions/Contrats.

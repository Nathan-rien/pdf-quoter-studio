## Objectif

Quand le tri est **« Plus récents »** (ou « Échéance croissante/décroissante »), afficher une **liste plate** de contrats triés globalement, sans regroupement par commercial. Le regroupement par commercial reste actif uniquement quand aucun tri explicite n'est demandé… en pratique, il faut le retirer dès qu'un mode de tri est sélectionné.

**Décision retenue** : dès qu'un tri est actif dans la liste (`recent`, `echeance-asc`, `echeance-desc`), on n'affiche plus les entêtes de commercial — un flux plat trié. Le regroupement par commercial n'existait que pour l'organisation visuelle, il masquait le vrai ordre chronologique.

## Fichiers modifiés

- `src/components/contracts/ContractsView.tsx`
- `src/components/service-proposal/ServiceContractsView.tsx`

## Changements (identiques dans les deux fichiers)

1. **Tri chronologique global** dans le `useMemo` : ajouter le cas `sortMode === 'recent'` qui trie par `validated_at` (ou `created_at` en fallback) DESC. Les contrats rapides restent mêlés aux autres — ils portent leur propre `validated_at`.

2. **Rendu conditionnel** : remplacer la section `groups.map(...)` par :
   - Si `sortMode !== 'recent'` (ancien comportement conservé pour le futur) → afficher les groupes commerciaux comme aujourd'hui.
   - Sinon → afficher directement `filteredContracts.map(c => <ContractRow ... />)` en liste plate, sans entête « Contrats rapides » / « Nom du commercial ».

   Comme le tri par défaut est `recent`, la vue par défaut devient plate. Les tris `echeance-asc/desc` restent également plats (déjà attendu par l'utilisateur puisque c'est un tri global).

3. **Petit indicateur visuel** : chaque `ContractRow` affiche déjà le nom du commercial dans son propre contenu (via `commercial_name`/badge « Contrat rapide »), donc aucune info n'est perdue en supprimant l'entête de groupe.

## Hors périmètre

- Pas de changement dans `ContractRow.tsx`.
- Pas de suppression de la fonction `groupByCommercial` / composant `CommercialGroup` (conservés au cas où l'on veuille un mode « groupé » plus tard).
- Aucun changement backend.

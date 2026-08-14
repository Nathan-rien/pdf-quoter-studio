# Clôture et archivage des contrats de location

## Objectif
Permettre de clôturer un contrat de location. Un contrat clôturé disparaît de la liste courante et devient consultable via une entrée « Contrats archivés » dans le sélecteur « Trier par ».

## Comportement
- Sur chaque ligne de contrat (vue Contrats Location), un nouveau bouton « Clôturer » à côté de la suppression, avec une confirmation.
- Un contrat clôturé est marqué avec sa date de clôture ; il n'apparaît plus dans les tris/filtres habituels.
- Le sélecteur « Trier par » reçoit une option « Contrats archivés » : elle affiche uniquement les contrats clôturés (triés par date de clôture décroissante), avec un badge « Clôturé » et sa date.
- Depuis la vue archivée, un bouton « Rouvrir » permet de remettre le contrat dans la liste active.
- La suppression reste possible depuis l'archive.
- Les compteurs (badge du nombre de contrats, alertes de renouvellement) ignorent les contrats clôturés.

## Détails techniques
- Migration : ajout de `closed_at timestamptz null` sur `public.contracts` (pas de nouvelle table, RLS existante inchangée).
- `src/hooks/useContracts.ts` : inclure `closed_at` dans le type `Contract`, autoriser sa mise à jour dans `useUpdateContract`.
- `src/components/contracts/ContractsView.tsx` : ajout du mode de tri `archived`, filtrage `closed_at == null` pour les autres modes, tri par `closed_at` desc en mode archivé.
- `src/components/contracts/ContractRow.tsx` : bouton Clôturer / Rouvrir (AlertDialog de confirmation), badge « Clôturé le … », masqué pour le rôle technicien comme les autres actions d'édition.
- Portée limitée aux contrats de location (`ContractsView`), la vue Contrats Services n'est pas modifiée.

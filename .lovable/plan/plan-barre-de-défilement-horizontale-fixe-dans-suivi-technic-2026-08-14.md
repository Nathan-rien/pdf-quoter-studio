# Plan : Barre de défilement horizontale fixe dans Suivi Techniciens

## Problème
Dans la vue **Suivi Techniciens** (tableau « Clients \ Service à distance »), le tableau est large et défile horizontalement. Comme le conteneur actuel (`<Card className="overflow-x-auto">`) n’a pas de hauteur limitée, l’utilisateur doit descendre tout au bas du tableau pour atteindre la barre de défilement horizontale.

## Objectif
Rendre la barre de défilement horizontale utilisable à n’importe quel niveau de scroll dans la page, sans avoir à descendre en bas du tableau.

## Solution retenue
Transformer le tableau en un conteneur scrollable avec une hauteur maximale calée sur la hauteur utile de l’écran. La barre de défilement horizontale reste alors visible au bas de la zone visible du tableau, et le scroll vertical se fait à l’intérieur du tableau.

## Étapes techniques

1. **Restructurer le conteneur de la table** dans `src/components/technician-tracking/RemoteSupportView.tsx`.
   - Garder le `Card` pour le style.
   - Placer un `<div>` interne avec :
     - `overflow-x-auto` (défilement horizontal).
     - `overflow-y-auto` (défilement vertical interne).
     - `max-h-[calc(100vh-12rem)]` ou une valeur adaptée au header/filtres/boutons.
     - `scrollbar-thin` pour conserver un style discret (si classe disponible, sinon utiliser le style natif).

2. **Figer l’en-tête du tableau** lors du scroll vertical.
   - Appliquer `sticky top-0 z-10 bg-background` sur la `<TableHeader>` (ou chaque `<TableHead>`) pour que les titres de colonnes restent visibles quand l’utilisateur descend dans le tableau.

3. **Conserver le comportement actuel**.
   - La recherche, les filtres, les actions, l’import CSV et les dialogues restent inchangés.
   - Seule la zone d’affichage du tableau est modifiée.

4. **Vérifier le rendu**.
   - S’assurer que les colonnes très larges (ex. Liste Produit(s)\\SN, Forfait) s’affichent toujours correctement.
   - Vérifier que le sélecteur de tri et les boutons d’action ne sont pas masqués par la barre de défilement horizontale.

## Fichiers concernés
- `src/components/technician-tracking/RemoteSupportView.tsx`

## Non-concerné
- Aucune modification de schéma base de données.
- Aucun changement de logique métier (filtres, tickets, import CSV, etc.).

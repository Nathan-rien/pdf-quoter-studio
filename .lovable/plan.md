## Objectif

Supprimer la limite de 50 lignes affichées dans le tableau "Base Taux" de l'onglet Données de la proposition. Les 136 entrées doivent toutes être visibles (avec scroll dans le conteneur existant `max-h-96`).

## Changements

Fichier : `src/components/rental-proposal/RentalDataEditor.tsx`

1. **Ligne 1130** — remplacer `baseTauxEntries.slice(0, 50).map(...)` par `baseTauxEntries.map(...)` afin d'itérer sur toutes les entrées.

2. **Lignes 1142-1144** — remplacer le texte d'avertissement :
   - Avant : `Affichage limité à 50 lignes. Total : {n} entrées.`
   - Après : `Total : {baseTauxEntries.length} entrées.`

Le conteneur `max-h-96 overflow-auto` (ligne 1118) reste inchangé : il fournit déjà un scroll vertical pour parcourir confortablement les 136 lignes sans casser la mise en page de l'onglet.

## Notes

- Aucun impact sur les calculs ou le store (`useBaseTauxStore`) — uniquement l'affichage.
- Aucun changement nécessaire ailleurs (l'éditeur admin `BaseTauxEditor` n'a pas cette limite).

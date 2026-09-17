# Options Services : pouvoir repasser une option « sans prix »

## Problème constaté

Dans le catalogue Options Services, une fois qu'un prix a été saisi sur une option ou un pack, il est impossible de revenir à « sans prix » : saisir `0` ou vider le champ ne change rien, l'ancien montant reste affiché.

Cause : l'enregistrement du prix n'est effectué que si le montant est un nombre strictement supérieur à 0. Un `0` ou un champ vide est donc simplement ignoré, et l'ancienne valeur reste en base.

## Comportement attendu

- Saisir `0` enregistre bien un prix de 0,00 € (affiché `0.00 € HT / mois`).
- Vider le champ montant retire le prix : la carte affiche « (sans prix) » et le prix est supprimé en base.
- La croix à droite du prix continue de supprimer le prix et de refermer l'éditeur.
- Le champ unité seul (sans montant) ne crée pas de prix.

## Détails techniques

Fichier : `src/components/options-admin/OptionsServiceCard.tsx`

- `handlePriceSave` : remplacer la condition `!isNaN(amount) && amount > 0` par une logique à trois cas :
  - champ montant vide/non numérique → `removeOptionPrice(option.id)` (sans refermer l'éditeur) ;
  - montant valide `>= 0` → `setOptionPrice(option.id, amount, priceUnit.trim() || '€ HT / mois')` ;
  - unité vide → utiliser l'unité par défaut plutôt que d'annuler l'enregistrement.
- `showPriceEditor` doit rester ouvert après une suppression via champ vide, pour permettre une nouvelle saisie.
- Vérifier dans `src/stores/optionsAdminStore.ts` que `removeOptionPrice` persiste bien `price = null` côté base (et non uniquement en mémoire), et l'ajuster si besoin.

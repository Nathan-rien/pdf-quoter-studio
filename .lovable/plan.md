

## Plan : Ajouter les contrôles prix complets aux Options additionnelles (Services inclus)

Actuellement, les "Options additionnelles" sur l'onglet Services inclus n'ont qu'un simple champ prix unique. L'objectif est de reproduire les mêmes contrôles que "Nos Options" :
- Champ "Au total" (€)
- Champ "Au mois" (€/mois) avec calcul croisé via le coefficient
- Toggle Afficher : /mois | total
- Toggle Scope : /machine | /parc
- Bouton supprimer

### Modification dans 1 fichier

**`src/components/rental-proposal/RentalDataEditor.tsx`** (lignes 593-628) :

Remplacer le rendu simple des `optionsServices` par le même bloc que `nosOptions` (lignes 711-819), en utilisant les fonctions `updateOptionService` / `deleteOptionService` / `toggleOptionService` au lieu de leurs équivalents `NosOption`.

Concrètement pour chaque option :
- Ajouter les handlers `handlePriceMois` et `handlePriceTotal` avec calcul croisé via `calculatedValues.coefficient`
- Remplacer le champ prix unique par les 2 champs (Au total + Au mois)
- Ajouter les toggles Afficher (/mois | total) et Scope (/machine | /parc)
- Ajouter l'avertissement coefficient manquant au-dessus de la liste (comme pour Nos Options)

Aucune modification de store nécessaire : `OptionService` possède déjà `price`, `priceTotal`, `showPriceMode` et `pricingScope`.


## Objectif

Ajouter, sur chaque option additionnelle (bloc "Options additionnelles" et "Nos options" dans Données → Services inclus), un interrupteur permettant d'afficher ou non le montant (mois ou total) sur la page du template généré et dans le PDF exporté.

Le toggle global mois/total reste en place : il choisit **quel** montant afficher. Le nouveau toggle choisit **si** on l'affiche.

## Interface utilisateur

Dans `src/components/rental-proposal/RentalDataEditor.tsx`, sous chaque option (dans les deux sections "Options additionnelles" ~ligne 534 et "Nos options" ~ligne 793), ajouter une nouvelle ligne sous "Afficher : /mois | total" :

```text
Prix visible : [ ●— ] (switch ON par défaut)
```

- Composant `Switch` (déjà disponible dans `@/components/ui/switch`).
- Quand OFF, on grise visuellement les champs "Au total / Au mois" et les boutons /mois|total + /machine|/parc pour signaler qu'ils n'ont pas d'effet sur l'affichage final (mais restent éditables).

## Modèle de données

Étendre `OptionService` dans `src/stores/rentalProposalStore.ts` :

```ts
export interface OptionService {
  // ...champs existants
  showPrice: boolean; // affiche le montant sur le template/PDF (défaut true)
}
```

- Initialisation à `true` dans `addOptionService` et `addNosOption`.
- Migration douce dans le bloc `onRehydrateStorage` (déjà utilisé pour `pricingScope`) : `showPrice: o.showPrice ?? true` pour `optionsServices` et `nosOptions`.
- Idem dans le hydrate des snapshots historiques (`loadFromSnapshot`).

## Rendu preview + export

Dans les 3 emplacements qui appellent `getOptionPriceLabel(...)` :

- `src/components/rental-proposal/RentalProposalPreview.tsx` (bloc options additionnelles, ~ligne 1180 ; bloc nos options, ~ligne 1265)
- `src/components/rental-proposal/RentalProposalExport.tsx` (`makeNosOptionHTML`, ~ligne 580, et l'équivalent pour `optionsServices`)

Encapsuler par :

```ts
const priceLabel = option.showPrice === false
  ? null
  : getOptionPriceLabel({ ... });
```

Le label est déjà conditionnellement rendu (`priceLabel ? ... : null`), donc renvoyer `null` masque proprement le badge prix sur le template **et** dans le HTML exporté pour le PDF.

## Fichiers impactés

- `src/stores/rentalProposalStore.ts` — champ `showPrice`, init, migration, snapshots.
- `src/components/rental-proposal/RentalDataEditor.tsx` — switch UI dans les deux blocs.
- `src/components/rental-proposal/RentalProposalPreview.tsx` — gating dans les 2 rendus.
- `src/components/rental-proposal/RentalProposalExport.tsx` — gating dans les 2 makers HTML (options additionnelles + nos options).

## Hors périmètre

- Aucun changement aux calculs (rien dans `rental-calculations.ts` / coefficients).
- Aucun changement à l'admin Options Services.
- Pas de modification de la logique mois↔total, ni du scope /machine|/parc.
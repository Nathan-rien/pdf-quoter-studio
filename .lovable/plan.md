## Problème

Dans la section **Options additionnelles** (Pro-Actif, Pro-Tection, Pro-Flex…) de l'onglet "Services inclus", le toggle **"Prix visible"** a bien été ajouté, mais sur le template et le PDF le prix n'apparaît jamais — quel que soit l'état du toggle.

**Cause** : ces options (`optionsServices` dans le store) sont rendues par un bloc dédié (`'option'` dans la preview, `makeOptionHTML` dans l'export) qui **n'a jamais inclus l'affichage du prix**. Seul le bloc "Nos options" (`nosOptions`) gère l'affichage du prix. Le toggle `showPrice` n'a donc aucun effet sur les Options additionnelles puisqu'aucun prix n'y est rendu en amont.

À l'inverse, sur la capture du template fournie, Pro-Actif / Pro-Tection / Pro-Flex apparaissent bien (nom + description) mais sans aucun prix à droite.

## Correctif

Ajouter le rendu du libellé prix (mensuel/total + /machine ou /parc) dans le bloc Options additionnelles, en respectant le toggle "Prix visible" déjà en place.

### 1. `src/components/rental-proposal/RentalProposalPreview.tsx` (bloc `'option'`, ~ligne 1138)

Calculer `priceLabel` via `getOptionPriceLabel` en respectant `option.showPrice`, et l'insérer à droite du nom dans l'en-tête (mêmes classes que le bloc `'nos-option'` pour cohérence visuelle) :

```tsx
<div className="bg-muted px-3 py-1.5 flex items-center gap-2">
  <CheckCircle className="h-3 w-3 text-foreground/70" />
  <span className="font-semibold text-[11px]">{option.name}</span>
  {option.showPrice !== false && priceLabel && (
    <span className="ml-auto text-[10px] text-primary font-medium whitespace-nowrap">
      {priceLabel}
    </span>
  )}
</div>
```

### 2. `src/components/rental-proposal/RentalProposalExport.tsx` (`makeOptionHTML`, ~ligne 565)

Aligner sur `makeNosOptionHTML` : calculer `priceLabel` (avec garde `opt.showPrice === false ? null : …`) et l'afficher à droite du nom dans la même ligne flex :

```ts
const priceLabel = opt.showPrice === false ? null : getOptionPriceLabel({
  price: opt.price,
  priceTotal: opt.priceTotal,
  showPriceMode: opt.showPriceMode ?? 'mensuel',
  pricingScope: opt.pricingScope ?? 'par_machine',
});
// Header avec justify-content: space-between, ✓ + nom à gauche, priceLabel à droite si non null.
```

## Comportement attendu après correctif

- Toggle **"Prix visible" ON** (par défaut) → le prix s'affiche à droite du nom de l'option additionnelle dans le template ET le PDF, formaté selon les sélecteurs `/mois | total` et `/machine | /parc`.
- Toggle **"Prix visible" OFF** → l'option reste affichée (nom + description avec ✓), seul le prix est masqué — comportement identique à "Nos options".
- Aucun changement sur "Nos options" ni sur les autres pages.
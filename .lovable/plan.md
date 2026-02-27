
## Diagnostic

### Problème 1 : Prix "Pro-déploiement" absent
Dans `renderServicesInclusPage` (lignes 1196-1212), le rendu des blocs `nos-option` utilise une logique manuelle sans fallback au lieu du helper partagé `getOptionPriceLabel`. Si le mode est "mensuel" mais que `price` est null (ex: "Au mois" texte), aucun prix ne s'affiche — alors que `getOptionPriceLabel` ferait automatiquement le fallback sur `priceTotal`.

### Problème 2 : Options en double
Les `selectedNosOptions` sont ajoutées à la fois :
- Dans `servicesBlocs` (ligne 256) → rendues sur la page 5 (services)
- ET via `renderNosOptionsPage` (ligne 1498) → rendues sur la page 6 (options)

### Problème 3 : Services inclus absents
Si les `nosOptions` sélectionnées remplissent `servicesBlocs` au-delà de `SERVICES_ITEMS_PAGE1`, la pagination déplace les services vers des pages dédiées et perturbe l'affichage.

---

## Corrections

### 1. Retirer les `nosOptions` de la pagination services (lignes 252-257)
**Fichier** : `RentalProposalPreview.tsx`

Les `nosOptions` ont leur propre page dédiée (page 6 / `options_block`). Il ne faut pas les inclure dans les blocs services (page 5).

```typescript
// Avant (lignes 252-257) :
const servicesBlocs: ServiceBloc[] = [
  { type: 'services-location' },
  ...selectedOptions.map(...),
  ...(selectedNosOptions.length > 0 ? [{ type: 'nos-options-title' }] : []),
  ...selectedNosOptions.map(...),
];

// Après :
const servicesBlocs: ServiceBloc[] = [
  { type: 'services-location' },
  ...selectedOptions.map(o => ({ type: 'option' as const, data: o })),
];
```

### 2. Utiliser `getOptionPriceLabel` dans `renderServicesInclusPage` (lignes 1196-1212)
Pour le cas où des `nos-option` blocs resteraient dans d'autres contextes, remplacer la logique manuelle par le helper avec fallback :

```typescript
// Remplacer les deux conditions manuelles (lignes 1203-1212) par :
const priceLabel = getOptionPriceLabel({
  price: option.price,
  priceTotal: option.priceTotal,
  showPriceMode: option.showPriceMode ?? 'mensuel',
  pricingScope: option.pricingScope ?? 'par_machine',
});
// puis afficher {priceLabel && <span>...</span>}
```

### 3. Même correction dans la page "Nos Options" dédiée (lignes 1296-1297)
Remplacer le rendu checkbox coché/décoché dans `renderNosOptionsPage` : les cases doivent être **vides** (cohérence avec le PDF).

```typescript
// Ligne 1296 : retirer le conditionnel selected sur le style
<div className="h-4 w-4 border border-foreground/70 rounded-sm flex-shrink-0" />
// (sans le Check icon, sans bg-primary)
```

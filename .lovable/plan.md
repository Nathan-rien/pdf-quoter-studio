

## Plan : Utiliser le prix "Au total" pour le calcul des Services Inclus Loyers

### Problème

Actuellement, `getSelectedOptionsPrices()` et `getCalculatedValues()` dans `rentalProposalStore.ts` utilisent `opt.price` (prix mensuel) pour alimenter le calcul de `servicesInclusLoyers`. Or, la logique financière exige d'utiliser `opt.priceTotal` (prix total), car cette valeur est ensuite multipliée par le coefficient pour obtenir le loyer mensuel des services (`loyerServicesInclus = total × coef / 100`).

### Correction (1 fichier)

**`src/stores/rentalProposalStore.ts`** — Modifier les deux fonctions pour utiliser `priceTotal` au lieu de `price` :

1. **`getSelectedOptionsPrices`** (ligne ~637) : `.map(opt => opt.priceTotal)` au lieu de `.map(opt => opt.price)`
2. **`getCalculatedValues`** (ligne ~644) : `.map(opt => opt.priceTotal)` au lieu de `.map(opt => opt.price)`

### Résultat

Le champ "Les services comprennent des loyers" reprendra le montant total (ex: 100 €) au lieu du montant mensuel (ex: 3,01 €/mois), et le calcul en cascade (`loyerServicesInclus`, `loyerMensuel`, etc.) sera cohérent avec la valeur saisie dans "Au total".



## Ajouter deux champs de tarif dans "Nos Options" avec calcul croisé et toggle d'affichage

### Contexte

Actuellement, chaque option dans l'onglet "Nos Options" (Données) n'a qu'un seul champ `price` affiché tel quel dans l'aperçu et le PDF. L'utilisateur souhaite :
- **Deux champs de saisie** : "Au mois" et "Au total"
- **Calcul croisé automatique** : saisir l'un calcule l'autre
  - Mois → Total : `total = mois * 100 / coefficient`
  - Total → Mois : `mois = total * coefficient / 100`
- **Un toggle** pour choisir lequel afficher dans l'aperçu et le PDF (`/mois` ou total sans unité)

### Structure des données à modifier

#### 1. `src/stores/rentalProposalStore.ts`

L'interface `OptionService` passe de :
```typescript
export interface OptionService {
  id: string;
  name: string;
  description: string;
  price: number | null;       // actuel
  selected: boolean;
}
```

À :
```typescript
export interface OptionService {
  id: string;
  name: string;
  description: string;
  price: number | null;           // montant "au mois"
  priceTotal: number | null;      // montant "au total"
  showPriceMode: 'mensuel' | 'total'; // quel montant afficher
  selected: boolean;
}
```

Les actions `addNosOption` et `updateNosOption` sont mises à jour pour initialiser `priceTotal: null` et `showPriceMode: 'mensuel'` par défaut.

#### 2. `src/components/rental-proposal/RentalDataEditor.tsx` — Onglet Nos Options (lignes 590-627)

Le bloc d'une option passe d'un seul input "Prix" à une interface à deux champs + toggle :

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Switch]  [Nom................]  [Description......................]  │
│                                  [Au total: ___________€]           │
│                                  [Au mois:  ___________€/mois]      │
│                                  [○ Afficher: (●) /mois  ( ) total] │
│                                                                 [🗑] │
└─────────────────────────────────────────────────────────────────────┘
```

La logique de calcul croisé utilise le coefficient du premier proposal :
```typescript
// Récupérer le coefficient actuel
const coefficient = getCalculatedValues().coefficient; // number | null

// Quand l'utilisateur saisit "au total"
const handlePriceTotal = (optId, totalValue) => {
  const mois = coefficient ? Math.round(totalValue * coefficient / 100 * 100) / 100 : null;
  updateNosOption(optId, { priceTotal: totalValue, price: mois });
};

// Quand l'utilisateur saisit "au mois"
const handlePriceMois = (optId, moisValue) => {
  const total = coefficient ? Math.round(moisValue * 100 / coefficient * 100) / 100 : null;
  updateNosOption(optId, { price: moisValue, priceTotal: total });
};
```

Si le coefficient n'est pas disponible (partenaire/durée/montant non renseigné), les deux champs restent indépendants et seul le champ saisi est mis à jour (sans calcul croisé). Un message d'avertissement contextuel est affiché dans ce cas.

#### 3. `src/components/rental-proposal/RentalProposalPreview.tsx` — Affichage conditionnel

Le prix affiché dans l'aperçu tient compte du `showPriceMode` :
```tsx
// Au lieu de : {formatNumber(option.price)} €/mois
// Maintenant :
{option.showPriceMode === 'mensuel' && option.price !== null && (
  <span>... {formatNumber(option.price)} €/mois</span>
)}
{option.showPriceMode === 'total' && option.priceTotal !== null && (
  <span>... {formatNumber(option.priceTotal)} €</span>
)}
```

Cela concerne les deux emplacements de rendu :
- Le bloc "Nos Options" fusionné sur Page 5 (ligne ~980)
- La page dédiée `renderNosOptionsPage` (ligne ~1034)

#### 4. `src/components/rental-proposal/RentalProposalExport.tsx` — PDF conditionnel

Même logique pour le HTML généré pour le PDF :
```typescript
${opt.showPriceMode === 'mensuel' && opt.price !== null
  ? `<span>... ${formatNumber(opt.price)} € / mois</span>`
  : opt.showPriceMode === 'total' && opt.priceTotal !== null
    ? `<span>... ${formatNumber(opt.priceTotal)} €</span>`
    : ''
}
```

### Rétrocompatibilité

Les options déjà créées n'ont pas `priceTotal` ni `showPriceMode`. Le store les lira comme `undefined`. L'interface les traite ainsi :
- `priceTotal ?? null` → champ vide au chargement
- `showPriceMode ?? 'mensuel'` → valeur par défaut

### Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `src/stores/rentalProposalStore.ts` | Étendre `OptionService` + initialiser les nouveaux champs dans `addNosOption` |
| `src/components/rental-proposal/RentalDataEditor.tsx` | Remplacer l'input unique par les deux champs + toggle |
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Affichage conditionnel selon `showPriceMode` (2 endroits) |
| `src/components/rental-proposal/RentalProposalExport.tsx` | HTML conditionnel selon `showPriceMode` (1 endroit) |

### Comportement du calcul croisé

| Coefficient disponible ? | Action utilisateur | Résultat |
|---|---|---|
| Oui | Saisit "Au total" | Calcule et remplit "Au mois" automatiquement |
| Oui | Saisit "Au mois" | Calcule et remplit "Au total" automatiquement |
| Non | Saisit l'un ou l'autre | Seul le champ saisi est mis à jour. Avertissement affiché. |

Le coefficient vient de `getCalculatedValues().coefficient` (premier proposal).

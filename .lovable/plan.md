
## Nouveau toggle : Afficher / masquer "Votre offre"

### Objectif

Ajouter un second interrupteur dans l'onglet Invest permettant de masquer le bloc "Votre offre" (propositions financières : Location X mois, Montant investissement, Loyer mensuel HT, Coût locatif annuel) dans l'aperçu et le PDF exporté.

Le tableau "Vos investissements" reste toujours affiché — seul le bloc financier en dessous est conditionnel.

### Comportement cible

| Élément | `investShowOffer = true` | `investShowOffer = false` |
|---|---|---|
| Tableau "Vos investissements" | ✅ Visible | ✅ Visible |
| Titre "Votre offre" | ✅ Visible | ❌ Masqué |
| Propositions financières (Location X mois...) | ✅ Visible | ❌ Masqué |
| Éléments de flux (Avantages, Conditions...) | ✅ Visible | ❌ Masqué |

### Modifications — 3 fichiers

**1. `src/stores/rentalProposalStore.ts`**

Ajouter le champ `investShowOffer: boolean` (défaut `true`) dans l'interface `MatriceData` et dans `initialMatriceData`. Aucune action dédiée n'est nécessaire — `updateMatriceField` générique gère déjà ce cas.

**2. `src/components/rental-proposal/RentalDataEditor.tsx`** (onglet Invest)

Ajouter un second Switch à côté du premier dans le header de la Card :

```
[Afficher les prix] [Switch]     [Afficher "Votre offre"] [Switch]     [Ajouter]
```

Lié à `matriceData.investShowOffer` via `updateMatriceField('investShowOffer', checked)`.

**3. `src/components/rental-proposal/RentalProposalPreview.tsx`** (aperçu visuel)

Ligne ~822 — encapsuler le bloc `{isLastChunk && (...)}` (qui contient "Votre offre" + propositions + éléments de flux) dans une condition supplémentaire `investShowOffer !== false`.

**4. `src/components/rental-proposal/RentalProposalExport.tsx`** (génération PDF)

Ligne ~391 — la variable `offreAndProposalsHTML` est conditionnée : si `investShowOffer` est `false`, elle est remplacée par une chaîne vide `''`. Les insertions aux lignes ~411 et ~439 restent inchangées (elles utilisent déjà la variable).

### Détail technique

- La valeur par défaut `investShowOffer: true` assure la rétrocompatibilité avec les propositions existantes sauvegardées.
- Le toggle est persisté via le middleware `persist` du store (comme `investShowPrices`).
- Les "éléments de flux" (Avantages, Conditions) sont inclus dans le même bloc conditionnel car ils font partie du contenu qui suit "Votre offre" dans la structure de la page.

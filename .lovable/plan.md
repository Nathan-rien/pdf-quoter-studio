
## Correction : Le toggle "Votre offre" ne masque que la ligne "Montant investissement"

### Diagnostic

Le toggle `investShowOffer` a été implémenté pour masquer l'intégralité du bloc "Votre offre" (titre + toutes les lignes des propositions + éléments de flux). 

L'utilisateur veut en réalité un comportement plus ciblé : seule la ligne **"Montant investissement"** doit être masquable. Le titre "Votre offre", "Loyer mensuel HT", "Coût locatif annuel" et les éléments de flux restent toujours visibles.

### Comportement cible

| Élément | Toggle ON | Toggle OFF |
|---|---|---|
| Titre "Votre offre" | ✅ Visible | ✅ Visible |
| En-tête "Location X mois" | ✅ Visible | ✅ Visible |
| Ligne "Montant investissement" | ✅ Visible | ❌ Masquée |
| Ligne "Loyer mensuel HT" | ✅ Visible | ✅ Visible |
| Ligne "Coût locatif annuel" | ✅ Visible | ✅ Visible |
| Éléments de flux (Avantages, Conditions) | ✅ Visible | ✅ Visible |

### Modifications — 3 fichiers

**1. `src/stores/rentalProposalStore.ts`**

Renommer le champ `investShowOffer` en `investShowMontant` (ou conserver le nom mais en changer la sémantique). Pour limiter les risques de régression, on garde `investShowOffer` mais on change uniquement ce qu'il contrôle — pas de changement dans le store nécessaire.

**2. `src/components/rental-proposal/RentalDataEditor.tsx`**

Renommer le libellé du toggle :
- **Avant** : `Afficher "Votre offre"`
- **Après** : `Afficher le montant`

**3. `src/components/rental-proposal/RentalProposalPreview.tsx`** (lignes 823-867)

Retirer la condition globale sur `investShowOffer` qui enveloppait tout le bloc. À la place, ajouter la condition uniquement sur la ligne "Montant investissement" (lignes 840-843) :

```tsx
// AVANT — tout le bloc conditionnel
{isLastChunk && matriceData.investShowOffer !== false && (
  <>
    <div>Votre offre</div>
    ...
  </>
)}

// APRÈS — seule la ligne est conditionnelle
{isLastChunk && (
  <>
    <div>Votre offre</div>
    ...
    {/* Montant investissement - conditionnel */}
    {matriceData.investShowOffer !== false && (
      <div className="flex justify-between px-3 py-1 text-[10px]">
        <span>Montant investissement</span>
        <span>{formatNumber(proposal.montantInvestissement)} € HT</span>
      </div>
    )}
    {/* Loyer mensuel HT - toujours visible */}
    <div className="flex justify-between px-3 py-1 text-[10px]">
      <span>Loyer mensuel HT</span>
      ...
    </div>
  </>
)}
```

**4. `src/components/rental-proposal/RentalProposalExport.tsx`** (ligne 337-340)

La variable `offreAndProposalsHTML` ne doit plus être conditionnée globalement. À la place, dans `proposalsHTML` (ligne 337-340), la ligne `<tr>` "Montant investissement" est conditionnée par `matriceData.investShowOffer !== false` :

```html
${matriceData.investShowOffer !== false ? `
  <tr style="border-bottom: 1px solid #e5e7eb;">
    <td>Montant investissement</td>
    <td>${formatNumber(proposal.montantInvestissement)} € HT</td>
  </tr>
` : ''}
```

Et `offreAndProposalsHTML` redevient inconditionnelle (toujours générée).

### Résumé des changements

- **Store** : aucun changement (on réutilise `investShowOffer`)
- **RentalDataEditor.tsx** : label du toggle mis à jour
- **RentalProposalPreview.tsx** : condition déplacée de l'encapsulant vers la ligne seule
- **RentalProposalExport.tsx** : condition déplacée du bloc global vers la ligne `<tr>` seule + `offreAndProposalsHTML` rendu inconditionnellement

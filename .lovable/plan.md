

## Dissocier le montant d'investissement par proposition

### Probleme actuel
Le champ `montantInvestissement` est stocke globalement dans `matriceData`, partage entre toutes les propositions. Modifier ce champ dans la Proposition 1 modifie automatiquement la Proposition 2.

### Solution
Deplacer `montantInvestissement` dans chaque objet `MatriceProposal`, pour que chaque proposition ait son propre montant independant.

### Modifications

**1. `src/stores/rentalProposalStore.ts`**
- Ajouter `montantInvestissement: number | null` dans l'interface `MatriceProposal`
- Mettre a jour `createDefaultProposal()` pour inclure `montantInvestissement: null`
- Dans `importFromPDF` : initialiser chaque proposition avec le `montantInvestissement` du PDF
- Dans `getProposalCalculations` et `getAllProposalsCalculations` : utiliser `proposal.montantInvestissement` au lieu de `state.matriceData.montantInvestissement`
- Dans `getCalculatedValues` (legacy) : utiliser `firstProposal.montantInvestissement`
- Dans `duplicateProposal` : le montant est automatiquement copie (spread)
- Dans `updateLigne`, `addLigne`, `deleteLigne` : synchroniser le nouveau total HT vers **toutes les propositions** (ou seulement la premiere, selon le comportement souhaite -- on synchronisera vers toutes pour garder la coherence initiale apres import, mais l'utilisateur pourra ensuite les modifier individuellement)

**2. `src/components/rental-proposal/ProposalCard.tsx`**
- Retirer la prop `montantInvestissement` passee depuis le parent
- Utiliser `proposal.montantInvestissement` directement depuis l'objet proposal
- Changer `onUpdateMontant` pour appeler `onUpdate({ montantInvestissement: value })` au lieu d'une action globale
- Retirer la prop `onUpdateMontant` devenue inutile

**3. `src/components/rental-proposal/RentalDataEditor.tsx`**
- Retirer le passage de `montantInvestissement={matriceData.montantInvestissement}` et `onUpdateMontant`
- Chaque ProposalCard gerera son propre montant via `onUpdate`

**4. `src/components/rental-proposal/RentalProposalPreview.tsx`**
- Dans la boucle des propositions, remplacer `matriceData.montantInvestissement` par `proposal.montantInvestissement` pour le champ "Montant investissement" de chaque tableau
- Le "Total investissement" en haut (apres le tableau produits) reste base sur le total des lignes (il peut rester avec `matriceData.montantInvestissement` ou etre calcule depuis les lignes)

**5. `src/components/rental-proposal/RentalProposalExport.tsx`**
- Meme changement : dans chaque proposition du HTML genere, utiliser `proposal.montantInvestissement` au lieu de `matriceData.montantInvestissement`

### Detail technique

L'interface `MatriceProposal` deviendra :
```text
MatriceProposal {
  id: string
  montantInvestissement: number | null  // NOUVEAU
  duree: number | null
  refinanceur: Partenaire | null
  margeAppliquee: number
}
```

La synchronisation lignes produits -> montant investissement (dans `updateLigne`, `addLigne`, `deleteLigne`) continuera de mettre a jour `matriceData.montantInvestissement` comme valeur de reference, mais mettra aussi a jour toutes les propositions qui n'ont pas encore ete manuellement modifiees. En pratique, on synchronisera vers toutes les propositions pour garder le comportement initial coherent apres un import PDF, tout en permettant a l'utilisateur de modifier chaque montant individuellement ensuite.


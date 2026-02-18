

## Toggle d'affichage simplifie sur l'onglet Invest

### Objectif

Ajouter un interrupteur (switch) dans l'onglet Invest qui permet de basculer entre deux modes d'affichage :
- **Mode complet** (par defaut) : Designation + Nb + VUN + VTN + Total investissement
- **Mode simplifie** : Designation uniquement (pas de colonnes prix, pas de total)

Ce toggle affecte a la fois le tableau dans l'editeur de saisie ET le rendu PDF exporte.

### Modifications

| Fichier | Description |
|---|---|
| `src/stores/rentalProposalStore.ts` | Ajouter un champ `investShowPrices: boolean` (defaut `true`) et une action `toggleInvestShowPrices` |
| `src/components/rental-proposal/RentalDataEditor.tsx` | Ajouter un Switch au-dessus du tableau Invest pour masquer/afficher les colonnes Nb, VUN, VTN et le total |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Conditionner le rendu des colonnes Qte, P.U. HT, Total HT et du bloc "Total investissement" selon `investShowPrices` |

### Details techniques

**Store** : Nouveau champ booleen `investShowPrices` dans le state, initialise a `true`. Action `toggleInvestShowPrices()` qui inverse la valeur. Persiste via le middleware `persist` existant.

**Editeur (RentalDataEditor.tsx, onglet "invest")** :
- Ajouter un `Switch` avec label "Afficher les prix" entre le titre "Lignes produits (Invest)" et le bouton "Ajouter"
- Quand desactive : masquer les colonnes Nb, VUN, VTN dans le `<Table>` et le bloc total en bas
- Quand active : affichage actuel inchange

**Export PDF (RentalProposalExport.tsx)** :
- Lire `investShowPrices` depuis le store
- Si `false` : le `tableHeaderHTML` ne contient que la colonne "Designation", le `makeRowHTML` ne rend que la designation, le `totalHTML` est vide
- Le bloc "Votre offre" et les propositions financieres restent toujours affiches (non affectes)


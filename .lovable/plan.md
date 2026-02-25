

## Charger une proposition depuis l'historique pour reprendre l'edition

### Probleme actuel

La table `proposal_exports` ne stocke que des metadonnees (nom, client, montant) et le HTML final. Les donnees editables (lignes produits, matrice, options, proposals) ne sont pas sauvegardees, ce qui rend impossible le rechargement d'une proposition pour modification.

### Modifications

| Element | Detail |
|---|---|
| **Migration DB** | Ajouter une colonne `proposal_state` (JSONB, nullable) a `proposal_exports` pour stocker l'etat complet du store au moment de l'export |
| **`RentalProposalExport.tsx`** | Dans `saveToHistory`, serialiser et sauvegarder l'etat du store (clientData, commercialData, matriceData, proposals, lignesData, servicesInclus, optionsServices, nosOptions, proposalName, selectedTemplateId) dans `proposal_state` |
| **`rentalProposalStore.ts`** | Ajouter une action `loadFromExport(state)` qui restaure l'ensemble des champs du store depuis un snapshot JSON, en marquant `isActive: true` et `currentStep: 'data'` |
| **`HistoryView.tsx`** | Ajouter un bouton "Charger" (icone `RotateCcw`) sur chaque entree avec `status === 'success'`, a cote de Visualiser/Telecharger. Au clic, charger `proposal_state` depuis la DB et appeler un callback `onLoadProposal` |
| **`Index.tsx`** | Passer un `onLoadProposal` a `HistoryView` qui charge l'etat dans le store puis navigue vers `rental-workflow` |

### Detail technique : structure du snapshot

```text
proposal_state: {
  clientData: { nom, adresse, codePostal, ville, telephone, email, logoUrl },
  commercialData: { entity, commercialId },
  matriceData: { montantInvestissement, duree, refinanceur, ... },
  proposals: [{ id, montantInvestissement, duree, refinanceur, margeAppliquee, coefficientOverride }],
  lignesData: [{ reference, designation, prixUnitaire, quantite, totalHT, isSeparator? }],
  servicesInclus: { description },
  optionsServices: [{ id, name, description, price, ... }],
  nosOptions: [{ id, name, description, price, ... }],
  proposalName: string,
  selectedTemplateId: string | null,
}
```

### Flux utilisateur

1. L'utilisateur ouvre l'onglet Historique
2. Il clique sur le bouton "Charger" d'une proposition
3. Une confirmation s'affiche (la proposition en cours sera ecrasee)
4. Le store est restaure avec les donnees sauvegardees
5. La vue bascule automatiquement sur le workflow a l'etape "Donnees"

### Impact

- Les exports existants auront `proposal_state = null` : le bouton "Charger" sera desactive pour eux
- Les nouveaux exports sauvegarderont automatiquement l'etat complet
- Aucun impact sur les performances de la liste (le JSONB est charge uniquement a la demande, comme le HTML)


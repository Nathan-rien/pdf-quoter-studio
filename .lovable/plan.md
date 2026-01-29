
# Plan : Propositions Multiples dans l'onglet Matrice

## Objectif
Permettre de creer et gerer plusieurs propositions financieres (combinaisons de duree, marge, refinanceur) depuis l'onglet Matrice, afin d'afficher plusieurs scenarios sur le template PDF genere.

## Structure Actuelle
- Un seul objet `matriceData` dans le store stockant une proposition unique
- Un seul encart "Saisie" dans RentalDataEditor affichant 4 champs (Montant, Duree, Refinanceur, Marge)
- Un seul encart "Donnees" affichant les calculs derives
- La preview/PDF utilise une seule valeur de loyer mensuel

## Architecture Proposee

### 1. Nouveau Type de Donnees
```text
MatriceProposal {
  id: string (unique)
  duree: number | null
  refinanceur: Partenaire | null
  margeAppliquee: number
}
```
Le `montantInvestissement` reste global (partage entre toutes les propositions).

### 2. Modifications du Store (rentalProposalStore.ts)

**Nouveau champ** :
- `proposals: MatriceProposal[]` (tableau de propositions, max 3-4 recommande)

**Nouvelles actions** :
- `addProposal()` : Cree une nouvelle proposition avec valeurs par defaut
- `duplicateProposal(id)` : Duplique une proposition existante
- `updateProposal(id, updates)` : Met a jour une proposition specifique
- `deleteProposal(id)` : Supprime une proposition (si plus d'une)
- `getProposalCalculations(id)` : Retourne les calculs pour une proposition specifique

**Migration** :
- Initialiser `proposals` avec une proposition par defaut correspondant a l'ancien `matriceData`
- Conserver `matriceData.montantInvestissement` et `matriceData.showCoutLocatifAnnuel` comme champs globaux

### 3. Modifications de l'Interface (RentalDataEditor.tsx)

**Onglet Matrice restructure** :

```text
+-------------------------------------------------------+
|  Montant investissement HT : [14484]                  |  <- Champ global (partage)
+-------------------------------------------------------+

+-- Proposition 1 ------------------------ [Dupliquer] [X] --+
|  Duree: [36]   Refinanceur: [Lixxbail 1]   Marge: [6%]   |
|                                                           |
|  Donnees calculees:                                       |
|  Invest marge: 15408.51 | Coefficient: 3.0277             |
|  Loyer mensuel: 466.52 | Cout locatif annuel: 5.32%       |
+-----------------------------------------------------------+

+-- Proposition 2 ------------------------ [Dupliquer] [X] --+
|  Duree: [48]   Refinanceur: [Lixxbail 1]   Marge: [6%]   |
|                                                           |
|  Donnees calculees:                                       |
|  Invest marge: 15408.51 | Coefficient: 2.3821             |
|  Loyer mensuel: 366.89 | Cout locatif annuel: 4.18%       |
+-----------------------------------------------------------+

                               [+ Ajouter une proposition]
```

**Boutons d'action par proposition** :
- Dupliquer : Copie la proposition courante
- Supprimer (X) : Retire la proposition (desactive si une seule)

### 4. Affichage sur le Template/PDF

**Option A (Recommandee)** : Tableau comparatif
Les propositions sont affichees dans un tableau comparatif sur la zone "location_block" :

```text
+-------------+----------------+----------------+----------------+
|             | Proposition 1  | Proposition 2  | Proposition 3  |
+-------------+----------------+----------------+----------------+
| Duree       | 36 mois        | 48 mois        | 60 mois        |
| Loyer HT    | 466.52 EUR       | 366.89 EUR       | 308.25 EUR       |
| Cout annuel | 5.32%          | 4.18%          | 3.65%          |
+-------------+----------------+----------------+----------------+
```

**Option B** : Blocs superposes
Chaque proposition est affichee dans un bloc distinct, empile verticalement.

### 5. Fichiers a Modifier

| Fichier | Modifications |
|---------|---------------|
| `src/stores/rentalProposalStore.ts` | Ajouter type `MatriceProposal`, champ `proposals[]`, actions CRUD |
| `src/lib/rental-calculations.ts` | Creer `calculateProposalValues(proposal, montant, optionsPrices)` |
| `src/components/rental-proposal/RentalDataEditor.tsx` | Refactoriser onglet Matrice pour afficher plusieurs propositions |
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Adapter le rendu pour afficher toutes les propositions |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Injecter les donnees de toutes les propositions dans le PDF |
| `src/lib/pdf-html-generator.ts` | Adapter le rendu du "location_block" pour le mode multi-propositions |

### 6. Persistence et Migration

- Les donnees existantes sont migrees automatiquement via `onRehydrateStorage`
- Si `proposals` est vide mais `matriceData` existe, creer une proposition initiale a partir des valeurs existantes
- Limite recommandee : 4 propositions maximum (contrainte d'espace sur le PDF)

### 7. Validation

- Au moins une proposition doit toujours exister
- Chaque proposition doit avoir une duree valide (12, 24, 36, 48, 60 mois)
- Avertissement si plus de 3 propositions (risque de debordement sur le template)

## Estimation

- Complexite : Moyenne
- Impact : Store, UI Matrice, Preview, Export PDF
- Risques : Espace disponible sur le template pour afficher plusieurs propositions

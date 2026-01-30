
# Plan : Synchroniser le total des lignes Invest avec le Montant Investissement

## Problème identifié

Dans l'étape "Données" du workflow Proposition, l'onglet "Invest" permet d'ajouter/modifier/supprimer des lignes produits. Chaque ligne a un champ VTN (totalHT) calculé automatiquement.

**Le problème** : Le total des VTN de toutes les lignes n'est pas synchronisé avec le champ `montantInvestissement` utilisé dans l'onglet "Matrice" pour les calculs financiers (loyer mensuel, coût du contrat, marge, etc.).

Actuellement :
- Import PDF → `montantInvestissement` = Total HT du PDF ✓
- Modification d'une ligne → `totalHT` de la ligne recalculé ✓
- Ajout d'une nouvelle ligne → `montantInvestissement` **non mis à jour** ✗

## Solution

Ajouter une fonction utilitaire pour calculer le total des lignes et mettre à jour automatiquement `montantInvestissement` à chaque modification de `lignesData`.

## Fichier à modifier

| Fichier | Modification |
|---------|--------------|
| `src/stores/rentalProposalStore.ts` | Ajouter la synchronisation du total dans `updateLigne`, `addLigne`, et `deleteLigne` |

## Détail des modifications

### 1. Créer une fonction helper pour calculer le total

```typescript
// Helper pour calculer le total des lignes
const calculateLignesTotal = (lignes: PDFProductLine[]): number => {
  return Math.round(
    lignes.reduce((sum, ligne) => sum + (ligne.totalHT || 0), 0) * 100
  ) / 100;
};
```

### 2. Modifier `updateLigne` (ligne ~394)

Après avoir recalculé le `totalHT` d'une ligne, recalculer et mettre à jour `montantInvestissement` :

```typescript
updateLigne: (index, updates) => {
  set(state => {
    const newLignes = [...state.lignesData];
    if (newLignes[index]) {
      newLignes[index] = { ...newLignes[index], ...updates };
      // Recalculate totalHT if quantity or unit price changed
      if (updates.quantite !== undefined || updates.prixUnitaire !== undefined) {
        const ligne = newLignes[index];
        if (ligne.prixUnitaire !== null) {
          ligne.totalHT = Math.round(ligne.prixUnitaire * ligne.quantite * 100) / 100;
        }
      }
    }
    
    // Recalculer le montant investissement total
    const newMontantInvestissement = calculateLignesTotal(newLignes);
    
    return { 
      lignesData: newLignes, 
      matriceData: { ...state.matriceData, montantInvestissement: newMontantInvestissement },
      hasUnsavedChanges: true 
    };
  });
},
```

### 3. Modifier `addLigne` (ligne ~411)

Après avoir ajouté une nouvelle ligne, recalculer le total (même si la nouvelle ligne a `totalHT: 0`, pour cohérence) :

```typescript
addLigne: () => {
  set(state => {
    const newLignes = [
      ...state.lignesData,
      { reference: null, designation: '', prixUnitaire: null, quantite: 1, totalHT: 0 },
    ];
    const newMontantInvestissement = calculateLignesTotal(newLignes);
    
    return {
      lignesData: newLignes,
      matriceData: { ...state.matriceData, montantInvestissement: newMontantInvestissement },
      hasUnsavedChanges: true,
    };
  });
},
```

### 4. Modifier `deleteLigne` (ligne ~421)

Après avoir supprimé une ligne, recalculer le total :

```typescript
deleteLigne: (index) => {
  set(state => {
    const newLignes = state.lignesData.filter((_, i) => i !== index);
    const newMontantInvestissement = calculateLignesTotal(newLignes);
    
    return {
      lignesData: newLignes,
      matriceData: { ...state.matriceData, montantInvestissement: newMontantInvestissement },
      hasUnsavedChanges: true,
    };
  });
},
```

## Flux de données après modification

```text
┌─────────────────────────────────────────────────────────────────┐
│                     Onglet "Invest"                             │
├─────────────────────────────────────────────────────────────────┤
│ Ligne 1: Mémoire Synology → Nb: 4 × VUN: 544 = VTN: 2176.00 €  │
│ Ligne 2: Chassis NAS      → Nb: 2 × VUN: 1611 = VTN: 3222.00 € │
│ Ligne 3: Disque dur       → Nb: 24 × VUN: 338 = VTN: 8112.00 € │
│ Ligne 4: Prestation       → Nb: 2 × VUN: 487 = VTN: 974.00 €   │
│ Ligne 5: (nouvelle)       → Nb: 1 × VUN: 500 = VTN: 500.00 €   │ ← Ajoutée
│                                                                 │
│                           Total affiché: 14,984.00 €            │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ Synchronisation automatique
┌─────────────────────────────────────────────────────────────────┐
│                     Onglet "Matrice"                            │
├─────────────────────────────────────────────────────────────────┤
│ Montant investissement HT: 14,984.00 €   ← Mis à jour auto     │
│                                                                 │
│ Invest Margé: 15,940.43 €                                       │
│ Loyer mensuel HT: 553.25 €                                      │
│ Coût du contrat: 4,933.00 €                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Points techniques

- L'arrondi à 2 décimales (`Math.round(x * 100) / 100`) est appliqué pour éviter les erreurs de précision floating-point
- La synchronisation est bidirectionnelle : les modifications dans l'onglet Invest mettent à jour l'onglet Matrice
- Le champ "Montant investissement HT" dans l'onglet Matrice reste modifiable manuellement (si l'utilisateur veut forcer une valeur différente)
- Conforme à la mémoire `decimal-precision-handling` pour le traitement des décimales

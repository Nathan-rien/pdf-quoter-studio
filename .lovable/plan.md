
## Correctif : Montant investissement HT synchronisé depuis l'onglet Invest dès l'import

### Problème

Dans `rentalProposalStore.ts`, la fonction `importFromPDF` utilise `result.totaux.totalHT` pour initialiser le champ "Montant investissement HT" de chaque proposition. Pour les PDFs de type "Commande" Cybertek, cette valeur est extraite du texte global du PDF et peut être mal parsée (valeur absurde comme `408772960`).

Pendant ce temps, l'onglet **Invest** affiche la somme réelle des lignes produits (1 469,95 €) car ces lignes sont correctement extraites dans `result.lignes`. Les deux sont incohérents dès l'ouverture.

### Solution : Calculer le montantInvestissement depuis la somme des lignes Invest

Remplacer la lecture de `result.totaux.totalHT` par le calcul de la somme des `totalHT` des lignes produits, avec un repli sur `result.totaux.totalHT` si aucune ligne n'est disponible.

```typescript
// AVANT (ligne 259)
const montantInvestissement = result.totaux.totalHT;

// APRÈS
const lignesTotal = result.lignes.length > 0
  ? Math.round(result.lignes.reduce((sum, ligne) => sum + (ligne.totalHT || 0), 0) * 100) / 100
  : null;

const montantInvestissement = lignesTotal ?? result.totaux.totalHT;
```

**Logique de priorité :**
| Cas | Source utilisée |
|-----|----------------|
| Des lignes produits existent dans Invest | Somme des VTN (source fiable) |
| Aucune ligne produit extraite | `totalHT` du PDF (fallback) |

Cette logique est cohérente avec ce qui se passe déjà quand l'utilisateur modifie manuellement une ligne Invest (les actions `updateLigne`, `addLigne`, `deleteLigne` dans le store recalculent déjà le `montantInvestissement` depuis la somme des lignes).

### Fichier modifié

**`src/stores/rentalProposalStore.ts`** — uniquement la ligne 259 dans `importFromPDF()`

Aucune modification d'interface, aucune migration base de données. Les propositions déjà en cours ne sont pas affectées (le localStorage existant reste intact, seul le prochain import recevra la valeur corrigée).

### Résultat attendu

Pour le PDF `Commande_6397708_20260217_10h21.pdf` :

| Champ | Avant | Après |
|-------|-------|-------|
| Montant investissement HT (Saisie) | 408 772 960,00 € | 1 469,95 € |
| Total Invest | 1 469,95 € | 1 469,95 € (inchangé) |
| Calculs Matrice (Investir Margé, Loyer...) | Valeurs aberrantes | Valeurs correctes |


# Plan : Afficher les propositions financières sur le template PDF

## Contexte

L'utilisateur souhaite que les propositions financières créées dans l'onglet "Matrice" (Saisie) apparaissent dans le template PDF, sous le tableau "Désignation" (produits) de la page 4.

### Format attendu (basé sur le screenshot)
Chaque proposition s'affiche sous forme d'un tableau compact :

```text
+------------------------------------------------------------+
| Location 36 mois                                            |
+------------------------------------------------------------+
| Montant investissement                      1670,50€ HT     |
+------------------------------------------------------------+
| Loyer mensuel HT                            62,99 € HT      |
+------------------------------------------------------------+
```

Si plusieurs propositions existent (ex: 36 mois et 24 mois), elles s'empilent verticalement les unes sous les autres.

## Architecture actuelle

1. **Store** (`rentalProposalStore.ts`) : 
   - `proposals: MatriceProposal[]` contient les propositions (durée, refinanceur, marge)
   - `getAllProposalsCalculations()` retourne les calculs pour chaque proposition

2. **Aperçu** (`RentalProposalPreview.tsx`) :
   - Page 4 : `renderProductPage()` affiche le tableau des produits + totaux
   - Les éléments statiques suivent le tableau en flux relatif via `elementsBelow`

3. **Export PDF** (`RentalProposalExport.tsx`) :
   - `generateDynamicContentByPage()` génère le HTML pour la page 4
   - Injecte le tableau produits + totaux dans la zone dynamique

## Modifications prévues

### 1. Store - Exposer les données calculées (src/stores/rentalProposalStore.ts)

**Aucune modification nécessaire** : `getAllProposalsCalculations()` existe déjà et retourne les calculs pour toutes les propositions.

### 2. Aperçu - Afficher les propositions sous le tableau (src/components/rental-proposal/RentalProposalPreview.tsx)

Dans la fonction `renderProductPage()` (page 4), après le bloc "Totaux" :

```text
Tableau Désignation (produits)
     ↓
Sous-total HT / Total investissement
     ↓
[NOUVEAU] Tableaux des propositions de location
     ↓
Éléments statiques (Avantages, Conditions...)
```

**Implémentation** :
- Récupérer `proposals` et `getAllProposalsCalculations()` depuis le store
- Pour chaque proposition, générer un bloc :
  - Titre : "Location {durée} mois"
  - Ligne 1 : "Montant investissement" | "{montant}€ HT"
  - Ligne 2 : "Loyer mensuel HT" | "{loyer}€ HT"
- Style : bordure simple, fond blanc, texte compact (9-10px)

### 3. Export PDF - Injecter les propositions dans le HTML (src/components/rental-proposal/RentalProposalExport.tsx)

Dans `generateDynamicContentByPage()`, modifier `dynamicContent[4]` pour ajouter les blocs propositions après les totaux.

**Implémentation** :
- Récupérer `getAllProposalsCalculations()` depuis le store
- Générer le HTML des tableaux de proposition avec le même format visuel que l'Aperçu
- Insérer ce HTML après le bloc "summary-box" (totaux)

## Structure HTML des propositions

```html
<div class="location-proposals" style="margin-top: 16px;">
  <!-- Proposition 1 -->
  <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 12px; border: 1px solid #d1d5db;">
    <thead>
      <tr style="background: #f9fafb; border-bottom: 1px solid #d1d5db;">
        <th colspan="2" style="padding: 8px; text-align: left; font-weight: 600;">Location 36 mois</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 6px 8px;">Montant investissement</td>
        <td style="padding: 6px 8px; text-align: right;">14 484,00€ HT</td>
      </tr>
      <tr>
        <td style="padding: 6px 8px;">Loyer mensuel HT</td>
        <td style="padding: 6px 8px; text-align: right; font-weight: 600;">466,52 € HT</td>
      </tr>
    </tbody>
  </table>
  
  <!-- Proposition 2 (si présente) -->
  <table>...</table>
</div>
```

## Fichiers à modifier

| Fichier | Modifications |
|---------|---------------|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Ajouter le rendu des propositions dans `renderProductPage()` après les totaux |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Ajouter le HTML des propositions dans `dynamicContent[4]` |

## Points techniques

1. **Ordre d'affichage** : Les propositions s'affichent dans l'ordre du tableau `proposals` (ordre de création/duplication)
2. **Formatage** : Utiliser `formatNumber()` existant pour les montants (format français)
3. **Espace** : Les propositions sont insérées entre les totaux et les éléments statiques "below" (Avantages, Conditions)
4. **Limite visuelle** : Si 4 propositions, prévoir un espacement compact (mb-2 au lieu de mb-3)

## Flux de rendu (Page 4)

```text
┌─────────────────────────────────────────────────────┐
│  Votre offre                                        │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐    │
│  │ Désignation | Qté | P.U. HT | Total HT      │    │
│  │ ...                                          │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│                   ┌─────────────────┐               │
│                   │ Sous-total HT   │               │
│                   │ Total invest    │               │
│                   └─────────────────┘               │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │  ← NOUVEAU
│  │ Location 36 mois                             │    │
│  │ Montant investissement      14 484,00€ HT   │    │
│  │ Loyer mensuel HT               466,52 € HT  │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │  ← Si 2ème proposition
│  │ Location 24 mois                             │    │
│  │ Montant investissement      14 484,00€ HT   │    │
│  │ Loyer mensuel HT               552,80 € HT  │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Avantages :                                        │  ← Éléments statiques
│  • Apport en trésorerie...                         │
│  Condition de l'offre :                            │
│  • Les loyers sont payables...                     │
└─────────────────────────────────────────────────────┘
```

## Estimation

- Complexité : Faible
- Impact : Aperçu (Preview) + Export PDF
- Fichiers modifiés : 2

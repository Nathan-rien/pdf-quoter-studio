
# Plan : Retirer l'intitulé "Client" et l'icône sur la Page 1

## Problème identifié

Sur la première page du template (page de couverture), le bloc d'informations client affiche actuellement :
- Une icône `User` 
- Le label "Client"

L'utilisateur souhaite retirer ces deux éléments tout en conservant les données du client (nom, adresse, etc.).

## Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Supprimer l'icône User et le label "Client" dans `renderClientData()` et `fallbackContent` |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Supprimer le label "Client" dans le HTML de la page 1 |

## Détail des modifications

### 1. RentalProposalPreview.tsx

**Dans `renderClientData()` (lignes 555-560)** :
```jsx
// AVANT
<div className="flex items-center gap-2 mb-2">
  <User className="h-3 w-3 text-primary" />
  <span className="font-medium text-[10px]">Client</span>
</div>

// APRÈS (supprimer ce bloc entier)
// Conserver uniquement les données client directement
```

**Dans `fallbackContent` (lignes 604-608)** :
```jsx
// AVANT
<div className="flex items-center gap-2 mb-3">
  <User className="h-4 w-4 text-primary" />
  <span className="font-medium text-sm">Client</span>
</div>

// APRÈS (supprimer ce bloc entier)
```

### 2. RentalProposalExport.tsx

**Dans `generateDynamicContentByPage()` - page 1 (lignes 240-243)** :
```html
<!-- AVANT -->
<div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
  <span style="font-weight: 600; font-size: 10px;">Client</span>
</div>

<!-- APRÈS (supprimer ce bloc entier) -->
```

## Résultat attendu

### Avant
```text
┌─────────────────────────────────────────┐
│   👤 Client                              │
│   GROUPE KEDGE BUSINESS SCHOOL           │
│   DOMAINE DE RABA 680 COURS...           │
│   33400 TALENCE                          │
└─────────────────────────────────────────┘
```

### Après
```text
┌─────────────────────────────────────────┐
│   GROUPE KEDGE BUSINESS SCHOOL           │
│   DOMAINE DE RABA 680 COURS...           │
│   33400 TALENCE                          │
└─────────────────────────────────────────┘
```

## Points techniques

- Le bloc "Votre interlocuteur" (commercial) conserve son titre et son icône `Briefcase`
- Seul le côté "Client" perd son intitulé et son icône
- La mise en page en 2 colonnes reste inchangée

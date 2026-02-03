

# Plan : Renforcer la séparation visuelle entre les champs Désignation

## Contexte

Actuellement, les lignes de produits dans le tableau sont séparées par une fine ligne (`divide-y divide-muted/50`), mais les descriptions multi-lignes peuvent se fondre visuellement. L'utilisateur souhaite une séparation plus marquée.

## Fichier à modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Renforcer le style visuel des séparateurs entre lignes produit |

## Modification proposée

Dans la fonction `renderProductTableWithFlowElements` (lignes 737-746), modifier le style des lignes du tableau :

```typescript
// AVANT (ligne 737-745) :
<div className="divide-y divide-muted/50">
  {pageLines.map((ligne, idx) => (
    <div key={idx} className="grid grid-cols-12 gap-1 px-2 py-0.5 text-[9px] items-start">
      <div className="col-span-6 break-words whitespace-normal leading-snug">{ligne.designation || '-'}</div>
      ...
    </div>
  ))}
</div>

// APRÈS :
<div className="divide-y divide-border">
  {pageLines.map((ligne, idx) => (
    <div 
      key={idx} 
      className="grid grid-cols-12 gap-1 px-2 py-1.5 text-[9px] items-start bg-white even:bg-muted/20"
    >
      <div className="col-span-6 break-words whitespace-normal leading-snug py-0.5">{ligne.designation || '-'}</div>
      ...
    </div>
  ))}
</div>
```

## Améliorations visuelles

| Propriété | Avant | Après |
|-----------|-------|-------|
| Bordure séparatrice | `divide-muted/50` (très légère) | `divide-border` (bordure standard visible) |
| Padding vertical | `py-0.5` (2px) | `py-1.5` (6px) |
| Alternance de couleur | Aucune | `even:bg-muted/20` (lignes paires légèrement grisées) |
| Padding colonne désignation | Aucun | `py-0.5` (espacement interne du texte) |

## Résultat attendu

- Bordures plus visibles entre chaque produit
- Espacement vertical accru pour une meilleure lisibilité
- Alternance de couleur (lignes paires légèrement grisées) pour distinguer les blocs
- Meilleure respiration visuelle pour les longues descriptions multi-lignes


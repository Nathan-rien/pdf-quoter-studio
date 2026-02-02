

# Plan : Optimiser l'espace sur la Page 4 pour éviter la troncature du texte

## Problème identifié

Sur la Page 4 de l'aperçu de proposition (et du PDF), lorsque le tableau Invest est fourni avec beaucoup de lignes, le texte en bas ("Avantages" et "Condition de l'offre") est tronqué car le contenu dépasse la zone visible de la page.

**Causes racines :**
1. Le tableau dynamique commence à `top: '15%'` (ligne 724) alors qu'il pourrait démarrer plus haut
2. Les marges entre les blocs sont trop généreuses (`mt-4` = 16px, `mt-2` = 8px)
3. Les paddings internes des blocs (`py-3`, `py-2`, `py-1.5`) consomment de l'espace

## Solution

Réduire les espacements pour gagner de l'espace vertical et permettre au texte en bas de s'afficher entièrement.

## Fichier à modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Ajuster les valeurs de positionnement et d'espacement dans `renderProductPage()` |

## Détail des modifications

### 1. Remonter le point de départ du bloc dynamique

```typescript
// Ligne 724 - AVANT
top: '15%',

// APRÈS  
top: '10%',
```

Gain : environ 5% de la hauteur de page (≈ 46px sur un canvas de 919px)

### 2. Réduire les marges entre les sections

| Élément | Avant | Après | Gain |
|---------|-------|-------|------|
| Bloc "Total investissement" | `mt-2` (8px) | `mt-1` (4px) | 4px |
| Bloc "Location X mois" | `mt-4 space-y-3` (16px + 12px) | `mt-2 space-y-2` (8px + 8px) | 12px |
| Éléments en flux relatif | `mt-4 mb-2` (16px + 8px) | `mt-2 mb-1` (8px + 4px) | 12px |

### 3. Compacter les paddings internes des blocs financiers

| Élément | Avant | Après | Gain |
|---------|-------|-------|------|
| Bloc Total investissement | `p-3` (12px) | `p-2` (8px) | 8px |
| Header Location | `py-2` (8px) | `py-1.5` (6px) | 4px |
| Lignes Location | `py-1.5` (6px) | `py-1` (4px) | 4px par ligne |

### 4. Code modifié (extrait)

```typescript
const renderProductTableWithFlowElements = () => (
  <div 
    className="absolute bg-white"
    style={{
      left: '3%',
      top: '10%',  // ← Remonté de 15% à 10%
      width: '94%',
    }}
  >
    {/* Tableau des produits (inchangé) */}
    <div className="border rounded overflow-hidden">
      {/* ... */}
    </div>
    
    {/* Totaux - marges réduites */}
    <div className="mt-1 flex justify-end">  {/* ← mt-2 → mt-1 */}
      <div className="bg-primary/5 rounded-lg p-2 min-w-[180px]">  {/* ← p-3 → p-2 */}
        {/* ... */}
      </div>
    </div>
    
    {/* Propositions financières - espacements réduits */}
    <div className="mt-2 space-y-2">  {/* ← mt-4 space-y-3 */}
      {allProposals.map(({ proposal, calculations }) => (
        <div key={proposal.id} className="border rounded overflow-hidden">
          <div className="bg-muted px-3 py-1.5">  {/* ← py-2 → py-1.5 */}
            {/* ... */}
          </div>
          <div className="divide-y divide-border">
            <div className="flex justify-between px-3 py-1 text-[10px]">  {/* ← py-1.5 → py-1 */}
              {/* ... */}
            </div>
          </div>
        </div>
      ))}
    </div>
    
    {/* Éléments en flux relatif - marge réduite */}
    {elementsBelow.length > 0 && (
      <div className="mt-2">  {/* ← mt-4 */}
        {elementsBelow.map(el => renderFlowElement(el))}
      </div>
    )}
  </div>
);
```

Et dans `renderFlowElement` :

```typescript
<div
  key={element.id}
  className="mb-1"  // ← mb-2 → mb-1
  style={{...}}
>
```

## Gains estimés

| Source | Gain approximatif |
|--------|-------------------|
| Top 15% → 10% | 46px |
| Marges réduites | 28px |
| Paddings réduits | 16px |
| **Total** | **~90px** (≈ 10% de la page) |

## Résultat attendu

| Avant | Après |
|-------|-------|
| Texte "Avantages" et "Condition de l'offre" tronqués | Texte entièrement visible |
| Espacement aéré gaspillant l'espace | Mise en page compacte mais lisible |
| Rendu visuel différent de l'image attendue | Rendu cohérent avec l'espace disponible |

## Impact WYSIWYG

Ces modifications affectent uniquement le rendu dans `RentalProposalPreview.tsx`. Si les mêmes valeurs sont utilisées dans `RentalProposalExport.tsx`, il faudra également les synchroniser pour garantir la parité WYSIWYG.


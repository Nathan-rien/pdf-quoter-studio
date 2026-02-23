

## Corriger le rendu du logo client : appliquer la hauteur au conteneur, pas a l'image

### Probleme
Le logo entite est rendu via un wrapper `div` qui recoit `width` et `height` en pourcentage du canvas (via `getSharedElementStyle`), avec l'image en `w-full h-full object-contain`. Le logo client, lui, applique `height: X%` directement sur la balise `img`, a l'interieur d'un wrapper `div` sans hauteur explicite. En CSS, un pourcentage de hauteur sur un enfant est ignore si le parent n'a pas de hauteur definie. Resultat : l'image s'affiche a sa taille naturelle, beaucoup trop grande.

### Solution
Deplacer la propriete `heightPct` (et `heightPx`) du `img` vers le wrapper `div`, puis utiliser `w-full h-full object-contain` sur l'image, exactement comme le fait le rendu du logo entite.

### Fichier modifie

| Fichier | Modification |
|---|---|
| `ClientLogoDraggable.tsx` | Appliquer `heightStyle` et `width` sur le wrapper `div`, mettre l'image en `w-full h-full object-contain` |

### Detail technique

**Avant (simplifie) :**
```text
<div style={{ top, left, position: absolute }}>          <!-- pas de hauteur -->
  <img style={{ height: '7.8%', objectFit: contain }} />  <!-- % ignore -->
</div>
```

**Apres :**
```text
<div style={{ top, left, position: absolute, height: '7.8%', width: '...' }}>
  <img className="w-full h-full object-contain" />
</div>
```

Cela reproduit exactement le pattern de rendu du logo entite dans `PreviewEditableCanvas` (lignes 329-349) et garantit que le pourcentage de hauteur est resolu par rapport au conteneur du canvas (qui a une hauteur explicite via `aspect-[210/297]`).

Le meme changement s'applique aux deux modes de rendu du composant (lecture et edition). La largeur du wrapper sera definie soit par `width` (override en px) soit par `auto` (taille naturelle de l'image contrainte par la hauteur).

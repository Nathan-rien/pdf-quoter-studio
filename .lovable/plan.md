

# Plan : Éléments statiques qui suivent la zone dynamique

## Problème identifié

Sur la Page 4 "Votre offre neuf + rachat", les éléments texte statiques ("Avantages", "Condition de l'offre") sont positionnés de manière absolue selon leurs coordonnées dans le template. Cependant, le tableau Invest dynamique a une hauteur variable selon le nombre de produits. 

**Résultat** : quand le tableau est petit, un large espace vide apparaît entre le tableau et les textes en dessous.

**Objectif** : Les éléments situés sous la zone dynamique doivent "suivre" automatiquement et rester collés juste après le tableau, quelle que soit sa hauteur.

---

## Approche technique

### Option A : Flux relatif conditionnel (recommandée)

Au lieu de rendre tous les éléments en `position: absolute`, on identifie ceux situés **sous** la zone dynamique et on les rend en **flux relatif** (flow layout), juste après le tableau.

**Principe :**
1. Identifier la zone dynamique `invest_table_page4` et sa position Y (`top: 28%` dans l'éditeur)
2. Partitionner les éléments statiques de la page en deux groupes :
   - **Groupe "au-dessus"** : éléments dont `position.y` < zone dynamique top → rendu absolu
   - **Groupe "en-dessous"** : éléments dont `position.y` > zone dynamique bottom → rendu en flux relatif après le tableau

### Option B : Nouvelle propriété "flowBelowDynamic"

Ajouter un flag optionnel `flowBelowDynamicZone?: string` sur les éléments du template. Si défini, l'élément sera rendu dans le flux après la zone dynamique spécifiée.

---

## Solution retenue : Option A (automatique)

Plus simple et ne nécessite pas de modification du modèle de données. On détecte automatiquement les éléments "en dessous" via leurs coordonnées.

---

## Modifications prévues

### 1. `RentalProposalPreview.tsx` - Fonction `renderProductPage()`

**Logique actuelle :**
```tsx
const renderProductPage = () => {
  const staticElements = getStaticPageElements(4);
  
  const renderProductTable = () => (
    <div className="absolute" style={{ top: '15%', ... }}>
      {/* Tableau + totaux */}
    </div>
  );
  
  return renderPageWithEditMode(4, staticElements, renderProductTable);
};
```

**Logique modifiée :**
```tsx
const renderProductPage = () => {
  const staticElements = getStaticPageElements(4);
  
  // Seuil Y (en pixels canvas 650x919) pour séparer "au-dessus" / "en-dessous"
  const dynamicZoneBottomY = 400; // ~43% de 919 (28% top + 15% height env.)
  
  // Partition des éléments
  const elementsAbove = staticElements.filter(el => el.position.y < dynamicZoneBottomY);
  const elementsBelow = staticElements.filter(el => el.position.y >= dynamicZoneBottomY);
  
  // Rendu mixte : absolu pour "above", flux pour "below"
  return (
    <div className="relative h-full">
      {/* Éléments au-dessus : position absolue classique */}
      {elementsAbove.map(el => renderTemplateElement(el))}
      
      {/* Conteneur flux : tableau + éléments en-dessous */}
      <div className="absolute left-[3%] top-[15%] w-[94%]">
        {/* Tableau dynamique */}
        <div className="...">...</div>
        
        {/* Totaux */}
        <div className="mt-2">...</div>
        
        {/* Éléments "below" rendus en flux relatif */}
        <div className="mt-4 relative">
          {elementsBelow.map(el => renderFlowElement(el))}
        </div>
      </div>
      
      <PageFooter />
    </div>
  );
};
```

### 2. Nouvelle fonction `renderFlowElement()`

Rend un élément du template en **position relative** au lieu d'absolue, en conservant ses styles (police, couleur, etc.) mais en ignorant `position.x/y`.

```tsx
const renderFlowElement = (element: EditableElement) => {
  // Même logique de rendu que renderTemplateElement()
  // mais sans position: absolute
  // Garde le margin-bottom pour espacer les blocs
};
```

### 3. Calcul dynamique du seuil

Pour être robuste, le seuil Y pourrait être calculé à partir de la zone dynamique réelle :

```tsx
const dynamicZone = currentVersion?.pages
  .find(p => p.pageNumber === 4)
  ?.dynamicZones.find(z => z.type === 'invest_table');

const zoneTopPercent = dynamicZone?.position?.top ?? 28;
const zoneHeightPercent = dynamicZone?.position?.height ?? 15;
const dynamicZoneBottomY = ((zoneTopPercent + zoneHeightPercent) / 100) * CANVAS_SCALE.height;
```

---

## Fichiers modifiés

| Fichier | Changement |
|---------|------------|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Refactoriser `renderProductPage()` pour séparer les éléments au-dessus/en-dessous et les rendre différemment |

---

## Résultat attendu

```text
┌────────────────────────────────────────┐
│  Éléments au-dessus (position: abs)    │  ← Titre, sous-titre
├────────────────────────────────────────┤
│  ┌────────────────────────────────┐    │
│  │  Tableau Invest (dynamique)    │    │  ← Hauteur variable
│  │  - Produit 1                   │    │
│  │  - Produit 2                   │    │
│  └────────────────────────────────┘    │
│  ┌────────────────────────────────┐    │
│  │  Totaux                        │    │  ← Toujours collé
│  └────────────────────────────────┘    │
│                                        │
│  Avantages :                           │  ← FLUX : suit le tableau
│  • Point 1                             │
│  • Point 2                             │
│                                        │
│  Condition de l'offre :                │  ← FLUX : suit "Avantages"
│  • Condition 1                         │
│                                        │
├────────────────────────────────────────┤
│  Footer                                │
└────────────────────────────────────────┘
```

---

## Considérations WYSIWYG

Dans l'éditeur de template, les éléments restent positionnés de manière absolue (drag & drop). L'aperçu et l'export PDF appliquent une logique de **flux conditionnel** pour les éléments sous les zones dynamiques.

Cette divergence est acceptable car :
- L'éditeur est un outil de **placement visuel** (où positionner les éléments)
- L'aperçu/export est le **rendu final** (où le contenu dynamique dicte la mise en page)

---

## Détails techniques

### Seuil de partition

Le seuil Y sera calculé dynamiquement :
- Récupérer la zone `invest_table_page4` depuis `currentVersion`
- Calculer `bottomY = (zone.position.top + zone.position.height) / 100 * CANVAS_SCALE.height`
- Si la zone n'a pas de position personnalisée, utiliser les valeurs par défaut (`top: 28%`, `height: 48%`)

### Tri des éléments "below"

Les éléments du groupe "en-dessous" seront triés par `position.y` croissant pour respecter l'ordre visuel défini dans l'éditeur.

### Conservation du style

Chaque élément conserve :
- Police, taille, couleur, gras, italique
- Alignement du texte
- Largeur maximale (pour le retour à la ligne)


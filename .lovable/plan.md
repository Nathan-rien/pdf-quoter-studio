
# Plan : Corriger la fidélité du rendu PDF par rapport à l'Aperçu

## Problèmes identifiés

### Comparaison Aperçu vs PDF téléchargé

| Élément | Aperçu (workflow) | PDF Chrome | Cause |
|---------|------------------|------------|-------|
| Icônes Lucide | Affichées correctement | Absentes | Rendu en `<div>` vide |
| Fonds des cartes | Visibles avec couleur | Partiellement ou absents | z-index non normalisé |
| Positions éléments | Correctes | Décalées | Différence de base de calcul |
| Page 7 (Services) | 8 cartes avec pictos | Cartes vides sans icônes | Icônes non converties en SVG |
| Page 8 (Signature) | Éléments du template | Récapitulatif injecté en plus | Injection dynamique superposée |

## Solution technique

### 1. Supprimer l'injection dynamique sur la dernière page

**Fichier** : `src/components/rental-proposal/RentalProposalExport.tsx`

Supprimer le bloc d'injection `dynamicContent[lastPage]` (lignes 307-361) qui génère un "Récapitulatif de votre offre" car :
- La page 8 du template contient déjà les zones de signature
- Cela provoque un chevauchement avec les éléments statiques

### 2. Ajouter le rendu SVG inline des icônes Lucide

**Fichier** : `src/lib/pdf-html-generator.ts`

Créer une fonction `renderIconSVG(iconName)` qui génère le SVG inline :

```typescript
// Mapping des icônes utilisées vers leurs paths SVG
const LUCIDE_SVG_PATHS: Record<string, string> = {
  'Recycle': '<path d="M7 19H4.815a1.83..." />',
  'Shield': '<path d="M12 22s8-4 8-10V5l-8..." />',
  // ... autres icônes utilisées
};

function renderIconSVG(iconName: string, size: number, color: string): string {
  const path = LUCIDE_SVG_PATHS[iconName];
  if (!path) return '';
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" 
    fill="none" stroke="${color}" stroke-width="2">
    ${path}
  </svg>`;
}
```

### 3. Normaliser le z-index dans le générateur HTML

**Fichier** : `src/lib/pdf-html-generator.ts`

Appliquer la même normalisation que l'Aperçu :

```typescript
// Identique à RentalProposalPreview.tsx
const pdfZIndex = (el: EditableElement): number => (el.zIndex ?? 0) + 10;

function renderShapeElementToHTML(element: EditableElement): string {
  const content = element.content as ShapeContent;
  const positionStyle = getSharedElementStyle({ element });
  
  const shapeStyle = {
    ...positionStyle,
    zIndex: pdfZIndex(element), // AJOUT: normalisation z-index
    // ... reste du code
  };
}
```

### 4. Corriger le rendu des formes avec icônes internes

**Fichier** : `src/lib/pdf-html-generator.ts`

Dans la fonction `renderShapeElementToHTML`, ajouter le rendu de l'icône interne :

```typescript
let iconHtml = '';
if (content.innerContent?.icon) {
  const icon = content.innerContent.icon;
  iconHtml = renderIconSVG(icon.name, icon.size * PREVIEW_ICON_SCALE, icon.color);
}

innerContent = `<div style="${styleToString(innerStyle)}">${iconHtml}${textHtml}</div>`;
```

### 5. Garantir la synchronisation des dimensions

**Fichier** : `src/lib/pdf-html-generator.ts`

S'assurer que le calcul des positions utilise les mêmes ratios que l'Aperçu :

```typescript
// Dans getSharedElementStyle, utiliser le même ratio A4
// CANVAS_SCALE = { width: 650, height: 919 }
// Format A4 : 210mm x 297mm

const leftPercent = (element.position.x / CANVAS_SCALE.width) * 100;
const topPercent = (element.position.y / CANVAS_SCALE.height) * 100;
```

## Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/lib/pdf-html-generator.ts` | Ajouter rendu SVG icônes, normaliser z-index |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Supprimer injection `dynamicContent[lastPage]` |

## Détail technique

### Mapping des icônes Lucide vers SVG inline

Pour la page 7 "Votre offre de service", les icônes utilisées sont :
- `Recycle` (Reprise et Reconditionnement)
- `Shield` (CyberSécurité)
- `Wrench` (Intervention sur site, Services atelier)
- `Truck` (Logistique)
- `Settings` (Maintenance et garantie)
- `Repeat` (Lease Back)
- `BarChart3` (Données RSE)

Chaque icône sera convertie en SVG inline avec les attributs `stroke`, `fill`, et `viewBox` appropriés.

### Structure du rendu SVG

```html
<svg xmlns="http://www.w3.org/2000/svg" 
     width="24" height="24" 
     viewBox="0 0 24 24" 
     fill="none" 
     stroke="#1f2937" 
     stroke-width="2" 
     stroke-linecap="round" 
     stroke-linejoin="round">
  <path d="M..."/>
</svg>
```

## Comportement attendu après correction

| Page | Avant | Après |
|------|-------|-------|
| Page 7 | Cartes vides, pas d'icônes | 8 cartes avec pictos SVG et fonds colorés |
| Page 8 | Récapitulatif superposé | Uniquement éléments du template (signature, mentions) |
| Toutes pages | Positions décalées | Positions identiques à l'Aperçu |

## Risques et mitigations

### Complexité du mapping SVG
- Les paths SVG de Lucide peuvent être longs
- Solution : extraire uniquement les icônes utilisées dans le template (liste finie)

### Performance
- Générer du SVG inline augmente la taille du HTML
- Acceptable car les icônes sont petites et le nombre est limité

### Maintenance
- Ajouter une nouvelle icône nécessite d'ajouter son path SVG
- Solution : documenter le processus et créer un script d'extraction si besoin

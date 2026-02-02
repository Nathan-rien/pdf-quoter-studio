

# Plan : Etendre la palette de couleurs et optimiser l'editeur de template

## Objectif

1. Ajouter plus de couleurs dans les palettes de l'editeur
2. Extraire le composant ColorPicker pour eviter la duplication de code
3. Optimiser les performances avec React.memo et useMemo

---

## 1. Extension des palettes de couleurs

### Palette texte/icones/bordures (ALLOWED_COLORS)
Passer de **22 couleurs** a **40+ couleurs** en ajoutant :

| Categorie | Couleurs ajoutees |
|-----------|-------------------|
| Neutres | Gris 500 (#6b7280), Gris 600 (#4b5563), Gris 700 (#374151), Gris 800 (#1f2937) |
| Bleus | Indigo (#4f46e5), Cyan (#06b6d4), Bleu 300 (#93c5fd), Bleu 950 (#172554) |
| Verts | Teal (#14b8a6), Lime (#84cc16), Vert 300 (#86efac), Vert 800 (#166534) |
| Rouges/Orange | Rose fonce (#be185d), Rouge 300 (#fca5a5), Corail (#f87171) |
| Violets/Roses | Violet 300 (#c4b5fd), Fuchsia fonce (#a21caf), Pink (#f472b6) |
| Autres | Jaune (#eab308), Brown (#a16207), Slate (#64748b), Zinc (#71717a) |

### Palette fond de forme (SHAPE_BACKGROUND_COLORS)
Ajouter les memes nouvelles couleurs + leurs variantes pales pour un total de **50+ couleurs**.

---

## 2. Creation du composant ColorPicker reusable

Actuellement, le code de selection de couleur est duplique **6 fois** dans ElementProperties.tsx :
- Couleur du texte (ligne 753)
- Couleur de l'icone (ligne 483)
- Couleur de fond forme (ligne 957)
- Couleur bordure (ligne 1015)
- Couleur trait ligne (ligne 1086)
- Couleur trait ligne (doublon) (ligne 1086)

### Nouveau composant : `ColorPicker.tsx`

```typescript
interface ColorPickerProps {
  colors: readonly { name: string; value: string; category: string }[];
  selectedColor: string;
  onColorChange: (color: string) => void;
  disabled?: boolean;
  columns?: 8 | 9 | 10;
  size?: 'sm' | 'md';
}
```

Avantages :
- Code DRY (de ~40 lignes par grille a ~1 ligne d'appel)
- Memoisation integree (React.memo + useMemo pour les groupes de couleurs)
- Consistance visuelle garantie

---

## 3. Optimisations de performance

### 3.1 Memoisation du composant ColorPicker
```typescript
export const ColorPicker = React.memo(function ColorPicker({...}: ColorPickerProps) {
  const groupedColors = useMemo(() => {
    // Grouper les couleurs par categorie une seule fois
  }, [colors]);
  ...
});
```

### 3.2 Memoisation des handlers dans ElementProperties
Utiliser useCallback pour les handlers frequemment appeles :
```typescript
const handleTextChange = useCallback((updates: Partial<TextContent>) => {
  if (isEditable && textContent) {
    updateTextContent(selectedElement.id, updates);
  }
}, [isEditable, textContent, updateTextContent, selectedElement?.id]);
```

### 3.3 Virtualisation optionnelle
Pour les grandes palettes, utiliser un scroll natif optimise avec `will-change: scroll-position`.

---

## 4. Fichiers a modifier

| Fichier | Action |
|---------|--------|
| `src/lib/template-styles.ts` | Etendre ALLOWED_COLORS et SHAPE_BACKGROUND_COLORS |
| `src/components/template-editor/ColorPicker.tsx` | **Nouveau** - Composant reusable |
| `src/components/template-editor/ElementProperties.tsx` | Remplacer les grilles inline par ColorPicker, ajouter useCallback |
| `src/components/template-editor/index.ts` | Exporter ColorPicker |

---

## 5. Detail des nouvelles couleurs

### ALLOWED_COLORS (40 couleurs)

```typescript
// Neutres (8)
Noir #000000, Gris 800 #1f2937, Gris 700 #374151, Gris 600 #4b5563,
Gris 500 #6b7280, Gris 400 #9ca3af, Gris 300 #d1d5db, Blanc #ffffff

// Bleus (8)
Navy #1e3a5f, Bleu 900 #1e3b8a, Bleu 700 #1d4ed8, Bleu 500 #3b82f6,
Bleu 400 #60a5fa, Bleu 300 #93c5fd, Sky #0ea5e9, Cyan #06b6d4

// Verts (6)
Vert 800 #166534, Emeraude #10b981, Vert 500 #22c55e, Vert 400 #4ade80,
Teal #14b8a6, Lime #84cc16

// Rouges/Orange (6)
Rouge 800 #991b1b, Rouge 500 #ef4444, Rouge 400 #f87171, Orange #f97316,
Ambre #f59e0b, Jaune #eab308

// Violets/Roses (6)
Violet 700 #7c3aed, Violet 500 #a855f7, Violet 400 #c084fc, Rose 500 #ec4899,
Rose 400 #f472b6, Fuchsia #d946ef

// Autres (6)
Indigo #4f46e5, Slate #64748b, Zinc #71717a, Stone #78716c,
Brown #a16207, Pink #db2777
```

### SHAPE_BACKGROUND_COLORS (55 couleurs)
Toutes les couleurs ci-dessus + leurs variantes pales (50, 100, 200) + Transparent.

---

## 6. Interface utilisateur amelioree

### Affichage par categories
Le nouveau ColorPicker pourra grouper les couleurs par categorie avec des separateurs visuels subtils :

```
[Neutres: ● ● ● ● ● ● ● ●]
[Bleus:   ● ● ● ● ● ● ● ●]
[Verts:   ● ● ● ● ● ●    ]
...
```

### Tooltip enrichi
Afficher le nom + le code hex au survol : "Bleu 500 (#3b82f6)"

---

## Resume des gains

| Aspect | Avant | Apres |
|--------|-------|-------|
| Couleurs texte | 22 | 40 |
| Couleurs fond | 35 | 55 |
| Lignes de code grilles | ~240 (6x40) | ~60 (6 appels) |
| Memoisation | Aucune | Composant + handlers |
| Consistance | Manuelle | Automatique |


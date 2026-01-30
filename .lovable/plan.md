
# Plan : Ajouter un titre de page et renommer l'encart Services

## Modifications demandées

1. **Ajouter un titre en haut de la page 5** : "Les services inclus dans votre offre" avec une icône type "Fichier validé" (FileCheck)
2. **Renommer le titre de l'encart** : "Services Inclus" → "Services location."

## Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Ajouter le titre de page + renommer l'encart (aperçu) |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Ajouter le titre de page + renommer l'encart (PDF exporté) |

## Détail des modifications

### 1. RentalProposalPreview.tsx (lignes 810-833)

**Avant :**
```jsx
<div className="absolute z-40" style={{...}}>
  {/* Bloc permanent "Services inclus" - style header gris + puces */}
  <div className="mb-2 border rounded overflow-hidden">
    <div className="bg-muted px-3 py-1.5 flex items-center gap-2">
      <div className="w-2 h-4 bg-foreground/80 rounded-sm" />
      <span className="font-semibold text-[11px]">Services Inclus</span>
    </div>
```

**Après :**
```jsx
<div className="absolute z-40" style={{...}}>
  {/* Titre de page avec icône FileCheck */}
  <div className="mb-3 flex items-center gap-2">
    <FileCheck className="h-5 w-5 text-primary" />
    <h2 className="font-bold text-[14px] text-foreground">Les services inclus dans votre offre</h2>
  </div>

  {/* Bloc permanent "Services location" - style header gris + puces */}
  <div className="mb-2 border rounded overflow-hidden">
    <div className="bg-muted px-3 py-1.5 flex items-center gap-2">
      <div className="w-2 h-4 bg-foreground/80 rounded-sm" />
      <span className="font-semibold text-[11px]">Services location.</span>
    </div>
```

### 2. RentalProposalExport.tsx (lignes 386-394)

**Avant :**
```html
<div class="dynamic-content" style="...">
  <div style="background: #eff6ff; ...">
    <h4 style="...">✓ Services inclus</h4>
```

**Après :**
```html
<div class="dynamic-content" style="...">
  {/* Titre de page avec icône SVG FileCheck */}
  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
    <svg ...><!-- FileCheck icon --></svg>
    <h2 style="font-weight: 700; font-size: 12px; color: #1f2937; margin: 0;">Les services inclus dans votre offre</h2>
  </div>
  
  <div style="background: #f3f4f6; border: 1px solid #e5e7eb; ...">
    <div style="display: flex; align-items: center; gap: 4px; ...">
      <div style="width: 8px; height: 16px; background: #374151; border-radius: 2px;"></div>
      <span style="font-weight: 600; font-size: 9px;">Services location.</span>
    </div>
```

### 3. Importer l'icône FileCheck

Ajouter `FileCheck` à l'import de lucide-react dans les deux fichiers.

## Résultat attendu

| Élément | Avant | Après |
|---------|-------|-------|
| Titre de page | ∅ (absent) | "Les services inclus dans votre offre" + icône FileCheck |
| Titre de l'encart | "Services Inclus" | "Services location." |

## Points techniques

- L'icône `FileCheck` de Lucide représente un fichier avec une coche de validation
- Le titre de page utilise une taille de police plus grande (14px dans l'aperçu, 12px dans le PDF)
- Le style de l'encart "Services location" reste identique (fond gris, barre verticale)
- La modification s'applique à l'aperçu ET au PDF exporté pour garantir la cohérence

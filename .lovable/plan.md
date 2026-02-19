
## Remonter l'adresse en bas de page 1 (Aperçu et PDF)

### Diagnostic

L'adresse de l'entité (ex: "60 Boulevard de l'hôpital, 75013 Paris") est positionnée en absolu très près du bas du canvas :

| Composant | Bloc client (grille) | Adresse |
|---|---|---|
| **Aperçu (React)** | `bottom-16` (64px) | `bottom-0 pb-1` (≈4px) |
| **Export PDF (HTML)** | `bottom: 40px` | `bottom: 4px` |

Sur un canvas de 919px représentant une page A4, les 4px du bas correspondent à la zone de marge d'impression physique (≈1mm). À l'impression ou à la génération PDF, cette zone est systématiquement rognée par les imprimantes.

### Solution

Remonter les deux éléments de sorte que :
1. L'adresse soit à une hauteur sûre (au moins ~14-16px / 4mm du bas physique)
2. Le bloc client remonte en conséquence pour ne pas chevaucher l'adresse

### Modifications techniques

**Fichier 1 : `src/components/rental-proposal/RentalProposalPreview.tsx`**

Ligne ~623 — adresse dans `renderClientData()` :

```tsx
// AVANT
<div className="absolute bottom-0 left-0 right-0 pb-1 flex justify-center z-40">

// APRÈS
<div className="absolute bottom-3 left-0 right-0 flex justify-center z-40">
```

`bottom-3` = 12px depuis le bas, soit environ 3mm — suffisant pour éviter le rognage dans l'aperçu.

Ligne ~586 — bloc client (grille) dans `renderClientData()` :

```tsx
// AVANT
<div className="absolute bottom-16 left-4 right-4 ...">

// APRÈS
<div className="absolute bottom-10 left-4 right-4 ...">
```

`bottom-10` = 40px, ce qui laisse de l'espace pour l'adresse à 12px + une marge visuelle.

**Fichier 2 : `src/components/rental-proposal/RentalProposalExport.tsx`**

Ligne ~262 — bloc client HTML :

```html
<!-- AVANT -->
style="position: absolute; bottom: 40px; ..."

<!-- APRÈS -->
style="position: absolute; bottom: 55px; ..."
```

Ligne ~287 — adresse HTML :

```html
<!-- AVANT -->
style="position: absolute; bottom: 4px; ... font-size: 8px;"

<!-- APRÈS -->
style="position: absolute; bottom: 14px; ... font-size: 8px;"
```

`14px` depuis le bas dans un canvas de 919px ≈ 4,5mm de marge physique — zone sûre pour toutes les imprimantes standard (marge minimale habituelle : 5mm).

### Résumé des valeurs

| | Avant | Après |
|---|---|---|
| **Adresse (Aperçu)** | `bottom-0 pb-1` ≈ 4px | `bottom-3` = 12px |
| **Bloc client (Aperçu)** | `bottom-16` = 64px | `bottom-10` = 40px |
| **Adresse (Export PDF)** | `bottom: 4px` | `bottom: 14px` |
| **Bloc client (Export PDF)** | `bottom: 40px` | `bottom: 55px` |

### Fichiers modifiés

| Fichier | Lignes concernées |
|---|---|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | ~586, ~623 |
| `src/components/rental-proposal/RentalProposalExport.tsx` | ~262, ~287 |


# Plan : Corriger le rendu PDF Page 7 - Icônes manquantes et CSS d'impression

## Diagnostic

### Icônes manquantes (logs console)
Les logs de la console identifient précisément 4 icônes manquantes utilisées sur la Page 7 du template actif :

| Icône | Usage dans le template |
|-------|------------------------|
| `UserCog` | "Intervention sur site" |
| `Route` | "Logistique" |
| `BookmarkCheck` | "Maintenance et garantie" |
| `HeartHandshake` | "Données RSE" |

### Fonds des cartes absents
Malgré l'option "Graphiques d'arrière-plan" activée dans Chrome, les fonds bleu marine (#1e3a5f) des cartes ne s'affichent pas. Cela indique que le CSS `print-color-adjust: exact` n'est pas injecté dans le HTML généré.

## Solution technique

### 1. Ajouter les 4 icônes manquantes

Dans `src/lib/lucide-svg-paths.ts`, ajouter les paths SVG pour :

```typescript
// Intervention sur site - Utilisateur avec engrenage
UserCog: '<path d="M10 15H6a4 4 0 0 0-4 4v2"/><path d="m14.305 16.53.923-.382"/><path d="m15.228 13.852-.923-.383"/><path d="m16.852 12.228-.383-.923"/><path d="m16.852 17.772-.383.924"/><path d="m19.148 12.228.383-.923"/><path d="m19.53 18.696-.382-.924"/><path d="m20.772 13.852.924-.383"/><path d="m20.772 16.148.924.383"/><circle cx="18" cy="15" r="3"/><circle cx="9" cy="7" r="4"/>',

// Logistique - Route avec points
Route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',

// Maintenance et garantie - Marque-page avec check
BookmarkCheck: '<path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"/><path d="m9 10 2 2 4-4"/>',

// Données RSE - Coeur avec poignée de main
HeartHandshake: '<path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762"/>',
```

### 2. Ajouter le CSS `print-color-adjust`

Dans `src/lib/pdf-html-generator.ts`, modifier la fonction `generatePDFDocumentHTML` pour ajouter les propriétés CSS qui forcent l'impression des couleurs de fond :

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  color-adjust: exact !important;
}

.page {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}
```

Ces propriétés CSS forcent les navigateurs à imprimer les couleurs d'arrière-plan, même lorsqu'ils sont configurés par défaut pour les ignorer (économie d'encre).

## Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/lib/lucide-svg-paths.ts` | Ajouter 4 paths SVG (UserCog, Route, BookmarkCheck, HeartHandshake) |
| `src/lib/pdf-html-generator.ts` | Ajouter CSS `print-color-adjust: exact` dans les styles globaux |

## Détail technique

### Paths SVG extraits de lucide.dev

Les paths ont été extraits directement depuis le site officiel lucide.dev pour garantir la compatibilité avec la version 0.462.0 installée :

- **UserCog** : Icône composée de 10 paths (user + engrenage animé)
- **Route** : 2 cercles + 1 path pour la route sinueuse
- **BookmarkCheck** : Marque-page avec un checkmark interne
- **HeartHandshake** : Coeur avec motif de poignée de main stylisée

### CSS Print-Color-Adjust

```css
-webkit-print-color-adjust: exact !important;
print-color-adjust: exact !important;
color-adjust: exact !important;
```

Cette propriété CSS standard (et ses préfixes vendeur) force le navigateur à :
1. Imprimer les couleurs de fond (`background-color`)
2. Imprimer les images de fond (`background-image`)
3. Conserver l'opacité des éléments

Le `!important` garantit que ces règles prennent le dessus sur les paramètres par défaut du navigateur.

## Comportement attendu après correction

| Page 7 | Avant | Après |
|--------|-------|-------|
| Carte "Intervention sur site" | ? (placeholder) | Icône UserCog visible |
| Carte "Logistique" | ? (placeholder) | Icône Route visible |
| Carte "Maintenance et garantie" | ? (placeholder) | Icône BookmarkCheck visible |
| Carte "Données RSE" | ? (placeholder) | Icône HeartHandshake visible |
| Fonds bleu marine | Absents/blancs | Visibles (#1e3a5f) |
| Fonds gris | Absents/blancs | Visibles (#f3f4f6) |

## Tests de validation

1. Générer un PDF via Chrome > Imprimer
2. Vérifier que les 8 cartes de la Page 7 affichent :
   - Leurs icônes respectives (pas de "?")
   - Leurs fonds colorés (bleu marine ou gris clair)
   - Le texte avec la bonne couleur (blanc sur fond sombre, noir sur fond clair)
3. Comparer visuellement avec l'aperçu du workflow

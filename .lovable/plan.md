
## Corriger la taille et la position du logo client sur tous les templates

### Probleme
Le logo client herite actuellement de la hauteur du logo entite du template (`entityLogo.size.height`). Or, les templates Grosbill Pro et Cybertek Pro ont des logos entite de tailles tres differentes, ce qui donne un logo client beaucoup plus gros sur Cybertek Pro. De plus, sans largeur par defaut (`width: auto`), le logo s'affiche a sa largeur naturelle, ce qui aggrave l'ecart visuel.

### Cause racine
```text
defaultLogoHeightPct = (entityLogo.size.height / 919) * 100
```
Si le logo entite Cybertek fait 72px de haut en canvas, ca donne ~7.8%, tandis que Grosbill a ~4.3%. Le logo client prend alors une taille completement differente selon le template.

### Solution
Utiliser une taille fixe pour le logo client, independante du logo entite. La taille par defaut sera un carre raisonnable (ex: 50x50 en unites canvas, soit ~5.4% de hauteur). La position reste alignee a droite du logo entite et centree verticalement par rapport a lui.

### Fichier modifie

| Fichier | Modification |
|---|---|
| `RentalProposalPreview.tsx` | Dans `getLogoPositionData`, remplacer le calcul dynamique de hauteur/largeur par des valeurs fixes |

### Detail technique

**Constantes par defaut du logo client (en unites canvas) :**
```text
CLIENT_LOGO_DEFAULT = { width: 50, height: 50 }  // en unites canvas (650x919)
```

**Calculs modifies dans `getLogoPositionData` :**
```text
// AVANT : taille heritee du logo entite (varie selon template)
const defaultLogoHeightPct = entityLogo
  ? (entityLogo.size.height / CANVAS_SCALE.height) * 100
  : (30 / 820) * 100;

// APRES : taille fixe independante du template
const CLIENT_LOGO_SIZE = { width: 50, height: 50 };
const defaultLogoHeightPct = (CLIENT_LOGO_SIZE.height / CANVAS_SCALE.height) * 100;
const defaultWidthPct = (CLIENT_LOGO_SIZE.width / CANVAS_SCALE.width) * 100;
```

**Largeur par defaut :**
Quand il n'y a pas d'override, transmettre une largeur calculee a partir du pourcentage et de la largeur d'affichage du canvas (580px) :
```text
width: clientLogoOverride?.width ?? Math.round(defaultWidthPct * 580 / 100)
```

**Centrage vertical :**
Le centrage vertical utilise desormais `CLIENT_LOGO_SIZE.height` au lieu de `entityLogo.size.height`, ce qui garantit le meme decalage sur tous les templates.

Cela garantit que le logo client a exactement la meme taille et le meme positionnement relatif quel que soit le template selectionne.

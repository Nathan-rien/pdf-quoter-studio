

## Corriger la taille du logo client (probleme d'echelle)

### Probleme
Le logo entite est positionne en pourcentage du canvas (via `getSharedElementStyle`), donc il s'adapte a la taille reelle du conteneur. Le logo client, lui, utilise directement `entityLogo.size.height` (coordonnees canvas, ex: 72px dans un espace de 919px) comme valeur pixel CSS brute. Resultat : le logo client est affiche beaucoup trop gros.

### Solution
Appliquer un facteur d'echelle pour convertir la hauteur canvas en pixels reels dans le conteneur d'apercu :

```text
scaleFactor = CANVAS_DISPLAY_MAX_WIDTH / CANVAS_SCALE.width  (580 / 650 = 0.892)
defaultLogoHeight = entityLogo.size.height * scaleFactor
```

Exemple : un logo entite de 72px dans le canvas donne 72 * 0.892 = 64px affiches, au lieu de 72px bruts.

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `RentalProposalPreview.tsx` | Multiplier `entityLogo.size.height` par `CANVAS_DISPLAY_MAX_WIDTH / CANVAS_SCALE.width` pour obtenir la bonne taille en pixels |
| `RentalProposalExport.tsx` | Meme correction avec le facteur d'echelle de l'export PDF |

### Detail technique

**Preview (RentalProposalPreview.tsx) :**

```text
// AVANT
const defaultLogoHeight = entityLogo?.size.height ?? 30;

// APRES
const previewScale = CANVAS_DISPLAY_MAX_WIDTH / CANVAS_SCALE.width;
const defaultLogoHeight = entityLogo
  ? Math.round(entityLogo.size.height * previewScale)
  : 30;
```

**Export (RentalProposalExport.tsx) :**
L'export utilise un conteneur de 794px de large (A4 a 96dpi). Le facteur est donc `794 / 650 = 1.22`.

```text
const exportScale = 794 / CANVAS_SCALE.width;
const defaultLogoHeight = entityLogo
  ? Math.round(entityLogo.size.height * exportScale)
  : 40;
```

Le calcul de centrage vertical (`entityCenterPct`, `autoTopPct`) reste inchange car il utilise deja des pourcentages.

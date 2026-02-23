
## Ajuster la taille par defaut du logo client pour correspondre au logo entite

### Probleme
Le logo client a une hauteur par defaut fixe de 30px (apercu) / 40px (export), independamment de la taille reelle du logo entite dans le template. Sur certains templates, cela rend le logo client beaucoup plus gros que le logo entite.

### Solution
Utiliser la hauteur du logo entite comme reference pour la hauteur par defaut du logo client, au lieu d'un nombre fixe.

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `RentalProposalPreview.tsx` | Remplacer `clientLogoOverride?.height ?? 30` par `clientLogoOverride?.height ?? entityLogo?.size.height ?? 30` |
| `RentalProposalExport.tsx` | Remplacer `clientLogoOverride?.height ?? 40` par `clientLogoOverride?.height ?? entityLogo?.size.height ?? 40` |

### Detail technique

La hauteur par defaut du logo client sera desormais celle du logo entite du template actif. Le fallback (30/40) ne s'applique que si aucun logo entite n'est trouve.

**Avant :**
```
height: clientLogoOverride?.height ?? 30
```

**Apres :**
```
const defaultLogoHeight = entityLogo?.size.height ?? 30;
height: clientLogoOverride?.height ?? defaultLogoHeight
```

Le meme `defaultLogoHeight` est utilise dans le calcul de centrage (`clientLogoHeightPx`), ce qui garantit un alignement parfait.

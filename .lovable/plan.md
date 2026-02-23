

## Corriger l'alignement du logo client sur tous les templates

### Probleme
Sur le template Cybertek Pro, le logo client n'est pas aligne a la meme hauteur que le logo entite. La formule actuelle utilise un decalage fixe de `-1.5%` qui fonctionne pour le template Grosbill Pro mais pas pour Cybertek Pro, car les logos entite ont des tailles et positions differentes selon le template.

### Cause
Le calcul `autoTopPct = (entityLogo.y + entityLogo.height / 2) / canvasHeight * 100 - 1.5` ne prend pas en compte la hauteur reelle du logo client (30px par defaut). Le `-1.5%` est un ajustement arbitraire qui ne s'adapte pas aux differentes configurations de template.

### Solution
Remplacer le decalage fixe par un calcul qui centre veritablement le logo client par rapport au centre vertical du logo entite, en tenant compte de la hauteur du logo client :

```text
// Centre vertical du logo entite en %
entityCenterPct = (entityLogo.y + entityLogo.height / 2) / canvasHeight * 100

// Hauteur du logo client en % du canvas
clientLogoHeightPct = clientLogoHeight / canvasHeight * 100

// Position top pour centrer verticalement
autoTopPct = entityCenterPct - clientLogoHeightPct / 2
```

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `RentalProposalPreview.tsx` | Remplacer le `-1.5` par un centrage dynamique base sur la hauteur du logo client (30px par defaut) |
| `RentalProposalExport.tsx` | Meme correction pour l'export PDF (hauteur 40px par defaut) |

### Detail technique

Dans les deux fichiers, le changement est minimal (1 ligne) :

**Avant :**
```
autoTopPct = (entityLogo.y + entityLogo.height / 2) / canvasHeight * 100 - 1.5
```

**Apres :**
```
clientLogoHeightPx = clientLogoOverride?.height ?? DEFAULT_HEIGHT
entityCenterPct = (entityLogo.y + entityLogo.height / 2) / canvasHeight * 100
autoTopPct = entityCenterPct - (clientLogoHeightPx / canvasHeight * 100) / 2
```

Cela garantit un alignement correct quel que soit le template utilise.


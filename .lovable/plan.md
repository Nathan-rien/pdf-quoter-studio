

## Repositionner le logo client a cote du logo entite sur la page 1

### Probleme

Le logo client est actuellement positionne en haut a droite de la page (position absolue `top-3 right-4` dans le Preview, `top: 12px; right: 5%` dans l'export PDF). Il devrait etre place a droite du logo entite du template, aligne verticalement avec celui-ci, sous la date.

### Approche

Puisque le logo entite est un element du template dont la position est configurable (via l'editeur), le logo client doit etre positionne dynamiquement en fonction de la position reelle du logo entite sur la page 1.

### Modifications

**Fichier : `src/components/rental-proposal/RentalProposalPreview.tsx`** (lignes ~584-595)

Dans `renderClientData()` de `renderPage1` :
1. Recuperer les elements de la page 1 (`page1Elements`) et trouver le premier element de type `image` (le logo entite)
2. Si un logo entite est trouve : positionner le logo client a sa droite, aligne verticalement (meme `top`, decale en `left` de la largeur du logo entite + une marge)
3. Si aucun logo entite n'est trouve : fallback en bas a gauche ou a cote du bloc client
4. Utiliser les coordonnees en pourcentage (comme les autres elements du template) pour garantir la coherence visuelle

Remplacement du bloc actuel :
```
{clientData.logoUrl && (
  <div className="absolute top-3 right-4 z-40">
```
Par un calcul dynamique base sur l'element logo entite :
```
const entityLogo = page1Elements.find(el => el.type === 'image');
const logoTop = entityLogo ? (entityLogo.position.y / CANVAS_SCALE.height) * 100 : 10;
const logoLeft = entityLogo ? ((entityLogo.position.x + entityLogo.size.width) / CANVAS_SCALE.width) * 100 + 2 : 70;
```
Puis positionner le logo client avec `top: logoTop%` et `left: logoLeft%`.

**Fichier : `src/components/rental-proposal/RentalProposalExport.tsx`** (lignes ~258-263)

Dans `generateDynamicContentByPage()`, page 1 :
1. Meme logique : trouver l'element image sur la page 1 du template
2. Calculer la position en pourcentage a droite du logo entite
3. Remplacer le positionnement fixe `top: 12px; right: 5%` par les coordonnees calculees

### Resume technique

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Positionner le logo client dynamiquement a droite du logo entite du template |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Meme logique de positionnement dynamique dans le HTML genere |


Le SVG du logo a un viewBox 1920×1080 avec beaucoup d'espace vide → à `h-10` (40px) le logo affiché fait ~25px de haut, illisible.

### Action
Dans `src/pages/Index.tsx`, augmenter la taille du logo :
- `h-10` → `h-20` (80px de hauteur d'affichage, soit logo réellement visible ~50px)
- Ajuster l'alignement de la barre top-right si besoin (gap conservé)

Si après vérification visuelle le SVG reste mal cadré (whitespace excessif autour du glyphe), seconde étape : rapatrier le SVG en local, recalculer un viewBox serré sur le contenu réel et re-uploader via `lovable-assets`.

### Fichier touché
- `src/pages/Index.tsx`
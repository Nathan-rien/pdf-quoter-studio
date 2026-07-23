## Ajustements de mise en page (template Contrat Cadre Services)

Trois modifications ciblées dans `src/lib/service-proposal-html-generator.ts`, appliquées uniformément sur toutes les pages (devis 1-3 et contrat 4-9).

### 1) Marges latérales réduites — plus de place pour les tableaux
Le shell réserve actuellement `padding:0 14mm` à gauche/droite du contenu, en plus des paddings internes des cartes. Passer les paddings horizontaux latéraux de **14mm → 10mm** sur :
- `renderCgShell` (ligne 644) : `padding:6mm 14mm 0 14mm` → `padding:6mm 10mm 0 10mm`
- `renderShellPage` (ligne 833) : idem
- `renderCgHeader` (ligne 631) : `padding:6mm 14mm` → `padding:6mm 10mm` pour que le bandeau reste aligné avec le contenu
- `CG_FOOTER_HTML` (ligne 621) : `padding:3mm 14mm 6mm 14mm` → `padding:3mm 10mm 6mm 10mm`

Gain : ~8mm de largeur utile pour les tableaux et cartes de section.

### 2) Encarts moins collés entre eux
Le CSS actuel `.shell-content > .shell-block { margin: 0 0 10mm 0 }` (ligne 998) est à peine perceptible visuellement une fois combiné aux cartes bordurées. Passer à **14mm** pour un espacement plus aéré entre chaque section.

### 3) Texte pied de page plus petit
`CG_FOOTER_HTML` (ligne 621) : `font-size:9px` → **`font-size:8px`** avec `line-height:1.35`. Le texte reste sur 2 lignes et gagne en discrétion.

### Vérification
Reload de l'aperçu : les cartes/tableaux s'étendent plus près des bords, l'espace entre chaque encart est visiblement plus grand, le texte du pied de page est nettement plus petit tout en restant lisible et sur 2 lignes.

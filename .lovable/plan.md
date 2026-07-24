## Objectif
Aligner la taille du bandeau (pied de page) des pages Contrat Services sur celui, plus fin, des pages Devis.

## Constat
`src/lib/service-proposal-html-generator.ts` :
- `CG_FOOTER_HTML` : hauteur 24mm, padding 3mm/6mm, font 8px.
- `DEVIS_FOOTER_HTML` : hauteur 16mm, padding 2mm, font 6.5px.
- `renderCgShell` réserve `bottom:24mm` pour laisser la place au footer épais.

## Changements (fichier unique)
1. Réduire `CG_FOOTER_HTML` aux mêmes dimensions/typographie que `DEVIS_FOOTER_HTML` (hauteur 16mm, padding 2mm, texte 6.5px, une seule ligne compacte).
2. Mettre à jour `renderCgShell` : `bottom:24mm` → `bottom:16mm` pour la zone contenu.
3. Ne pas modifier l'en-tête noir ni la logique de pagination.

## Résultat
Toutes les pages du contrat services (couverture, périmètre, matériel, CG) affichent le même bandeau bas discret que le devis, libérant ~8mm de contenu par page.
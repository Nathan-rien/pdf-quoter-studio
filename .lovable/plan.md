## Objectif
Alléger le gras du tableau « Interventions sur site en supplément » (page 2) pour matcher le tableau « Vos modalités de règlement » juste en dessous.

## Constat
Dans `src/lib/seedContratCadreTemplate.ts`, toutes les cellules `p2p-tarif-r1/r2/r3` (labels ET valeurs) sont en `bold: true`. Dans le tableau dynamique de règlement rendu par `service-proposal-html-generator.ts`, seules les cellules d'en-tête sont grasses, les libellés en 600 léger et les valeurs en 400/normal.

## Modification
Dans `src/lib/seedContratCadreTemplate.ts` (lignes 100-118) :
- Garder `bold: true` uniquement sur la ligne d'en-tête (`p2p-tarif-h-lbl`, `p2p-tarif-h-val`).
- Passer `bold: false` sur les libellés des lignes de données (Technicien / Administrateur / Ingénieur serveur réseau).
- Garder `bold: true` uniquement sur les valeurs de tarif (500/600/900 € HT), alignées à droite comme les montants du tableau règlement — ou les passer aussi en normal si tu préfères la parité totale.

## Republication
Republier une **Version 21** du template « Contrat Cadre Services » en base pour que l'aperçu prenne les changements (les précédentes versions publiées ne se mettent pas à jour toutes seules depuis le seed).

## À confirmer
Pour les valeurs de tarif (colonne droite : `500 € HT`, `600 € HT`, `900 € HT`) — tu préfères :
- (A) Les garder en gras (comme les totaux en bas du tableau règlement) ?
- (B) Les mettre aussi en normal (parité totale avec les libellés) ?

Par défaut je pars sur (A) sauf indication contraire.

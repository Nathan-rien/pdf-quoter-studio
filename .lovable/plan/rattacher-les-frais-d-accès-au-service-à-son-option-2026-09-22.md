# Rattacher les frais d'accès au service à son option

Aujourd'hui, dans le bloc « Services & packs souscrits » de l'aperçu et du PDF, les frais d'accès au service apparaissent comme une ligne indépendante, juste sous l'option concernée. Rien n'indique visuellement à quelle option ils se rapportent, et la ligne casse l'alternance de couleurs.

## Ce qui change

Les frais d'accès au service deviennent une mention intégrée à la ligne de l'option sur laquelle ils sont activés :

- Le nom de l'option reste en gras majuscules, avec son prix à droite.
- Juste en dessous, dans la même ligne (même fond, même encadré), une mention plus discrète : « Frais d'accès au service » avec son montant aligné à droite.
- L'alternance de couleurs se calcule à nouveau par option, plus par ligne.

```text
PRO-SUPERVISION                                  300,00 € / mois
  Frais d'accès au service                              100,00 €
PRO-SAUVEGARDE                                   160,00 € / mois
```

Les options sans frais d'accès activés s'affichent comme aujourd'hui.

## Détail technique

Fichier unique : `src/lib/service-proposal-html-generator.ts`, fonction `renderOptionsSummaryZone`.

- Remplacer le tableau `summaryRows: Array<[string, string]>` par une construction d'une ligne `<tr>` par option sélectionnée.
- Dans la cellule de gauche : le nom de l'option, puis, si `fasEnabled`, un second bloc en police réduite (≈10px), poids normal, sans majuscules, couleur atténuée, avec un léger retrait.
- Dans la cellule de droite : le prix de l'option, puis, si `fasEnabled`, le montant formaté (`X,XX €`) sur une seconde ligne alignée à droite, aux mêmes dimensions que le libellé pour garder l'alignement vertical.
- Alternance `ROW_ALT_BG` basée sur l'index de l'option.
- Aucun autre fichier modifié, aucun renommage d'export.

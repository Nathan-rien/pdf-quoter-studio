## Objectif
Vérifier et forcer l'augmentation de l'espacement vertical entre les encarts (`.shell-block`) sur les pages du template "Contrat Cadre Services", en passant à **90mm**.

## Constat
Le CSS actuel (`src/lib/service-proposal-html-generator.ts`, ligne 998) contient bien `margin: 0 0 20mm 0` sur `.shell-block`. Si l'aperçu ne change pas visuellement, c'est probablement dû au cache navigateur/preview qui sert encore l'ancienne version compilée — ou bien la valeur de 20mm est visuellement trop proche de la précédente (14mm) pour être perçue.

## Modification
Dans `src/lib/service-proposal-html-generator.ts` :
- Ligne 998 : remplacer `margin: 0 0 20mm 0` par `margin: 0 0 90mm 0` sur `.shell-content > .shell-block`.

Aucune autre logique n'est modifiée. Le mécanisme `fitPageContentBlocks` continuera à réduire automatiquement l'ensemble via `transform: scale()` si l'accumulation d'espacement + contenu dépasse la zone disponible avant le pied de page réservé (24mm).

## Vérification
- Recharger l'aperçu de la proposition EXTENDE (Ctrl+F5 pour contourner le cache).
- Confirmer visuellement que les encarts COORDONNÉES / SITES D'INTERVENTION / CONTACT OPÉRATIONNEL / PRESTATAIRES EXTÉRIEURS sont nettement plus espacés qu'auparavant.

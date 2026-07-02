## Problème identifié

Dans le PDF « Contrat Cadre Services » téléchargé depuis Proposition Services, plusieurs blocs de texte se superposent (visible sur les captures : « Ci-après dénommée le "PRESTATAIRE" » et « D'UNE PART » chevauchent le paragraphe « Représentée par Nicolas Sourroubille… », et en page 2 le titre « I – DEFINITION DES SERVICES RENDUS » écrase le corps de « EXPOSE PREALABLE »).

**Cause** : Dans `src/lib/seedContratCadreTemplate.ts`, les éléments sont positionnés en absolu (`x, y`) avec des hauteurs fixes trop courtes. Les paragraphes longs enveloppent (wrap) sur plus de lignes que la hauteur réservée, et comme les textes sont rendus en `height: auto` (voir `template-render-utils.ts` L110-121 et `pdf-html-generator.ts`), ils débordent sur l'élément placé juste en dessous. Ce n'est pas un souci de génération PDF — c'est le positionnement du template semé qui est trop serré.

## Correctif proposé

1. **Retravailler les positions Y dans `src/lib/seedContratCadreTemplate.ts`** pour laisser un interligne suffisant entre chaque bloc, en tenant compte du wrap réel à 10 pt sur une largeur canvas de 714 :
   - Page 1 :
     - `p1-cybertek` : agrandir la hauteur réservée (80 → ~120) et déplacer les blocs suivants
     - `p1-prest` : y 200 → 235
     - `p1-dune` : y 225 → 260
     - `p1-et` : y 250 → 285
     - `p1-benef-label` : y 275 → 310
     - Ajuster `service_client_info_page1.position.top` en conséquence (82 → ~65) et augmenter légèrement `height` (10 → 18) pour héberger le pavé client sans coupure.
   - Page 2 :
     - `p2-body` : hauteur 320 → ~360, puis descendre les titres/corps suivants
     - `p2-art1` y 415 → 455, `p2-art1-body` y 435 → 475
     - `p2-art2` y 495 → 535, `p2-art2-body` y 515 → 555
   - Pages 3 → 6 : vérifier chaque bloc long (`p3-art3-body`, `p3-art5-body`, articles VI/VII/VIII/etc.) et appliquer la même règle « hauteur réservée = ~14 unités par ligne wrappée à 10 pt ». Décaler les titres suivants d'autant.

2. **Aucun changement de logique de rendu PDF nécessaire** (`pdf-html-generator.ts` et `template-render-utils.ts` restent inchangés — ils sont déjà cohérents entre l'aperçu et l'export).

3. **Ré-initialiser le template en base** : après le déploiement des nouvelles positions, il faudra cliquer sur « Initialiser Contrat Cadre Services » (mode force overwrite) dans `TemplateEditorLayout` pour que la version publiée reflète les nouveaux offsets. Sans ce clic, les contrats existants continueront d'utiliser l'ancienne version stockée en base.

## Détails techniques

- Les positions sont exprimées dans le repère canvas éditeur (largeur ≈ 793, hauteur ≈ 1122 unités). Une ligne de texte à 10 pt occupe environ 12-14 unités canvas (font-size 10 × line-height 1.2 × facteur d'échelle).
- Le rendu utilise `width: fit-content; max-width: element.size.width; height: auto` (`template-render-utils.ts` L110-121), donc la hauteur réservée dans le seed sert uniquement de repère pour placer l'élément suivant : elle doit être ≥ hauteur réelle du wrap.
- Le seeder possède déjà une option d'écrasement forcé (`force = true`) déclenchée par le bouton d'admin, donc pas besoin de migration SQL.

## Vérification post-fix

Ouvrir Proposition Services → onglet Aperçu, contrôler visuellement chaque page ; puis Télécharger PDF et vérifier qu'aucun texte ne se chevauche sur les 6 pages.
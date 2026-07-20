## Diagnostic (vérifié)

- Les zones dynamiques (« Vos modalités de règlement », « Services & packs souscrits ») rendent leur texte via `<div class="dynamic-content">` avec des styles inline en px absolus : `font-size:11px` pour les titres, `9px` pour les cellules. Ces valeurs s'affichent telles quelles sur le canvas 580×820.
- Les éléments statiques du template (`p2p-lbl-tarifs`, `p2p-tarif-*`) passent par `renderPageToHTML` → `pdf-html-generator.ts` où **`fontSize` est multiplié par `PREVIEW_FONT_SCALE = 0.4`** (avec un min clampé à 6px).
- Conséquence : `p2p-lbl-tarifs` avec `content.fontSize: 11` s'affiche à `max(11*0.4, 6) = 6px` — d'où le titre minuscule visible dans la capture. Les cellules avec `fontSize: 9` s'affichent aussi à 6px (min).
- La largeur du tableau (`x:40..610` sur canvas 650, ~88%) est légèrement plus étroite que les zones dynamiques (`left:4%; right:4%` → 92%, soit ~26..624).

## Plan

1. **Reculer les tailles de police en unités éditeur** dans `seedContratCadreTemplate.ts` pour que le rendu final corresponde aux zones dynamiques :
   - `p2p-lbl-tarifs` et `p2p-lbl-cond` : `fontSize: 11` → **`28`** (rend à ~11px, comme `SECTION_TITLE_STYLE`)
   - En-têtes de tableau `p2p-tarif-h-lbl`, `p2p-tarif-h-val` : `fontSize: 9` → **`23`** (rend à ~9px, comme `TH_STYLE`)
   - Cellules libellé/valeur `p2p-tarif-r{1,2,3}-{lbl,val}` : `fontSize: 9` → **`23`** (rend à ~9px, comme `TD_STYLE`)
2. **Aligner la largeur du tableau sur les zones dynamiques** : passer les rectangles/textes de `x:40, width:570` à **`x:26, width:598`** (soit 4% de marge gauche/droite sur un canvas 650), en conservant le split colonne libellé/valeur `340/230` reproportionné en `358/240`.
3. **Ajuster la hauteur des lignes** pour rester lisibles : `height: 18` → **`24`** (rend à ~9-10mm scalé), positions y recalculées en conséquence (header à y=352 conservé, lignes espacées de 24 au lieu de 18).
4. **Republier le template** : appeler `buildPages()` avec le seed mis à jour, insérer une **v20** en base via `psql`, vérifier la présence des nouvelles tailles via requête JSONB.
5. **Contrôle visuel** : capture Playwright de la page 2/3 en mode Contrat pour comparer la taille du titre et du tableau « Interventions sur site » au bloc « Vos modalités de règlement ».

## Détails techniques

- Aucune modification de `service-proposal-html-generator.ts` ni de `pdf-html-generator.ts` : on aligne uniquement les valeurs seed sur le pipeline existant.
- La conversion `× 0.4` est appliquée à **tout** le texte statique du template ; on aurait pu aussi supprimer le scale, mais ça casserait toutes les autres pages du template (juridiques) déjà calibrées.
- Après republication, un hard refresh navigateur est nécessaire côté utilisateur.


Objectif
- Revenir à une fidélité WYSIWYG stricte entre le template (éditeur/aperçu) et le PDF généré, en supprimant :
  1) les puces “automatiques” (bullet points) ajoutées dans le PDF
  2) les décalages de texte (offset vertical/horizontal) par rapport au template source

Constat (cause racine)
- Les blocs concernés (ex: Page 3 “Économique / Écologique”) sont enregistrés avec du HTML enrichi (`htmlContent`) contenant des balises de liste et de titres, notamment `<ul>`, `<li>`, `<h3>`, `<p>`.
- Dans l’app (éditeur + aperçu), Tailwind applique un “reset” (preflight) qui neutralise le rendu navigateur par défaut :
  - `ul/ol` n’affichent pas de puces
  - `h3` n’a pas une taille “heading” automatique (il hérite du font-size)
- Dans le PDF, on ne charge pas Tailwind : on injecte notre propre CSS. Résultat :
  - Les `<ul><li>` reprennent les puces par défaut du navigateur → “bullet points qui se rajoutent”
  - Les `<h3>` reprennent une taille de titre par défaut (em-based) → le texte “descend”, ce qui décale l’ensemble du bloc

Solution (principe)
- Aligner le CSS du moteur PDF sur le reset Tailwind minimum nécessaire pour que le HTML enrichi (`htmlContent`) rende EXACTEMENT comme dans l’aperçu.
- En complément, aligner la structure de rendu texte du PDF sur la structure de l’aperçu (wrapper interne “px-0.5 py-px”) pour éliminer les micro-décalages.

Changements prévus (code)

1) Ajouter un “preflight minimal” spécifique aux contenus Rich Text dans `src/lib/pdf-html-generator.ts`
- Dans le `<style>` injecté par `generatePDFDocumentHTML`, ajouter des règles qui neutralisent le rendu par défaut des balises riches :
  - Listes :
    - `ul, ol { list-style: none; margin: 0; padding: 0; }`
    - `li { margin: 0; padding: 0; }`
  - Titres :
    - `h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; }`
  - Paragraphes / blocs :
    - `p { margin: 0; }`
  - Optionnel (selon résultat) :
    - `strong, b { font-weight: bolder; }` (souvent déjà OK)
    - `em { font-style: italic; }` (déjà default)
- Résultat attendu :
  - Plus aucune puce automatique issue de `<ul>/<li>`
  - Plus de “grossissement” inattendu des titres `<h3>` → retour à l’alignement du template

2) Harmoniser la structure de rendu “text element” entre PDF et Preview
- Aujourd’hui, l’aperçu rend :
  - un wrapper externe positionné (absolute)
  - un wrapper interne avec padding Tailwind `px-0.5 py-px` (équivalent ~2px/1px)
  - puis le contenu (htmlContent ou texte)
- Le PDF rend tout dans un seul `<div>` avec styles inline.
- Modification : reproduire la structure de l’aperçu dans `renderTextElementToHTML` :
  - wrapper externe : style position/left/top/maxWidth via `getSharedElementStyle` + zIndex normalisé
  - wrapper interne : padding fixe équivalent à `px-0.5 py-px` + styles typo (fontFamily/fontSize/lineHeight/etc.)
  - contenu :
    - si `htmlContent` : l’injecter dans une sous-div avec `padding-left` (indent) comme dans l’aperçu
    - sinon : générer les lignes avec `<div style="padding-left: ...">` (indent par ligne), et préfixes `•` / `1.` selon `listType` (comme EditorCanvas/Preview)
- Résultat attendu :
  - Le “point d’ancrage” du texte (haut-gauche) se comporte pareil entre preview et PDF
  - Les micro-décalages liés aux paddings/wrappers disparaissent

3) Validation ciblée (tests)
- Test A (Page 3, sections Économique/Écologique) :
  - Vérifier qu’aucune puce noire automatique n’apparaît dans le PDF
  - Vérifier que l’alignement vertical du bloc est identique au template sauvegardé
- Test B (une page avec HTML riche contenant des titres) :
  - Vérifier que la taille des “titres” dans htmlContent ne gonfle pas en PDF
- Test C (régression) :
  - Vérifier que les éléments “texte simple” (sans htmlContent) conservent bien :
    - lineHeight 1.2
    - indentLevel / listType (les “listes” gérées par notre système continuent de marcher)

Fichiers concernés
- `src/lib/pdf-html-generator.ts`
  - Ajout CSS reset minimal pour `ul/ol/li/h1..h6/p`
  - Ajustement de `renderTextElementToHTML` pour matcher la structure de rendu de l’aperçu

Risques & garde-fous
- Risque : si quelqu’un utilise volontairement des listes HTML (`<ul>`) et veut des puces visibles en PDF
  - Aujourd’hui, l’app (preview) ne les affiche déjà pas (reset Tailwind), donc pour la “parité WYSIWYG”, on doit aussi les désactiver côté PDF.
  - Les listes “officielles” doivent passer par `listType: bullet/numbered` (notre mécanisme), qui reste supporté.

Livrable
- Un PDF dont le rendu texte (positions + absence de puces automatiques) correspond au template sauvegardé, notamment sur la Page 3 montrée dans vos captures.

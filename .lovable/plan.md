
Objectif
- Obtenir une parité WYSIWYG “définitive” entre le template (éditeur/aperçu) et le PDF généré, sans décalage de texte ni apparition de puces/listes inattendues.

Constat à partir de votre capture (PDF vs éditeur)
- Les décalages restants ressemblent à un problème de “scaling non uniforme” lors de l’impression :
  - Les positions/dimensions des éléments (en %) suivent bien le redimensionnement de la page imprimée.
  - Mais certaines valeurs “absolues” en px (typo, padding interne, etc.) peuvent ne pas être à la même échelle au moment du rendu print, surtout si la page passe de 650px×919px (canvas source) à 210mm×297mm (A4).
- Il y a aussi un risque fort que l’impression se déclenche avant que les polices Google (DM Sans/Inter/Outfit) soient effectivement chargées dans la fenêtre d’impression. Dans ce cas :
  - Le navigateur imprime avec une police de fallback (métriques différentes),
  - Puis la police finale se charge (trop tard),
  - Résultat : wrapping différent, hauteurs de lignes différentes, et donc décalage.
- Enfin, les “bullet points” peuvent réapparaître si :
  - le HTML riche contient des styles inline sur les listes (ex: list-style-type),
  - ou si le reset n’écrase pas assez agressivement (ex: ::marker).

Approche de correctif “définitif” (2 volets)

Volet A — Rendre le scaling d’impression strictement uniforme (le plus important)
But : garantir que TOUT (positions %, tailles %, polices px, padding px, bordures px, SVG icons, etc.) soit mis à l’échelle de manière identique au moment du print.

1) Introduire un wrapper “feuille A4” et une page interne “canvas”
- Dans `src/lib/pdf-html-generator.ts` :
  - Modifier `renderPageToHTML()` pour générer :
    - un conteneur `.page-sheet` dimensionné en A4 (210mm × 297mm),
    - qui contient un `.page` dimensionné STRICTEMENT comme le canvas source (650px × 919px),
    - et appliquer un `transform: scale(S)` (ou `zoom`) sur `.page` en mode print pour remplir exactement la feuille A4.
- Pourquoi : on “fige” la base de calcul en 650×919 (comme l’éditeur/aperçu), puis on scale visuellement tout le contenu pour A4. Ça évite le mélange % (qui scale) + px (qui ne scale pas) qui peut créer des offsets.

2) Calcul du scale
- Toujours dans `src/lib/pdf-html-generator.ts` :
  - Calculer `S` en JS/TS lors de la génération HTML et l’injecter dans le CSS.
  - Base recommandée (Chrome) : CSS pixels utilisent 96dpi, donc :
    - A4_width_css_px = 210 / 25.4 * 96 ≈ 793.7008px
    - S = A4_width_css_px / 650 ≈ 1.22108
- Appliquer ce scale uniquement dans `@media print`.

3) Ajuster les règles de pagination
- Déplacer la règle `page-break-after` sur `.page-sheet` (et non `.page`) pour que chaque wrapper corresponde à une page imprimée.
- Mettre `overflow: hidden` sur `.page-sheet` pour éviter toute “fuite” hors page si le navigateur arrondit.

Volet B — Verrouiller le rendu typographique (fonts + reset lists) pour supprimer offsets et puces
But : empêcher les différences de métriques et les styles navigateur par défaut de s’appliquer en print.

4) Attendre réellement le chargement des polices et des images avant `print()`
- Dans `src/components/rental-proposal/RentalProposalExport.tsx` :
  - Remplacer le simple `setTimeout(..., 500)` par une séquence robuste :
    1) Attendre que le document de la printWindow soit “ready”
    2) `await printWindow.document.fonts?.ready` (avec timeout de sécurité)
    3) Attendre les images : `decode()` si dispo, sinon `load` event (avec timeout)
    4) Laisser un cycle de layout (1–2 `requestAnimationFrame`)
    5) Puis seulement `printWindow.print()`
  - Utiliser `printWindow.onafterprint` pour fermer la fenêtre et déclencher l’historique (évite de fermer trop tôt).

5) Renforcer le reset Rich Text contre les bullet points
- Dans `src/lib/pdf-html-generator.ts`, dans le `<style>` :
  - Rendre le reset “anti-listes” plus strict pour couvrir :
    - `ul, ol { list-style: none !important; padding: 0 !important; margin: 0 !important; }`
    - `li { list-style: none !important; margin: 0 !important; padding: 0 !important; }`
    - `li::marker { content: "" !important; }` (Chrome)
  - Conserver le reset des headings / p, mais aussi en `!important` si nécessaire.

6) Micro-parité structurelle du texte
- Dans `renderTextElementToHTML` (pdf-html-generator), aligner exactement sur l’aperçu :
  - Ajouter `width: '100%'` au wrapper interne (comme dans EditorCanvas/RentalProposalPreview).
  - Vérifier que `lineHeight`, `whiteSpace`, `wordBreak` sont sur le même wrapper que dans l’aperçu (c’est déjà le cas), et que le contenu HTML ne casse pas l’héritage.

Fichiers à modifier (prévu)
- `src/lib/pdf-html-generator.ts`
  - Wrapper `.page-sheet` + scaling uniforme en print
  - Ajustement des règles `@media print` pour page break/overflow
  - Reset Rich Text renforcé (li + ::marker + !important)
  - Alignement final `width: 100%` sur inner wrapper texte
- `src/components/rental-proposal/RentalProposalExport.tsx`
  - Attente fonts + images + 2x rAF avant `print()`
  - `onafterprint` pour fermeture propre et sauvegarde historique

Tests de validation (ce que je ferai après implémentation)
1) Export PDF sur Page 7 (votre capture)
- Comparer visuellement : positions des 8 cartes, titres, sous-textes et icônes.
- Vérifier que le texte ne “glisse” plus verticalement dans les cartes.

2) Test RichText (Page 3, Économique/Écologique)
- Vérifier qu’aucune puce noire navigateur n’apparaît.
- Vérifier que les titres (h3/h4) ne changent plus la hauteur de bloc.

3) Test stabilité (fonts)
- Déclencher plusieurs exports successifs : le résultat doit être identique (pas “1 export sur 2” différent).
- Vérifier qu’un export immédiat (sans attendre) ne diffère pas d’un export après 10s (preuve que le wait fonts/images marche).

Notes techniques (pour expliquer “pourquoi ça sera définitif”)
- Le point clé est d’arrêter de changer la “surface de référence” du layout (650px→210mm) au moment du print.
- Le wrapper A4 + page 650px + scale unique force un scaling identique de toutes les unités, et donc supprime les offsets visibles.
- Le wait fonts/images supprime les variations aléatoires liées aux polices de fallback et aux décodages tardifs d’images avant l’impression.

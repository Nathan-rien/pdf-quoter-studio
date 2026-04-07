
Objectif

Rendre l’édition inline réellement fluide et fiable dans l’éditeur de template, avec listes à puces/numérotées visibles et persistées, sans bugs au double-clic ni pendant la sélection de texte.

Constat

J’ai identifié 4 causes principales dans le code actuel :

1. Le drag démarre trop tôt
- Dans `EditorCanvas.tsx` et `PreviewEditableCanvas.tsx`, le `mousedown` lance le déplacement immédiatement.
- Cela entre en conflit avec le double-clic et avec l’entrée en édition.

2. L’édition tape directement dans le store à chaque frappe
- `InlineTextEditor.tsx` appelle `onContentChange` sur chaque `input`.
- `templateEditorStore.ts` fait un `saveToHistory` avant chaque `updateTextContent`, donc on clone tout le document à chaque touche.
- C’est une source directe de lenteur, rerenders, perte de fluidité et comportement instable.

3. La toolbar agit “à côté” de l’éditeur
- `EditorCanvas.tsx` utilise `document.execCommand(...)` depuis la toolbar.
- Les commandes de liste/gras/etc. ne sont pas pilotées par une instance d’éditeur ciblée et la synchro DOM/store est fragile.

4. Les bullets sont probablement créées mais invisibles
- Les rendus HTML utilisent `dangerouslySetInnerHTML` pour `<ul>/<ol>/<li>`.
- Or il n’y a pas de styles dédiés pour les listes, donc les puces/numéros peuvent être masqués par le reset CSS.
- Même problème à répercuter dans l’aperçu et dans le HTML PDF.

Plan d’implémentation

1. Refaire la session d’édition inline en mode “draft local”
- Modifier `InlineTextEditor.tsx` pour garder le HTML et le texte en local pendant l’édition.
- Ne plus pousser les changements lourds dans le store à chaque frappe.
- Commit unique au `blur` confirmé / bouton valider.
- Annulation propre au `Escape` avec restauration du contenu initial.

2. Connecter la toolbar à l’éditeur actif
- Remplacer les `document.execCommand(...)` déclenchés depuis `EditorCanvas.tsx` par une API pilotée par l’éditeur actif.
- L’éditeur exposera des actions du type :
  - bold / italic / underline
  - unordered list / ordered list
  - align
  - font size
  - commit / cancel
- La toolbar restera visuelle, mais son exécution sera reliée à l’instance de `InlineTextEditor`.

3. Corriger le conflit double-clic / drag
- Dans `EditorCanvas.tsx` et `PreviewEditableCanvas.tsx`, ne plus démarrer le drag immédiatement au `mousedown`.
- Introduire un seuil de déplacement avant activation réelle du drag.
- Si l’utilisateur double-clique sur un texte, on entre en édition sans lancer de déplacement parasite.
- Si l’utilisateur est déjà en édition, aucun handler canvas ne doit reprendre la main.

4. Rendre les listes visibles partout
- Ajouter des styles riches partagés pour le contenu HTML :
  - `.rich-text ul { list-style: disc; padding-left: ... }`
  - `.rich-text ol { list-style: decimal; padding-left: ... }`
  - `.rich-text li { ... }`
- Appliquer cette classe dans :
  - `EditorCanvas.tsx`
  - `PreviewEditableCanvas.tsx`
  - `RentalProposalPreview.tsx`
  - `pdf-html-generator.ts`
- Ainsi, les bullets seront visibles dans l’éditeur, l’aperçu et le PDF généré.

5. Réduire le coût historique
- Dans `templateEditorStore.ts`, éviter `saveToHistory` à chaque touche pour l’édition inline.
- Sauvegarder l’historique une seule fois au début ou à la validation de l’édition.
- Garder le comportement actuel pour les autres modifications structurelles (move/resize/etc.).

Fichiers concernés

- `src/components/template-editor/InlineTextEditor.tsx`
- `src/components/template-editor/EditorCanvas.tsx`
- `src/components/template-editor/FloatingToolbar.tsx`
- `src/components/rental-proposal/PreviewEditableCanvas.tsx`
- `src/components/rental-proposal/RentalProposalPreview.tsx`
- `src/stores/templateEditorStore.ts`
- `src/lib/pdf-html-generator.ts`
- `src/index.css`

Résultat attendu

Après ce refactor :
- le double-clic ouvrira l’édition sans “saut” ni drag involontaire ;
- la sélection de texte sera stable ;
- les listes à puces et numérotées fonctionneront visuellement ;
- le contenu restera cohérent entre éditeur, aperçu et PDF ;
- la frappe sera beaucoup plus fluide, même sur des blocs de texte longs.

Vérifications prévues

- Double-clic sur un bloc texte -> entrée en édition immédiate.
- Sélection d’un mot puis clic “bullet list” -> la liste apparaît visuellement.
- Validation -> la liste reste visible dans l’éditeur, l’aperçu et le PDF.
- Test sur la page 4 et sur des paragraphes longs pour confirmer la fluidité.

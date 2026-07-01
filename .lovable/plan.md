## Problème

En édition inline sur le canvas du template editor, `Ctrl+V` ne colle rien quand la source vient d'un autre champ de l'application. Le `InlineTextEditor` s'appuie sur le comportement natif de `contentEditable` sans gérer explicitement l'événement `paste`. Selon le format présent dans le presse-papiers (HTML complexe, fragments contenteditable, MIME non-`text/html` propre), le navigateur peut n'insérer aucun nœud, ou insérer un nœud immédiatement re-nettoyé, donnant l'impression que « rien ne se passe ».

## Correction proposée

Ajouter un handler `onPaste` explicite dans `src/components/template-editor/InlineTextEditor.tsx` :

1. `e.preventDefault()` + `e.stopPropagation()` pour ne jamais laisser passer l'événement vers le canvas.
2. Lire d'abord `clipboardData.getData('text/html')` :
   - Passer par `sanitizeHtml(...)` (déjà importé) pour ne garder que les balises autorisées.
   - Insérer via `document.execCommand('insertHTML', false, cleanHtml)` afin que la sélection courante reçoive le contenu.
3. Fallback `text/plain` :
   - Utiliser `document.execCommand('insertText', false, plain)` (convertit les sauts de ligne en `<br>` correctement dans un contentEditable).
4. Si les deux formats sont vides, ne rien faire (au lieu de casser la sélection).
5. Marquer le contenu comme modifié pour que le commit au blur envoie bien la nouvelle valeur au store.

## Vérification

- Copier un texte depuis un autre champ de l'app (ex. panneau propriétés, historique), double-cliquer sur un texte du canvas, `Ctrl+V` → le texte apparaît immédiatement et est conservé après clic hors zone.
- Copier depuis Word/Notepad → même comportement, sans styles parasites (grâce à `sanitizeHtml`).
- `Ctrl+V` hors édition inline continue de coller des éléments (comportement existant du canvas inchangé).

## Fichiers touchés

- `src/components/template-editor/InlineTextEditor.tsx` (ajout du handler `onPaste`, aucune autre logique modifiée).

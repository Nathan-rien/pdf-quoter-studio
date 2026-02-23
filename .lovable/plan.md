
## Permettre l'edition inline des textes dans l'Apercu en mode Modifier

### Objectif

En mode "Modifier" de l'Apercu, un double-clic sur un element texte ouvre un editeur inline (contentEditable) identique a celui du Template Editor, permettant de modifier le texte directement sur le canvas.

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `src/stores/templateEditorStore.ts` | Etendre `updateElementFromPreview` pour accepter aussi des mises a jour de `content` (TextContent partiel) |
| `src/components/rental-proposal/PreviewEditableCanvas.tsx` | Ajouter l'edition inline des textes : etat `inlineEditingId`, double-clic pour activer, import et rendu de `InlineTextEditor`, gestion de la sauvegarde et sortie |

### Detail technique

**1. Store - Etendre `updateElementFromPreview`**

Modifier la signature pour accepter un champ `content` optionnel dans les updates :

```text
updateElementFromPreview: (
  elementId: string,
  pageNumber: PDFPageNumber,
  updates: {
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    content?: Partial<TextContent>;  // NOUVEAU
  }
) => boolean;
```

Dans l'implementation (~ligne 1576), si `updates.content` est fourni, fusionner avec le contenu existant de l'element :

```text
if (updates.content && element.type === 'text') {
  element.content = { ...element.content, ...updates.content };
}
```

**2. PreviewEditableCanvas - Ajout de l'edition inline**

- Importer `InlineTextEditor` depuis `@/components/template-editor/InlineTextEditor`
- Ajouter un etat local `inlineEditingId: string | null`
- Sur **double-clic** d'un element texte non verrouille en mode edit : activer `inlineEditingId`
- Dans `renderElement` pour les textes : si `inlineEditingId === element.id`, rendre `InlineTextEditor` a la place du texte statique
- `onContentChange` : appeler `updateElementFromPreview(id, pageNumber, { content: { htmlContent, text } })`
- `onExit` : remettre `inlineEditingId` a null
- Empecher le drag quand on est en edition inline (ignorer `handleMouseDown` si `inlineEditingId` est actif)
- Clic sur le canvas vide : sortir du mode inline

### Ce qui ne change pas

- Le composant `InlineTextEditor` existant (reutilise tel quel)
- La logique de drag/resize existante
- Le rendu des elements non-texte
- Les zones dynamiques (toujours protegees)

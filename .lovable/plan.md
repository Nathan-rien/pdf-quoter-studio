
## Correction de l'erreur `removeChild` sur l'outil publié

### Diagnostic

L'erreur `"Échec de l'exécution de 'removeChild' sur 'Node' : le nœud à supprimer n'est pas un enfant de ce nœud"` est une erreur classique de **conflit de réconciliation React** — React essaie de supprimer un nœud du DOM qui a déjà été déplacé ou supprimé par une autre opération.

Trois causes racines identifiées dans le code :

---

#### Cause 1 — `RentalProposalPreview.tsx` ligne 226 : appel de hook hors règles

```ts
// LIGNE 226 — À L'INTÉRIEUR d'une fonction normale (non-hook)
const freshState = useTemplateEditorStore.getState(); // ✅ OK - c'est getState(), pas un hook
```

Ce point est en réalité correct. La vraie cause ici est que `getStaticPageElements` est une **fonction ordinaire appelée pendant le render** qui retourne des tableaux de longueur variable selon la version — provoquant des ré-renders avec des listes d'éléments de tailles différentes sans stabilisation par `key`.

---

#### Cause 2 — `EditorCanvas.tsx` lignes 1164-1193 : switcher entre `InlineTextEditor` et `div` sans key stable sur le parent

```tsx
{isTextElement && textContent && (
  <div key={`text-container-${element.id}`}>  // ← key sur le div parent
    {inlineEditingElementId === element.id ? (
      <InlineTextEditor key={`inline-editor-${element.id}`} ... />
    ) : (
      <div key={`text-display-${element.id}`} ...>   // ← key sur le child
```

Le problème : React voit un `div` → enfant soit `InlineTextEditor` soit `div`, mais le **wrapper externe** (`div key=text-container-*`) reste le même pendant que ses enfants changent de type. Quand `InlineTextEditor` utilise `contentEditable` et modifie le DOM manuellement (`innerHTML`), puis que React essaie de réconcilier en supprimant ce nœud, la désynchronisation DOM/React déclenche `removeChild`.

---

#### Cause 3 — `PreviewEditableCanvas.tsx` ligne 518 : éléments rendus sans wrapper stable

```tsx
{sortedElements.map(el => renderElement(el))}
```

La fonction `renderElement` retourne des éléments avec `key={element.id}` selon le type. Mais si le type d'un élément change (ex. chargement asynchrone), React peut se retrouver avec des nœuds orphelins.

---

### Solution : 3 corrections ciblées

**1. `EditorCanvas.tsx`** — Stabiliser la transition `InlineTextEditor` ↔ affichage statique

Le problème : le `div` wrapper `text-container-{id}` entoure la condition ternaire. Quand `InlineTextEditor` (qui utilise `contentEditable` et modifie `innerHTML`) est démonté, React essaie de supprimer ses nœuds enfants qui ont déjà été modifiés par `contentEditable`. 

**Fix** : remplacer le `div` wrapper + ternaire par une clé différente sur chaque branche pour forcer un remontage propre au lieu d'un patch :

```tsx
// AVANT
<div key={`text-container-${element.id}`}>
  {inlineEditingElementId === element.id ? (
    <InlineTextEditor key={`inline-editor-${element.id}`} ... />
  ) : (
    <div key={`text-display-${element.id}`} ...>
```

```tsx
// APRÈS — key unique par état pour forcer un remontage complet
<React.Fragment key={inlineEditingElementId === element.id ? `editing-${element.id}` : `display-${element.id}`}>
  {inlineEditingElementId === element.id ? (
    <InlineTextEditor ... />
  ) : (
    <div className="px-0.5 py-px" ...>
```

**2. `RentalProposalPreview.tsx`** — Ajouter un wrapper stable avec key sur le rendu des éléments statiques (ligne 528)

```tsx
// AVANT
{staticElements.map(el => renderTemplateElement(el))}

// APRÈS — wrapper React.Fragment avec key stable basée sur la version + page
<React.Fragment key={`page-${pageNum}-v${currentVersion?.id}`}>
  {staticElements.map(el => renderTemplateElement(el))}
</React.Fragment>
```

Et dans `renderTemplateElement`, stabiliser les éléments avec `dangerouslySetInnerHTML` qui sont vulnérables :

```tsx
// Ligne 277 : ajouter une key stable sur le div dangerouslySetInnerHTML
<div 
  key={`html-${element.id}-${processedHtml.length}`}
  style={{ paddingLeft: `${indentPx}px` }}
  dangerouslySetInnerHTML={{ __html: processedHtml }}
/>
```

**3. `PreviewEditableCanvas.tsx`** — Wrapper stable sur la liste des éléments

```tsx
// AVANT
{sortedElements.map(el => renderElement(el))}

// APRÈS
<React.Fragment key={`canvas-elements-${pageNumber}`}>
  {sortedElements.map(el => renderElement(el))}
</React.Fragment>
```

Et stabiliser le `dangerouslySetInnerHTML` (ligne 234) avec une key basée sur le contenu :

```tsx
<div 
  key={`html-${elementId}-${textContent.htmlContent?.length || 0}`}
  style={{ paddingLeft: `${indentPx}px` }}
  dangerouslySetInnerHTML={{ __html: sanitizeHtml(textContent.htmlContent) }}
/>
```

---

### Résumé des fichiers modifiés

| Fichier | Modification |
|---|---|
| `src/components/template-editor/EditorCanvas.tsx` | Forcer remontage complet lors du switch `InlineTextEditor` ↔ affichage via `React.Fragment` avec key dynamique |
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Wrapper stable sur `staticElements.map()` + key stable sur le `div` avec `dangerouslySetInnerHTML` |
| `src/components/rental-proposal/PreviewEditableCanvas.tsx` | Wrapper stable sur `sortedElements.map()` + key stable sur le `div` avec `dangerouslySetInnerHTML` |

### Impact attendu

- Suppression des erreurs `removeChild` lors des transitions de page ou des éditions inline
- Aucun changement visuel ou fonctionnel — uniquement la stabilité du DOM
- Rétrocompatibilité complète avec les données existantes



## Corriger l'erreur `insertBefore` dans l'editeur de template

### Diagnostic

L'erreur `insertBefore` sur `Node` est un bug classique de React ou le DOM reel et le DOM virtuel se desynchronisent. Dans ce projet, le probleme vient de **3 causes combinees** :

1. **`dangerouslySetInnerHTML`** (EditorCanvas ligne 1017) : quand le HTML injecte est interprete differemment par le navigateur, React ne peut plus reconcilier les noeuds enfants
2. **Reutilisation des memes `element.id`** lors de `createNewVersion` : les elements sont clones avec les memes IDs, mais React tente de "patcher" l'ancien DOM au lieu de le remonter proprement
3. **Transitions de version** : quand on passe d'une version publiee a un nouveau brouillon, les elements ont les memes cles mais un contenu potentiellement different

### Corrections prevues

**Fichier : `src/components/template-editor/EditorCanvas.tsx`**

1. **Ajouter une `key` liee a la version sur le conteneur des elements** (ligne ~985) pour forcer un remontage complet quand la version change :
```tsx
<React.Fragment key={`elements-${currentVersion?.id}`}>
  {pageContent?.elements.filter(...).sort(...).map(...)}
</React.Fragment>
```

2. **Envelopper le `dangerouslySetInnerHTML` dans un conteneur avec une cle plus specifique** (ligne ~1012-1019) pour eviter la reconciliation problematique :
```tsx
<div 
  key={`html-${element.id}-${textContent.htmlContent?.length || 0}`}
  style={{ paddingLeft: `${indentPx}px` }}
  dangerouslySetInnerHTML={{ __html: sanitizeHtml(textContent.htmlContent) }}
/>
```

3. **Ajouter une `key` composite sur le conteneur principal de chaque element** (ligne ~1138) :
```tsx
key={`${currentVersion?.id}-${element.id}`}
```

**Fichier : `src/stores/templateEditorStore.ts`**

4. **Generer de nouveaux IDs d'elements lors de `createNewVersion`** (ligne ~1663) pour eviter la reutilisation des memes cles React :
```tsx
elements: (page.elements || []).map(el => ({
  ...el,
  id: `${el.id}-v${maxVersion + 1}`,
  position: { ...el.position },
  size: { ...el.size },
  content: el.content ? JSON.parse(JSON.stringify(el.content)) : undefined
})),
```
Et aussi faire un deep clone du content via `JSON.parse(JSON.stringify(...))` au lieu d'un spread superficiel.

### Resultat attendu

- Les transitions de version forcent un remontage propre du canvas (pas de reconciliation DOM risquee)
- Le contenu HTML enrichi utilise des cles plus specifiques pour eviter les conflits
- L'erreur `insertBefore` ne se produira plus lors de la creation de nouvelles versions ou du chargement de pages depuis le cloud



# Plan : Corriger le décalage de taille de police entre l'Éditeur et le PDF

## Problème identifié

Les changements de taille de police effectués dans l'éditeur de template ne sont pas reflétés correctement dans le PDF généré. En comparant les screenshots :
- **Aperçu (image-192)** : Les textes ont des tailles cohérentes et l'espacement est correct
- **PDF (image-191)** : Les textes se chevauchent et ont des tailles inconsistantes

## Cause racine

Dans le générateur HTML du PDF (`pdf-html-generator.ts`), le `fontSize` est appliqué sur un wrapper parent, mais :

1. Le `htmlContent` riche (balises `<b>`, `<i>`, `<div>`, `<p>`) généré par l'éditeur inline peut contenir des éléments qui ne respectent pas l'héritage de `font-size`
2. Les navigateurs peuvent appliquer leurs styles par défaut aux éléments HTML lors de l'impression
3. Il manque un wrapper intermédiaire avec les classes `whitespace-pre-wrap break-words` présent dans l'Aperçu React

**Différence structurelle :**

| Composant | Structure |
|-----------|-----------|
| Preview (React) | `outerDiv > innerDiv[fontSize] > wrapperDiv.whitespace-pre-wrap > content` |
| PDF (HTML) | `outerDiv > innerDiv[fontSize] > content` ← **Wrapper manquant** |

## Solution

### 1. Ajouter un wrapper intermédiaire dans le générateur PDF

Modifier `renderTextElementToHTML` pour ajouter un `<div>` supplémentaire autour du contenu, comme dans l'Aperçu.

### 2. Forcer l'héritage de `font-size: inherit` sur tous les éléments enfants

Ajouter des règles CSS dans le document PDF pour garantir que les éléments enfants héritent du `fontSize` parent.

## Fichier à modifier

| Fichier | Modification |
|---------|--------------|
| `src/lib/pdf-html-generator.ts` | Ajouter le wrapper intermédiaire + règles CSS d'héritage |

## Détail des modifications

### 1. Modifier `renderTextElementToHTML` (lignes 153-175)

Ajouter un wrapper `<div>` avec les mêmes propriétés que le wrapper React :

```typescript
// AVANT (ligne 174)
return `<div style="${styleToString(outerStyle)}"><div style="${styleToString(innerStyle)}">${textContent}</div></div>`;

// APRÈS
// Wrapper intermédiaire identique à l'Aperçu (whitespace-pre-wrap break-words)
const contentWrapperStyle = 'white-space: pre-wrap; overflow-wrap: break-word; word-break: normal;';
return `<div style="${styleToString(outerStyle)}"><div style="${styleToString(innerStyle)}"><div style="${contentWrapperStyle}">${textContent}</div></div></div>`;
```

### 2. Ajouter des règles CSS d'héritage forcé (lignes 483-497)

Dans la section `<style>` du document PDF, après les règles pour `strong, b` :

```css
/* Forcer l'héritage des styles typographiques dans le contenu riche */
.page div, .page p, .page span {
  font-size: inherit !important;
  font-family: inherit !important;
  line-height: inherit !important;
}
```

## Aperçu du changement

```text
AVANT (PDF)
┌──────────────────────────────────────┐
│ outerDiv (position)                  │
│  └─ innerDiv (fontSize: 12px)        │
│      └─ htmlContent (taille ?)       │ ← Styles navigateur peuvent écraser
└──────────────────────────────────────┘

APRÈS (PDF)
┌──────────────────────────────────────┐
│ outerDiv (position)                  │
│  └─ innerDiv (fontSize: 12px)        │
│      └─ wrapperDiv (inherit)         │ ← Nouveau wrapper
│          └─ htmlContent              │ ← Hérite correctement
└──────────────────────────────────────┘
```

## Points techniques

- Le wrapper ajoute `white-space: pre-wrap; overflow-wrap: break-word;` pour correspondre aux classes Tailwind de l'Aperçu
- Les règles CSS `font-size: inherit !important` garantissent que les éléments enfants (div, p, span générés par l'éditeur) héritent de la taille définie sur le parent
- Pas de changement dans l'Aperçu React (déjà correct)
- La parité WYSIWYG est restaurée entre l'éditeur et le PDF

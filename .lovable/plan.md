

# Plan : Cibler la règle d'héritage CSS sur le contenu riche uniquement

## Problème identifié

La règle CSS ajoutée précédemment pour forcer l'héritage typographique est trop large :

```css
.page div, .page p, .page span {
  font-size: inherit !important;
  font-family: inherit !important;
  line-height: inherit !important;
}
```

Cette règle **écrase les tailles de police inline** définies individuellement sur chaque élément du template, ce qui provoque :
- Chevauchements de texte (visible sur les pages Services et Avantages)
- Contenu tronqué ou mal positionné
- Perte de la fidélité WYSIWYG entre l'éditeur et le PDF

## Solution

1. **Limiter la portée de la règle CSS** à `.rich-text *` au lieu de `.page div, .page p, .page span`
2. **Ajouter la classe `rich-text`** uniquement sur le wrapper du contenu texte riche

Ainsi, seuls les éléments enfants du contenu HTML riche (balises générées par l'éditeur inline) hériteront des styles, sans écraser les tailles explicites définies sur les éléments du template.

## Fichier à modifier

| Fichier | Modification |
|---------|--------------|
| `src/lib/pdf-html-generator.ts` | Ajouter classe `rich-text` + cibler la règle CSS |

## Détail des modifications

### 1. Ajouter la classe `rich-text` au wrapper de contenu (ligne 177)

```typescript
// AVANT
return `<div style="${styleToString(outerStyle)}"><div style="${styleToString(innerStyle)}"><div style="${contentWrapperStyle}">${textContent}</div></div></div>`;

// APRÈS
return `<div style="${styleToString(outerStyle)}"><div style="${styleToString(innerStyle)}"><div class="rich-text" style="${contentWrapperStyle}">${textContent}</div></div></div>`;
```

### 2. Cibler la règle CSS sur `.rich-text *` (lignes 503-507)

```css
/* AVANT */
.page div, .page p, .page span {
  font-size: inherit !important;
  font-family: inherit !important;
  line-height: inherit !important;
}

/* APRÈS */
.rich-text * {
  font-size: inherit !important;
  font-family: inherit !important;
  line-height: inherit !important;
}
```

## Comportement attendu

| Élément | Avant | Après |
|---------|-------|-------|
| Texte avec `fontSize: 24px` | Écrasé par `inherit` → taille incorrecte | Conserve `24px` |
| Contenu riche (htmlContent) | Parfois incorrect | Hérite correctement du parent |
| Éléments de forme/image | Potentiellement affectés | Non affectés |

## Points techniques

- La classe `.rich-text` est ajoutée uniquement sur le wrapper interne du contenu texte
- Le sélecteur `.rich-text *` ne cible que les descendants directs du contenu riche (balises `<b>`, `<i>`, `<p>`, etc. générées par l'éditeur)
- Les autres éléments du template (formes, images, autres textes) conservent leurs styles inline explicites
- Restaure la parité WYSIWYG entre l'éditeur et le PDF




# Plan : Corriger la couleur de date grise dans le PDF exporté

## Problème identifié

Le texte "Janvier 2026" (date) s'affiche en **gris** dans le PDF exporté, alors que la couleur configurée dans la base de données est bien **blanche** (`#ffffff`).

**Cause racine :** Le CSS du générateur HTML pour le PDF contient la règle suivante (lignes 510-514 de `pdf-html-generator.ts`) :

```css
body {
  font-family: 'DM Sans', 'Outfit', sans-serif;
  line-height: 1.5;
  color: #1f2937;  /* ← Gris foncé par défaut */
  background: white;
}
```

Cette couleur de base (`#1f2937`) est héritée par tous les éléments. Cependant, le problème se situe dans la règle `.rich-text *` (lignes 504-508) qui force l'héritage de certaines propriétés typographiques avec `!important` :

```css
.rich-text * {
  font-size: inherit !important;
  font-family: inherit !important;
  line-height: inherit !important;
}
```

Le problème réside dans le fait que le contenu HTML interne du texte (balises `<p>`, `<span>` générées par l'éditeur riche) n'hérite pas explicitement de la couleur définie sur le wrapper parent. Dans certains navigateurs ou contextes d'impression, les styles inline du parent ne "descendent" pas automatiquement dans le contenu HTML enfant.

## Solution

Ajouter `color: inherit !important` à la règle `.rich-text *` pour garantir que la couleur définie sur l'élément parent (via `content.color`) soit bien héritée par tous les éléments enfants du contenu riche.

## Fichier à modifier

| Fichier | Modification |
|---------|--------------|
| `src/lib/pdf-html-generator.ts` | Ajouter `color: inherit !important;` dans la règle CSS `.rich-text *` |

## Détail de la modification

### pdf-html-generator.ts (lignes 504-508)

```css
/* AVANT */
.rich-text * {
  font-size: inherit !important;
  font-family: inherit !important;
  line-height: inherit !important;
}

/* APRÈS */
.rich-text * {
  font-size: inherit !important;
  font-family: inherit !important;
  line-height: inherit !important;
  color: inherit !important;
}
```

## Résultat attendu

| Avant | Après |
|-------|-------|
| Date "Janvier 2026" en gris (`#1f2937`) dans le PDF | Date "Janvier 2026" en blanc (`#ffffff`) dans le PDF |

## Justification technique

1. **La couleur est bien stockée en base** : La requête SQL confirme que l'élément de date a `color: #ffffff`
2. **Le rendu inline est correct** : Le wrapper `innerStyle` dans `renderTextElementToHTML()` applique bien `color: content.color || '#1f2937'`
3. **Le problème est l'héritage CSS** : Le contenu HTML riche (htmlContent) contient des balises enfants (`<p>`, `<span>`) qui n'héritent pas automatiquement de la couleur du parent dans le contexte d'impression
4. **La solution est cohérente** : La règle `.rich-text *` gère déjà l'héritage des autres propriétés typographiques avec `!important` ; ajouter `color` maintient cette cohérence

## Impact

- Tous les textes avec contenu riche (htmlContent) hériteront correctement de la couleur définie dans le template
- Aucun effet de bord sur les textes simples (sans htmlContent) qui utilisent déjà directement `content.color`
- La modification s'applique uniquement à l'export PDF (pas à l'aperçu React qui gère différemment l'héritage)


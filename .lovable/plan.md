

## Corriger le chevauchement "Total investissement" / logo sur les pages de continuation PDF

### Probleme

Dans l'export PDF, chaque page de continuation du tableau "Vos investissements" copie automatiquement TOUS les elements image (logos) de la page source (page 4) via `pdf-html-generator.ts` ligne 489 :

```typescript
elements: sourcePage.elements.filter(el => el.type === 'image'),
```

Le logo en bas a droite est donc present sur toutes les pages de continuation, y compris celle ou le "Total investissement" s'affiche en bas. Les deux elements se chevauchent car le logo est en position absolue et le total est en flux relatif.

### Solution

Modifier la logique dans `pdf-html-generator.ts` pour exclure les images positionnees dans le bas de la page lorsque le contenu dynamique de la page de continuation contient le bloc "Total investissement" (identifiable par la classe `summary-box`).

Concretement : si le HTML de la page extra contient `summary-box`, filtrer les images dont la position Y depasse 70% de la hauteur du canvas (les logos de bas de page).

### Fichier modifie

| Fichier | Modification |
|---|---|
| `src/lib/pdf-html-generator.ts` (lignes 483-493) | Filtrer les images de bas de page quand le contenu dynamique contient le total |

### Code cible

```typescript
extras.map(async (extraDynamicContent) => {
  // Detecter si cette page contient le total investissement
  const hasTotal = extraDynamicContent.includes('summary-box');
  
  // Filtrer les images : exclure celles en bas de page si le total est present
  const filteredImages = sourcePage.elements.filter(el => {
    if (el.type !== 'image') return false;
    if (hasTotal) {
      // Exclure les images dans le bas de la page (>70% de la hauteur)
      const bottomThreshold = CANVAS_SCALE.height * 0.7;
      return el.position.y < bottomThreshold;
    }
    return true;
  });
  
  const imageOnlyPage: TemplatePageContent = {
    ...sourcePage,
    elements: filteredImages,
    dynamicZones: [],
  };
  return renderPageToHTML(imageOnlyPage, extraDynamicContent);
})
```

### Comportement attendu

- Pages de continuation sans total : logos copies normalement (inchange)
- Page de continuation avec "Total investissement" : logo en bas de page exclu, pas de chevauchement
- Page unique (pas de multi-page) : pas de changement, le logo de la page 4 originale reste intact

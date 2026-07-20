## Objectif
1. Faire correspondre les marges de la page 6 (branche "flowRows", texte-seul) à celles de la page 7 (branche `renderPageToHTML` avec positions absolues).
2. Supprimer les barres de défilement visibles sur les côtés de l'aperçu iframe.

## Changements

### 1. `src/lib/service-proposal-html-generator.ts`
- Dans la branche `flowRows` (page 6, pages sans élément non-texte), remplacer le wrapper `padding:14mm 16mm 18mm 16mm` par des marges alignées sur la mise en page absolue utilisée par les autres pages du contrat.
  - Les pages "absolues" (page 5, 7) positionnent leurs textes à ~x=60px canvas ≈ 21mm depuis le bord. On alignera le `padding` gauche/droit du flow sur cette même valeur (`padding:14mm 21mm`) pour que la colonne de texte de la page 6 démarre visuellement au même endroit que la page 7.
  - Top conservé à ~14mm pour rester cohérent avec le premier élément absolu des autres pages (y≈40px).
- Aucun autre changement de scale/font (déjà harmonisé au tour précédent).

### 2. `src/components/service-proposal/ServiceProposalPreview.tsx`
- Ajouter à l'iframe l'attribut `scrolling="no"` **et** injecter dans le `srcDoc` (dans le `<style>` head par page) une règle `html,body{overflow:hidden;}` afin de supprimer les scrollbars horizontales/verticales visibles autour de la feuille A4 dans l'aperçu.
- Le contenu A4 ne dépasse jamais (page-sheet est déjà `overflow:hidden`), la suppression des scrollbars est purement cosmétique et sans risque de couper du contenu.

## Vérification
- Recharger l'aperçu, naviguer page 5 → page 6 → page 7 : la colonne de texte doit démarrer au même x, et aucune scrollbar ne doit apparaître sur le cadre de l'iframe.

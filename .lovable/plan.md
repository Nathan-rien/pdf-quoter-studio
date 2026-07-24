# Fusion des Signatures dans la dernière page CG (Contrats Services)

## Objectif
Supprimer la page 8 dédiée aux Signatures et déplacer son contenu (Fait à / Le / blocs Cybertek + Bénéficiaire / lignes "Signature : ___") en bas de la page 7 (dernière page des Conditions générales), à la suite du texte des articles. Le PDF Contrat passe ainsi de 8 à 7 pages.

## Changement (fichier unique)
`src/lib/service-proposal-html-generator.ts`

1. **Ne plus émettre la page Signatures séparément**
   - Dans la boucle finale (`for (const page of visibleTemplatePages)`), retirer l'ajout de `renderedSignaturePagesHtml` comme pages autonomes.

2. **Générer un bloc "Signatures" en HTML full-width** (pas de 2 colonnes)
   - Réutiliser la logique actuelle de `signaturePages` (zones `service_signature` + textes) pour produire un `signatureFooterHtml` : titre "Signatures" léger + "Fait à / Le ____" + les 2 colonnes Société/Bénéficiaire alignées (containers 18mm déjà en place) + lignes "Signature : ______".
   - Hauteur cible d'environ 55–60 mm.

3. **Injecter ce bloc sous les colonnes d'articles de la DERNIÈRE page CG**
   - Dans le rendu des `buckets` d'articles, détecter le dernier bucket (`idx === buckets.length - 1`).
   - Enveloppe : `<div style="display:flex;flex-direction:column;height:100%;">` avec :
     - Bloc articles 2 colonnes en `flex:1;min-height:0;` (hauteur réduite pour laisser place aux signatures)
     - `signatureFooterHtml` en `flex:0 0 auto;margin-top:6mm;border-top:1px solid #e5e7eb;padding-top:4mm;`
   - Titre du shell reste "Conditions générales (n/n)".

4. **Ajuster le budget de caractères du dernier bucket**
   - Réduire `MAX_CHARS_PER_PAGE` uniquement pour le dernier bucket (ex. `MAX_CHARS_PER_PAGE - 1400`) afin d'éviter que les colonnes ne débordent sur le bloc signatures. Implémentation : après le remplissage glouton existant, si le dernier bucket dépasse le nouveau seuil, repousser les derniers éléments (en respectant la règle des titres orphelins déjà en place) vers un bucket supplémentaire — dans ce cas, l'avant-dernier bucket devient standard et le nouveau dernier contient la fin des articles + signatures.

5. **Compte de pages**
   - La numérotation "Page x / y" du footer se recalcule automatiquement puisqu'elle est calculée à partir de `allPagesHtml.length` — vérifier que l'affichage passe bien à `Page 7 / 7`.

## Points hors périmètre
- Aucun changement de contenu (textes, articles, mentions légales).
- Aucun changement dans le template stocké (`seedContratCadreTemplate.ts`) : la page Signatures existe toujours dans la source mais n'est plus rendue comme page dédiée.
- Aucun impact sur le PDF Devis ni sur les Contrats Location.

## Vérification
- Générer le PDF d'un contrat services existant, contrôler visuellement : dernière page = fin des articles CG (2 colonnes) + bloc Signatures aligné en bas, footer "Page 7/7", plus de page 8 vide.

## Objectif

Faire apparaître automatiquement la date du jour sur la Page 1 du template **Contrat Cadre Services**, au même emplacement que sur le template **Proposition Commerciale Cybertek Pro** (à l'intérieur du bloc noir de couverture, sous le titre "PROPOSITION COMMERCIALE").

## Modifications

### 1. `src/lib/seedContratCadreTemplate.ts`
Ajouter un élément texte sur la Page 1 avec le placeholder `{{DATE}}` (déjà pris en charge par `substituteDynamicPlaceholders` dans `template-render-utils.ts`, qui le remplace par la date FR courante type "01 juillet 2026").

- Position ≈ celle du template Cybertek Pro (dans la zone du cartouche noir, sous le titre) : `x ≈ 220`, `y ≈ 545`, `w ≈ 300`, `h ≈ 20`.
- Style : Inter, 11px, blanc `#ffffff`, gras, aligné à droite.
- Contenu : `{{DATE}}`.
- `zIndex` élevé (ex. `5`) pour passer au-dessus du visuel de couverture éventuel.

### 2. `src/components/service-proposal/ServiceProposalPreview.tsx`
Aujourd'hui le rendu texte de l'aperçu Services affiche `content.text` brut — le `{{DATE}}` n'est pas substitué (contrairement à `RentalProposalPreview` qui appelle `substituteDynamicPlaceholders`).

- Importer `substituteDynamicPlaceholders` depuis `@/lib/template-render-utils`.
- Dans `renderTemplateElement`, appliquer la substitution à `content.text` et `content.htmlContent` avant affichage.

L'export PDF (`ServiceProposalExport.tsx`) passe déjà par `pdf-html-generator` avec `substitutionContext` — aucune modification requise, la date sera injectée automatiquement.

### 3. Réinitialisation du template
Après déploiement, l'utilisateur doit recliquer sur **« Initialiser Contrat Cadre Services »** (mode forcé) dans les paramètres pour régénérer une v1 avec l'élément date.

## Résultat attendu

- Aperçu Services : la date du jour (format "01 juillet 2026") apparaît sur la Page 1 dans le bloc de couverture.
- Export PDF : idem, position identique à Cybertek Pro.
- L'élément reste éditable dans le template editor (position, taille, style) comme n'importe quel texte.

## Problème
Les titres statiques « INTERVENTIONS SUR SITE EN SUPPLÉMENT » et « MODALITÉS DE RÈGLEMENT » (page 2 du template) sont déclarés avec `bold: true`, ce qui est rendu **font-weight: 700** par le générateur d'éléments statiques (`service-proposal-html-generator.ts`, branches `c.bold ? '700' : '400'`).

Les titres des zones dynamiques (« SERVICES & PACKS SOUSCRITS », « VOS MODALITÉS DE RÈGLEMENT ») utilisent `SECTION_TITLE_STYLE` avec **font-weight: 600**.

D'où la différence de graisse visible à l'écran.

## Correction

1. **`src/lib/service-proposal-html-generator.ts`** — étendre le rendu texte statique pour accepter un poids explicite :
   - Ajouter un champ optionnel `fontWeight?: number | string` dans `content` des éléments texte.
   - Dans les deux branches qui calculent `const fw = c.bold ? '700' : '400'`, préférer `c.fontWeight` s'il est défini.

2. **`src/lib/seedContratCadreTemplate.ts`** — pour `p2p-lbl-tarifs` et `p2p-lbl-cond` :
   - Garder `bold: true` (compat) et ajouter `fontWeight: 600` dans les opts → passer via `textEl` (ajouter l'option au helper).

3. **Republier** une nouvelle version (v22) du template « Contrat Cadre Services » en base pour que le rendu prenne effet.

Aucun autre template ni page 4-9 n'est touché.
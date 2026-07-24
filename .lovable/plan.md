## Objectif
Sur la première page des Conditions générales (contrat), afficher les 4 paragraphes d'introduction (« Le présent Contrat Cadre… » → « Cela étant exposé, il a été convenu et arrêté ce qui suit : ») sur toute la largeur de la page, puis démarrer la mise en 2 colonnes uniquement à partir de l'article « I - DEFINITION DES SERVICES RENDUS ».

## Fichier modifié
`src/lib/service-proposal-html-generator.ts` (uniquement)

## Changements

1. **Détecter le bloc d'intro** dans `allArticleElements` :
   - L'intro = tous les éléments situés avant le premier `isTitle` (articles romains I, II, …).
   - Ces éléments sont retirés de la liste `rendered` utilisée pour le packing en colonnes.

2. **Rendre l'intro en pleine largeur** :
   - Générer `introHtml` en concaténant les `html` des items d'intro (mêmes styles que les paragraphes actuels, `text-align:justify`, `font-size:10.5px`, etc.).
   - L'envelopper dans un conteneur `<div style="width:100%;margin-bottom:4mm;">…</div>`.

3. **Injection sur la 1re page CG uniquement** :
   - Dans la boucle `buckets.forEach`, pour `idx === 0`, préfixer le shell body par `introHtml` et faire suivre du `columnsBlock` habituel :
     ```
     <div style="display:flex;flex-direction:column;height:100%;">
       {introHtml}
       {columnsBlock (flex:1;min-height:0;)}
       {signatureBlockHtml si isLast}
     </div>
     ```
   - Les autres pages CG conservent le rendu 2 colonnes actuel.

4. **Ajuster le budget de caractères du 1er bucket** :
   - Réduire `MAX_CHARS_PER_PAGE` pour le premier bucket uniquement (env. −1200 caractères) afin de laisser la place à l'intro sans faire déborder les colonnes sur le footer. Implémentation : après le remplissage glouton actuel, si le 1er bucket dépasse le nouveau seuil, repousser ses derniers items vers le 2e bucket (en respectant la règle des titres orphelins déjà en place).

## Hors périmètre
- Aucun changement de texte, ni du template `seedContratCadreTemplate.ts`.
- Aucun impact sur le devis, sur les autres pages CG, ni sur les Contrats Location.
- Bloc Signatures en bas de la dernière page CG inchangé.

## Vérification
Générer un PDF Contrat Services et vérifier :
- Page 1 CG (actuellement « 1/2 ») : les 4 paragraphes d'intro s'étendent sur toute la largeur ; les articles I, II, III… reprennent en 2 colonnes en dessous.
- Pages CG suivantes : rendu 2 colonnes identique à aujourd'hui, footer et pagination conservés.

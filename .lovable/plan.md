````text
Objectif
--------
Réduire de 1 mm l'espace vertical entre les deux paragraphes surlignés dans les Conditions Générales du contrat services (page 6 du PDF contrat).

Constat
-------
Dans src/lib/service-proposal-html-generator.ts, les paragraphes des articles CG sont générés avec un style inline imposant une marge inférieure de 2 mm :

  margin:0 0 2mm 0

C'est cette marge qui crée l'espace entre les paragraphes successifs, notamment entre le paragraphe précédant "Cela étant exposé..." et le paragraphe surligné.

Plan de modification
--------------------
1. Dans la fonction renderArticle (ligne ~789), remplacer la marge inférieure des balises <p> des articles CG de 2 mm à 1 mm :
   - Avant : margin:0 0 2mm 0
   - Après : margin:0 0 1mm 0

2. Vérifier que ce changement n'affecte que les pages CG (documentScope: 'contrat') car renderArticle n'est utilisée que pour articlePages.

3. Lancer un build TypeScript pour valider la modification.

Fichier concerné
----------------
- src/lib/service-proposal-html-generator.ts

Impact attendu
--------------
L'espace entre les paragraphes des Conditions Générales sera réduit de 1 mm, ce qui resserrera le bloc d'intro avant les articles numérotés sans modifier la structure des pages ni la taille de police.
````

Objectif
- Faire en sorte que la date (“Janvier 2026”) apparaisse réellement en blanc (#ffffff) dans le PDF exporté (CybertekPro), même si des règles de rendu/print de Chrome tentent d’appliquer une couleur héritée/grisée.

Constat (déjà vérifié côté backend)
- La dernière version publiée du template CybertekPro (v110) contient bien l’élément date (id: element-1769773591149-y28ujlttg) avec content.color = #ffffff.
- Le HTML généré pour l’export PDF passe par src/lib/pdf-html-generator.ts → renderTextElementToHTML().
- La règle CSS .rich-text * { color: inherit !important; } est bien présente, mais le rendu reste gris chez vous, ce qui indique un override ailleurs (print engine / héritage / content wrapper) ou une partie du rendu qui ne reçoit pas la couleur attendue.

Hypothèse la plus probable
- Chrome (impression / “Enregistrer en PDF”) applique une couleur par défaut ou une normalisation sur certains nœuds (notamment quand le contenu est injecté sous forme de HTML/texte) malgré la couleur sur le wrapper parent.
- Dans notre cas, l’élément “date” a htmlContent (même s’il n’y a pas de balises), donc le texte passe par le wrapper .rich-text, et il est possible que la couleur portée par le parent ne soit pas appliquée/prise en compte comme prévu en contexte d’impression.

Approche de correction (robuste, “force blanche”)
1) Forcer la couleur au niveau du wrapper .rich-text (pas seulement sur le wrapper parent)
- Modification prévue dans src/lib/pdf-html-generator.ts, dans renderTextElementToHTML():
  - Calculer un colorValue = content.color || '#1f2937'
  - Appliquer colorValue explicitement sur le div .rich-text via un style inline (donc au plus près du texte affiché).
  - Exemple de structure cible (principe) :
    - wrapper externe (position)
    - wrapper interne (typo, inclut color)
    - wrapper .rich-text (doit aussi inclure color, ex: style="...; color: #ffffff;")

2) Forcer “!important” côté inline (si nécessaire)
- Comme on génère du HTML en string, on peut ajouter “color: #ffffff !important;” directement dans l’attribut style du wrapper .rich-text (et/ou du wrapper interne), ce qui est plus fort que la plupart des règles CSS de print.
- Nota: React.CSSProperties ne supporte pas !important, mais ici on génère une string => on peut l’ajouter manuellement à la fin du style généré.

3) Sécuriser la CSS print autour de .rich-text
- Dans le <style> de generatePDFDocumentHTML(), élargir la règle pour couvrir aussi le conteneur lui-même :
  - .rich-text { color: inherit !important; }
  - .rich-text, .rich-text * { color: inherit !important; } (optionnel)
- Objectif: s’assurer que les enfants ET le conteneur suivent la couleur voulue, sans dépendre d’un héritage ambigu.

4) Validation rapide côté UI (pour éliminer une cause “impression”)
- Dans Chrome, lors du test, activer une fois l’option “Graphiques d’arrière-plan” pour voir si Chrome est en train de “réinterpréter” les couleurs en mode impression.
- Même si ce n’est pas censé impacter la couleur du texte, c’est un test simple qui permet de confirmer si le problème vient du moteur d’impression plutôt que du HTML/CSS généré.

Plan de test (acceptation)
- Depuis le workflow, aller sur “Export final” avec le template CybertekPro.
- Générer le PDF et vérifier la page 1 :
  - “Janvier 2026” doit être blanc, lisible, et identique au rendu attendu (sans gris).
- Tester 2 fois :
  1) Impression/Enregistrer en PDF avec “Graphiques d’arrière-plan” désactivé
  2) Impression/Enregistrer en PDF avec “Graphiques d’arrière-plan” activé
- Résultat attendu : dans les deux cas, la date reste blanche (et on ne dépend plus d’un comportement Chrome).

Fichiers concernés (modifs prévues)
- src/lib/pdf-html-generator.ts
  - renderTextElementToHTML(): ajouter la couleur explicitement sur le wrapper .rich-text (et potentiellement en “!important” inline).
  - CSS générée: ajouter .rich-text { color: inherit !important; } (et/ou étendre le sélecteur).

Risques / effets de bord
- Faible risque : ce changement améliore la cohérence WYSIWYG de tout le rich-text en PDF.
- Si certains contenus riches devaient volontairement contenir des couleurs internes (ex: <span style="color:red">), nos règles actuelles (héritage forcé) les neutralisent déjà. Le changement proposé ne fait que rendre ce comportement plus fiable en impression.

Ce que je ferai juste après approbation (implémentation)
- Appliquer les modifications ci-dessus dans src/lib/pdf-html-generator.ts.
- Vérifier que le HTML généré pour l’élément date contient bien un “color: #ffffff” au niveau du .rich-text.
- Relancer un export PDF depuis l’UI pour confirmer que la date n’est plus grise.

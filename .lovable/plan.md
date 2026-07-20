Constat confirmé dans le code : l’aperçu Services démarre en mode `devis`, et les pages juridiques du template `Contrat Cadre Services` sont marquées `documentScope: 'contrat'`. Le compteur affiche donc seulement les 3 pages `both` tant que le mode `Devis` est actif.

Plan d’intervention :
1. Mettre l’onglet `Aperçu & Export` des Propositions Services en mode `contrat` par défaut pour le template Contrat Cadre Services, afin d’afficher directement les 9 pages attendues.
2. Harmoniser l’export associé pour qu’il utilise le même mode par défaut que l’aperçu, évitant un écart entre prévisualisation et PDF généré.
3. Ajuster le libellé/badge si nécessaire pour rendre visible que l’utilisateur consulte le document `Contrat`, pas le devis court.
4. Vérifier dans la preview que le compteur passe bien à 9 pages et que la navigation permet d’atteindre les pages juridiques.
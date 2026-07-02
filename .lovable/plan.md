Objectif : le PDF téléchargé dans Propositions Services doit reprendre le rendu propre de l’aperçu, sans superposition de textes ni éléments tronqués.

Plan d’implémentation :

1. Harmoniser le rendu des pages template
- Corriger le générateur HTML d’export pour qu’il applique les mêmes dimensions et règles de texte que l’aperçu Services.
- Éviter que les blocs texte du template soient rendus en hauteur libre au-dessus des éléments suivants dans le PDF.
- Conserver la logique WYSIWYG existante : même canvas, mêmes polices, mêmes z-index et mêmes placeholders dynamiques.

2. Corriger les pages denses du Contrat Cadre Services
- Ajouter une stratégie spécifique pour les éléments texte statiques du template Services : respecter une hauteur de bloc maîtrisée dans l’export PDF afin d’éviter que les articles IX/X/XI/XII se chevauchent.
- Garder le rendu lisible comme l’aperçu montré dans le deuxième écran : texte plus compact, marges conservées, logo en bas visible.

3. Aligner les zones dynamiques Services entre aperçu et PDF
- Vérifier et ajuster le rendu HTML des zones dynamiques `service_client_info`, `service_invest_table`, `service_conditions`, `service_signature` pour qu’elles utilisent les mêmes positions que dans l’aperçu.
- Éviter les recalculs qui déplacent trop les zones par rapport au template édité.

4. Sécuriser le bouton “Initialiser Contrat Cadre Services”
- Maintenir le comportement demandé : ne pas écraser ni effacer le template existant.
- Le bouton reste uniquement une initialisation si le template n’existe pas déjà.
- La correction du PDF se fera dans le moteur d’export, pas par réinitialisation destructive du template.

5. Vérification
- Vérifier que le HTML d’export généré reprend bien les pages du template publié.
- Contrôler les pages problématiques, notamment celle contenant les articles IX à XII, pour confirmer l’absence de superposition.
- S’assurer que l’aperçu dans Propositions Services reste inchangé et que seul le PDF téléchargé est corrigé.
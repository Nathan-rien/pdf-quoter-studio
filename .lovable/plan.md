## Objectif
Faire réapparaître la zone dynamique client dans l’aperçu et le PDF des Propositions Services, sans relancer d’initialisation ni écraser les modifications déjà faites dans le template.

## Plan
1. **Ne pas toucher au seed / initialisation du template**
   - Aucun appel à “Initialiser Contrat Cadre Services”.
   - Aucune modification destructive des versions/templates existants.

2. **Corriger le rendu des zones dynamiques dans l’aperçu Services**
   - Dans `ServiceProposalPreview.tsx`, remplacer le rendu actuel des zones dynamiques Services par un rendu basé sur la vraie zone du template :
     - utiliser `zone.position.top` et `zone.position.height`,
     - utiliser les mêmes marges/largeurs que l’éditeur (`left: 4%`, `right: 4%`),
     - donner un `z-index` suffisamment élevé pour que la zone client ne soit pas masquée par les éléments statiques de couverture.
   - Conserver le fallback de bloc client uniquement si aucune zone `service_client_info` n’existe sur la page 1.

3. **Corriger aussi l’export PDF Services**
   - Dans `ServiceProposalExport.tsx`, générer le contenu dynamique depuis les `dynamicZones` du template publié au lieu d’injecter systématiquement le bloc client en bas de page 1.
   - Pour chaque zone `service_*`, injecter le contenu au même endroit que l’aperçu, avec la même hauteur et la même largeur.
   - Garder un fallback non destructif pour page 1 seulement si le template publié ne contient aucune zone `service_client_info`.

4. **Préserver les modifications du template**
   - Le correctif ne modifie que le code de rendu aperçu/export.
   - Les positions déjà enregistrées dans le template restent la source de vérité.
   - Aucune migration ni modification de données.

5. **Vérification**
   - Vérifier que la page 1 affiche le bloc client dans l’aperçu Services quand la zone `service_client_info` existe.
   - Vérifier que le PDF utilise le même positionnement que l’aperçu.
   - Vérifier qu’un template sans zone client continue d’afficher le fallback existant.
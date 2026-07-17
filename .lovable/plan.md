## Plan de correction

1. **Forcer la vraie mise à jour visible après initialisation**
   - Corriger le cache de synchronisation des templates : aujourd’hui, après publication d’une nouvelle version via le seed, le store peut garder les métadonnées/pages déjà chargées, donc l’aperçu continue d’utiliser l’ancienne version.
   - Ajouter une méthode de rechargement forcé après `seedContratCadreTemplate()` au lieu de dépendre uniquement d’un reload navigateur.
   - Mettre à jour le store local avec la nouvelle version publiée retournée par le seed.

2. **Sélectionner explicitement le bon template Services**
   - Dans l’aperçu Proposition Services, filtrer le fallback sur les templates associés à `services`.
   - Éviter qu’un template actif Location ou non assigné soit choisi à la place du “Contrat Cadre Services”.
   - Si aucun template Services n’est sélectionné, prendre le template Services publié le plus récent.

3. **Corriger le rendu des 9 pages en mode Contrat**
   - Conserver le toggle `Devis / Contrat`, mais rendre le choix plus fiable : le mode Contrat doit afficher toutes les pages `both + contrat`.
   - Vérifier que l’export utilise le même filtrage que l’aperçu.

4. **Supprimer les chevauchements dans les pages dynamiques**
   - Ajuster le générateur HTML Services pour ne plus superposer les textes statiques du template avec les zones dynamiques.
   - Pour les pages contenant des zones dynamiques Services, ne pas injecter tous les textes statiques en flux en haut de page ; garder uniquement les vrais éléments de décor/titres nécessaires ou les positionner sans collision.
   - Recaler les zones de la page 1, 2 et 3 avec des positions compatibles avec le canvas réel (`650x919`) et l’aperçu PDF (`580x820`).

5. **Rendre le bouton d’initialisation fiable**
   - Dans `TemplateListView.tsx` et `TemplateEditorLayout.tsx`, remplacer le simple reload par : seed → invalidation/rechargement forcé → toast clair → affichage direct de la nouvelle version.
   - Garder le rechargement automatique uniquement si nécessaire, mais ne pas en faire la seule méthode de synchronisation.

6. **Validation**
   - Vérifier dans le code que le seed produit bien 9 pages, sans page Location.
   - Vérifier via l’aperçu que le mode Devis affiche 3 pages et le mode Contrat affiche 9 pages, avec les blocs des pages 1 à 3 non chevauchés.
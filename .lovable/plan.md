## Plan

1. **Corriger le téléchargement/visualisation PDF des Contrats Services**
   - Remplacer l’ouverture directe du lien de stockage externe par un téléchargement du fichier en Blob côté application.
   - Pour **Visualiser**, ouvrir un `blob:` local dans un nouvel onglet.
   - Pour **Télécharger**, déclencher un vrai téléchargement local avec le nom du fichier du contrat.
   - Conserver la logique existante qui régénère un PDF Contrat Services si le fichier attaché est absent ou ancien.

2. **Séparer les actions Visualiser et Télécharger**
   - Garder le même rendu UI, mais faire en sorte que le bouton œil prévisualise et le bouton téléchargement télécharge réellement.
   - Appliquer ce comportement aux contrats Services sans modifier le comportement métier des contrats Location.

3. **Générer automatiquement le numéro de contrat Services**
   - Ajouter une génération automatique uniquement pour `proposal_type = 'service'`.
   - Format prévu : `YYYYMMDD-N`, par exemple `20260724-1`.
   - Le suffixe `N` correspondra au rang du contrat pour ce même client : premier contrat client `-1`, deuxième `-2`, etc.
   - À la validation d’une proposition Services ou à la création d’un contrat Services rapide, renseigner ce numéro automatiquement si le champ est vide.
   - Ne pas appliquer cette génération aux Contrats Location.

4. **Préserver l’édition manuelle existante**
   - Le champ “Numéro de contrat” restera éditable.
   - Si un numéro existe déjà, il ne sera pas écrasé automatiquement.

5. **Validation**
   - Vérifier que le bouton de téléchargement ne mène plus vers une page `*.supabase.co` bloquée par Chrome.
   - Vérifier que les nouveaux contrats Services reçoivent un numéro conforme, sans impact sur les contrats Location.
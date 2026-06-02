## Objectif
Empêcher que l’erreur récurrente `removeChild` / mutation DOM fasse apparaître la fenêtre d’erreur, tout en préservant strictement les brouillons et données locales de l’utilisateur.

## Plan de correction
1. Ajouter un garde-fou DOM avant le rendu React
   - Créer une protection exécutée tout au début de `src/main.tsx`, avant `createRoot`.
   - Intercepter uniquement les cas connus où le navigateur ou une extension a déplacé/modifié un nœud DOM hors de React :
     - `Node.prototype.removeChild`
     - `Node.prototype.insertBefore`
   - Si le nœud ciblé n’appartient plus au parent attendu, ne pas faire planter l’application : ignorer l’opération dangereuse et journaliser un avertissement.

2. Garder la protection anti-traduction existante
   - Conserver `translate="no"`, `notranslate` et la meta Google déjà ajoutés.
   - Ajouter aussi l’attribut `class="notranslate"` au conteneur React `#root` si nécessaire, car certains traducteurs ignorent les attributs placés uniquement sur `html` / `body`.

3. Ajuster l’ErrorBoundary pour ne plus afficher cette fenêtre pour les erreurs DOM récupérables
   - Conserver l’écran d’erreur pour les vraies erreurs applicatives.
   - Pour les erreurs DOM typiques (`removeChild`, `insertBefore`, `appendChild`), privilégier une récupération silencieuse ou un rafraîchissement contrôlé sans suppression de stockage.
   - Ne jamais effacer automatiquement `rental-proposal-storage`.

4. Vérifier que le cache utilisateur reste protégé
   - Maintenir la règle actuelle : `rental-proposal-storage` n’est pas validé ni supprimé au démarrage.
   - Garder la réinitialisation manuelle uniquement derrière confirmation explicite.

## Résultat attendu
- La fenêtre d’erreur ne doit plus apparaître lors des mutations DOM causées par traduction navigateur/extensions.
- L’utilisateur garde son travail en cours.
- En cas de vraie erreur applicative, l’écran de secours reste disponible sans purge automatique des données.
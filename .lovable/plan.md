Cinq ajustements sur le devis Services (`src/lib/service-proposal-html-generator.ts`, sauf point 5 qui touche aussi `src/lib/pack-description.ts`).

### 1. Retirer la ligne « Services » du tableau « Vos modalités de règlement »
Dans `conditionsRows` (~ligne 275), supprimer la première entrée `['Services', ...]`. Le tableau commence désormais par « Périodicité ».

### 2. Réduire les marges latérales des pages du devis
Passer le padding horizontal de 10 mm à 6 mm dans les conteneurs des pages du devis :
- `shell-content` (ligne 845) : `padding:2mm 6mm 0 6mm`
- bandeau titre `renderCgHeader` (ligne 643) : `padding:6mm 6mm`
- pied de page `CG_FOOTER_HTML` du devis (ligne 633) : `padding:2mm 6mm 2mm 6mm`
(Les pages contrat conservent leurs marges actuelles.)

### 3. Pied de page sur une seule ligne
Sur le pied de page du devis (ligne 633), forcer la ligne surlignée « Groupe Cybertek — SAS au capital … » à tenir sur **une seule ligne** :
- Retirer le saut de ligne HTML entre les deux phrases (fusionner en une seule chaîne séparée par `·`).
- Ajouter `white-space:nowrap; overflow:hidden; text-overflow:ellipsis` au bloc de texte.
- Réduire la taille de police à 6.5 px si nécessaire pour tenir dans la largeur.

### 4. Harmoniser le style des libellés dans les encarts
Rendre les libellés type « BÉNÉFICIAIRE » / « VOTRE INTERLOCUTEUR » en **noir** au lieu de gris clair : modifier `LABEL_STYLE` (ligne 91) : `color:#9ca3af` → `color:#111111`. Cette constante est utilisée par tous les encarts (Coordonnées, etc.) donc l'harmonisation est globale.

### 5. Remplir la colonne « Description » de « Détail des services »
Actuellement `resolvePackDescription` retourne `opt.description` (souvent vide pour un service simple importé sans sous-lignes). Améliorer la résolution :
- Ajouter dans `resolvePackDescription` (`src/lib/pack-description.ts`) un fallback : si l'option n'est pas un pack (ou si sa description est vide), rechercher dans `adminOptions` une entrée dont le `title` correspond (case-insensitive) à `opt.name`, et composer la description à partir de ses `services` (via `serviceItemToLines`, en incluant sous-items).
- Priorité : description manuelle non vide → composition depuis pack (existant) → composition depuis service admin homonyme → chaîne vide.
- Le générateur (`renderOptionsZone`) reçoit déjà `adminOptions` et appelle `resolvePackDescription`, donc aucun changement supplémentaire côté rendu.

### Vérification
- Build TS (typecheck automatique).
- Aperçu du devis Services : vérifier disparition ligne Services, marges plus fines, pied de page compact 2 lignes (dont la 1re surlignée en une ligne), libellés noirs, et descriptions présentes dans « Détail des services ».



## Plan : Afficher les labels jour en vue semaine

Actuellement, le header niveau 3 (jours) n'affiche les labels de date que en vue `day` (ligne 126 : `showDayLabels = zoom === 'day'`). En vue `week`, la rangée jour est réduite à 12px sans texte.

### Modification : `GanttTimeline.tsx`

- Ligne 126 : changer `showDayLabels` pour inclure la vue semaine :
  ```typescript
  const showDayLabels = zoom === 'day' || zoom === 'week';
  ```
- Ligne 161 : la hauteur du header jours passera automatiquement à 24px en vue semaine (au lieu de 12px), affichant les numéros de jour.

Un seul changement d'une ligne.


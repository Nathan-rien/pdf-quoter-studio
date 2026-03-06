

## Plan : Header timeline 3 niveaux (comme l'image)

L'image montre un header à **3 niveaux simultanés** :
1. **Mois** en haut (ex: "mars 2026", "avril 2026")
2. **Semaines** au milieu (ex: "semaine 9", "semaine 10") avec fond coloré pour la semaine courante
3. **Jours** en bas — chaque jour ouvré affiché (ex: "23 févr.", "24 févr.", ...)

### Modification unique : `GanttTimeline.tsx`

**Structure actuelle** : 2 niveaux (mois + jours OU semaines selon le zoom).

**Nouvelle structure** : toujours 3 niveaux visibles, le zoom contrôle uniquement la largeur des colonnes jour.

#### Changements concrets :

1. **Colonnes = jours ouvrés** (toujours, quel que soit le zoom) — `workDays` reste la base.

2. **Header niveau 1 — Mois** : regrouper les jours par mois, afficher le nom centré sur la largeur cumulée.

3. **Header niveau 2 — Semaines** : regrouper les jours par numéro de semaine ISO, afficher "semaine N" centré. Colorer le fond de la semaine courante (rouge/accent comme dans l'image).

4. **Header niveau 3 — Jours** : afficher la date abrégée de chaque jour ouvré (ex: "23 févr.").

5. **Zoom** : au lieu de changer la granularité des colonnes, il change `colWidth` :
   - `day` → 32px (chaque jour bien visible)
   - `week` → 18px (compressé, les jours restent mais plus petits)
   - `month` → 8px (très compressé, les labels jours sont cachés, seuls mois/semaines lisibles)

6. **Semaine courante** : détecter `getISOWeek(new Date())` et appliquer un fond accent sur les cellules correspondantes dans le header semaine.

### Fichier modifié

| Fichier | Changement |
|---|---|
| `GanttTimeline.tsx` | Refonte complète du header en 3 niveaux, ajout calcul des groupes semaine, adaptation du zoom |


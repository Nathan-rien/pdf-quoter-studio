## Correctif juridique — Ajout Article V "Responsabilité Prestataire" dans le template Contrat Cadre Services

### Fichier modifié
`src/lib/seedContratCadreTemplate.ts`

### 1. Page 6 (`pageNumber: 6`, "Art. III à V") — insertion du nouvel article

Après l'article IV (body à y=345, h=90 → fin ≈ 435), ajouter :

- **Titre `p3-art5`** (nouveau) : `textEl("p3-art5", 40, 450, 570, 15, "V - RESPONSABILITE PRESTATAIRE", { bold: true })`
- **Corps `p3-art5-body`** (nouveau) : `textEl("p3-art5-body", 40, 475, 570, 300, "1.1 …\n\n1.2 …")` — hauteur calibrée sur la longueur réelle (paragraphe 1.1 très long ~10 lignes, 1.2 ~5 lignes) au même ratio que l'article V actuel (3 paragraphes = 180).

Le texte inséré est exactement celui fourni (1.1 sur la responsabilité directe/indirecte + plafond d'indemnisation, 1.2 sur l'obligation de sauvegarde préalable).

**Déplacement de l'ancien Article V (Facturation) → Page 7** : puisque la page 6 est saturée après l'ajout (art III 50→305, art IV 320→435, nouveau V 450→775), l'ancien "V - FACTURATION" est repoussé sur la page 7 et devient "VI - FACTURATION".

### 2. Page 7 (`pageNumber: 7`, actuellement "Art. VI à VIII") — accueil de Facturation + renumérotation

Nouveau contenu (mise en forme identique, seuls libellés/positions changent) :

- `VI - FACTURATION` (ex art V page 6) — titre y=50, body y=75, h=180 (identique à l'existant)
- `VII - DUREE` (ex VI) — titre y=245, body y=270, h=130
- `VIII - RESOLUTION DU CONTRAT` (ex VII) — titre y=410, body y=435, h=110
- `IX - OBLIGATIONS DE DISCRETION - CONFIDENTIALITE` (ex VIII) — titre y=560, body y=585, h=80

Titre de la page (`title`) mis à jour : `"Art. VI à IX"`.

### 3. Page 8 (`pageNumber: 8`) — renumérotation seule (positions inchangées)

- `IX - CLAUSES DU CONTRAT` → `X - CLAUSES DU CONTRAT`
- `X - INDEPENDANCE DES CLAUSES` → `XI - INDEPENDANCE DES CLAUSES`
- `XI - INDEPENDANCE DES PARTIES` → `XII - INDEPENDANCE DES PARTIES`
- `XII - ELECTION DE DOMICILE - ATTRIBUTION DE JURIDICTION - CONVENTION DE PREUVE` → `XIII - …`

Titre de la page mis à jour : `"Art. X à XIII"`.

Aucun changement de x/y/hauteur ni de style sur cette page — seuls les libellés changent. Les IDs (`p5-art9`, `p5-art10`, …) restent inchangés pour ne pas invalider les versions existantes.

### 4. Pages 9 (Signatures) et pages 1-5 : aucun changement.

### 5. Publication d'une nouvelle version

Aucune modification de `seedContratCadreTemplate()` : la fonction publie déjà automatiquement une nouvelle version (`max(version_number)+1`, status `publie`) à chaque exécution. Après build, déclencher la re-publication depuis l'UI Éditeur de template (bouton "Regénérer / republier Contrat Cadre Services") pour créer la nouvelle version en base.

### Vérifications post-changement

- Aperçu Proposition Services → page CG 6 : art III / IV / **V nouveau** sans chevauchement ni dépassement.
- Page 7 : art VI (Facturation) / VII / VIII / IX bien alignés, dernière ligne ≤ marge basse.
- Page 8 : numérotation X → XIII, textes identiques.
- Export PDF `contrat` : les 4 pages juridiques restent au bon `documentScope: "contrat"`.

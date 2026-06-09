## Plan

### 1. Intégration du logo CBpro
- Uploader le SVG via `lovable-assets` et créer `src/assets/cbpro-logo.svg.asset.json`.
- Ajouter le logo en haut à droite de l'application dans le layout principal (header global au-dessus du contenu, à côté/au-dessus de la sidebar).
  - Hauteur ~32-40px, lien vers `/`, padding cohérent.
  - Visible sur toutes les pages (hors export PDF).

### 2. Charte graphique — Noir & blanc épuré
Refonte des tokens dans `src/index.css` (mode clair uniquement, dark mode conservé tel quel) :

| Token | Avant (navy) | Après (mono) |
|---|---|---|
| `--background` | 220 20% 97% | 0 0% 98% |
| `--foreground` | 222 47% 11% | 0 0% 7% |
| `--primary` | 222 47% 20% | 0 0% 10% |
| `--primary-foreground` | 210 40% 98% | 0 0% 98% |
| `--secondary` | 220 14% 92% | 0 0% 94% |
| `--muted` | 220 14% 95% | 0 0% 96% |
| `--accent` | 220 14% 92% | 0 0% 92% |
| `--border` / `--input` | 220 13% 88% | 0 0% 88% |
| `--ring` | 222 47% 20% | 0 0% 20% |
| `--sidebar-*` | mix bleu | nuances neutres alignées |
| `--gradient-primary` / `hero` | dégradés navy | dégradés noir → gris anthracite |
| `--shadow-*` | hsl navy | hsl neutre (0 0% 7%) |

Statuts conservés (success vert, warning ambre, destructive rouge, info bleu) pour la lisibilité fonctionnelle — seul l'identité « marque » devient monochrome.

### 3. Vérifications
- Build OK.
- Contrôle visuel : sidebar, boutons primaires, cartes, badges de statut, écran d'aperçu de proposition.
- Aucune modification de la logique métier ni des templates PDF (les couleurs marque des PDF restent gérées par les templates utilisateur).

### Fichiers touchés
- `src/assets/cbpro-logo.svg.asset.json` (créé)
- `src/index.css` (tokens `:root`)
- `src/components/layout/AppSidebar.tsx` ou layout parent — emplacement à confirmer après lecture pour positionner le logo en haut à droite globalement.

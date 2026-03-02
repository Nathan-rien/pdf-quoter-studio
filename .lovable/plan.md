
Objectif: faire en sorte que les désignations Dental conservent réellement les retours à la ligne/espaces du PDF (et pas un bloc “aplati”).

1) Constat précis (code actuel)
- Le rendu UI est déjà prêt:
  - `RentalDataEditor` utilise `AutoResizeTextarea` (les `\n` s’affichent),
  - aperçu/export utilisent déjà `whitespace-pre-wrap`.
- Le problème est côté parsing/normalisation texte, avec 3 points qui aplatissent encore:
  - `extractDentalProducts` (fallback) fait encore `join(' ').replace(/\s+/g, ' ')`.
  - `removeRepeatedSubstrings` découpe avec `split(/\s+/)` puis reconstruit avec espaces (perd les `\n` si déduplication déclenchée).
  - `extractTextWithPdfJs` normalise chaque ligne avec `replace(/\s+/g, ' ')`, ce qui peut aussi écraser des sauts de ligne embarqués dans certains blocs PDF.

2) Plan d’implémentation
- A. Préserver les retours à la ligne dès l’extraction PDF (`src/lib/pdf-import-parser.ts`)
  - Dans `extractTextWithPdfJs.flush()`, remplacer la normalisation globale `\s+` par une normalisation “espaces/tabs uniquement”.
  - Conserver explicitement les `\n` présents dans les items texte.
- B. Uniformiser la désignation Dental en multi-ligne partout
  - Dans `extractDentalProducts`, passer la désignation en `join('\n')` (au lieu de `join(' ')`) pour cohérence avec le parser multi-ligne.
- C. Corriger la déduplication sans casser le format
  - Refactor `removeRepeatedSubstrings` pour dédupliquer sans reconstruire en “single line”.
  - Approche: travailler par lignes (normalisation pour comparaison), conserver la chaîne originale avec ses `\n`.
- D. Fallback lisibilité si le PDF fournit un bloc mono-ligne
  - Ajouter une étape légère de “soft split” (phrases/puces connues Dental) uniquement quand une désignation est très longue et sans `\n`, afin de retrouver une structure proche du PDF sans toucher aux autres sources.

3) Validation (ciblée + non-régression)
- Rejouer l’import du PDF Dental problématique et vérifier:
  - `[i900M 3YW fidelite]` avec paragraphes visibles (pas un bloc unique),
  - `[OP]` garde ses puces/retours à la ligne,
  - `[SVIP-IO]` garde ses éléments sur lignes distinctes.
- Vérifier aussi:
  - affichage dans onglet Invest (édition),
  - aperçu contrat (page investissements),
  - export PDF final.
- Non-régression:
  - imports Dental EN/FR,
  - Cybertek/Grosbill inchangés.

Section technique (détails)
```text
PDF text items
  -> line assembly (preserve \n, normalize only spaces/tabs)
  -> Dental multiline parser
  -> line-level noise filter + dedup that keeps original line breaks
  -> designation persisted with \n
  -> Invest editor / Preview / Export render with pre-wrap
```

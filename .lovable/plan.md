
Objectif: corriger l’extraction Dental pour que la désignation Invest reflète le devis (sans adresse vendeur, sans texte SAV/garantie, sans doublons, sans ligne réduite à `[OP]`).

1) Constats précis (à partir du code + captures)
- Le parser multiline (`parseDentalProductsWithMultilineDescriptions`) reste trop heuristique:
  - il peut encore concaténer des blocs non-produit (adresse/page header) via le scan arrière,
  - il casse trop tôt en scan avant (et peut perdre le vrai libellé produit),
  - la déduplication actuelle est trop stricte (égalité texte brute), donc “Scanner Intra Oral” / “Assistance Premium” peuvent rester en double.
- Le nettoyage final actuel supprime “du premier motif adresse jusqu’à la fin”, ce qui explique des cas comme `[OP]` seul.

2) Plan de correction (implémentation ciblée dans `src/lib/pdf-import-parser.ts`)
- A. Introduire un nettoyage “ligne par ligne” (au lieu du `replace(...).*$/is` global):
  - filtrer les lignes bruitées individuellement (adresse vendeur, mentions SAV, légales, IBAN/SIRET, bullet specs),
  - garder les lignes produit valides même si du bruit apparaît avant.
- B. Rendre le scan arrière plus robuste:
  - `continue` sur lignes “bruit” (adresse, HT/TTC, metadata) au lieu de `break` immédiat,
  - ajouter une limite de lookback (ex: 6–8 lignes utiles) pour éviter de remonter dans des blocs page/header.
- C. Rendre la déduplication tolérante:
  - normaliser (minuscule, espaces, ponctuation légère, accents) avant comparaison,
  - supprimer les répétitions de préfixe/sous-chaîne (ex: “Scanner Intra Oral Scanner Intra Oral …”).
- D. Ajouter une garde qualité de désignation:
  - si résultat final ≈ référence seule (`[OP]`, `[SVIP-IO]`) ou trop court, tenter une récupération depuis les lignes candidates voisines déjà collectées (titre utile le plus proche),
  - ne pas accepter de désignation contenant des patterns adresse/support.

3) Validation fonctionnelle (régression ciblée)
- Rejouer import sur devis Dental problématique et vérifier:
  - `[i900M 3YW fidelite]` sans duplication ni paragraphe SAV,
  - `[OP]` avec libellé produit réel (pas adresse, pas vide),
  - `[SVIP-IO]` sans doublon “Assistance Premium Assistance Premium”.
- Vérifier non-régression sur:
  - Dental FR standard,
  - Dental Quotation EN (“Unit(s)”),
  - parsers Cybertek/Grosbill inchangés.

Section technique (détails d’implémentation)
- Fonctions utilitaires à ajouter dans le même fichier:
  - `normalizeForDedup(text)` pour comparaison souple,
  - `isDentalNoiseLine(line)` pour classifier: adresses, boilerplate SAV, légales, headers HT/TTC, metadata banque.
- Remplacement du cleanup final:
  - passer de regex globale destructive à pipeline:
    1) split lignes
    2) trim + drop noise
    3) dedup normalisée
    4) join final
- Flux visé:
```text
Raw product block
  -> backward candidates (skip noise, bounded)
  -> main line extraction
  -> forward candidates (bounded, stop on true section/product markers)
  -> line-level filter + normalized dedup
  -> quality guard (anti "[REF]" only)
  -> final designation
```

Résultat attendu
- Désignations Invest plus fidèles au devis Dental, compactes et exploitables:
  - pas d’adresse vendeur,
  - pas de texte support/garantie long,
  - pas de doublons de section,
  - pas de ligne référence seule sans libellé.

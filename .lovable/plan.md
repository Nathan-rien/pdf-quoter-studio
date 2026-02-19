
## Correction du parser PDF Commande : prix unitaire inclus dans la désignation

### Problème identifié

Dans les PDFs de type **Commande Cybertek**, chaque ligne produit suit ce format sur une seule ligne :

```
00602456  Carte graphique MSI GeForce RTX 5060 Ti...  408,32 €  3  1 224,96 €
              ↑ CODE              ↑ DÉSIGNATION         ↑ PU HT  ↑QTE  ↑ TOTAL HT
```

Le parseur actuel (lignes 609-690 de `src/lib/pdf-import-parser.ts`) :
1. Détecte correctement la dernière paire `QTE + TOTAL HT` (ex: `3  1 224,96 €`)
2. Construit la désignation en prenant **tout le texte à gauche** du `matchIndex` de l'amount
3. Ce texte inclut le **prix unitaire** (`408,32 €`) qui précède la quantité

Le regex de nettoyage existant (ligne 662) cherche un pattern en fin de chaîne, mais le prix unitaire n'est pas en fin — il est suivi de la quantité. Résultat : `408,32 € 3` ou `408,32 €` reste dans la désignation.

### Solution

Dans la section "Commande format" du parseur (lignes 659-662 de `pdf-import-parser.ts`), après avoir construit la désignation brute, ajouter un regex supplémentaire qui supprime spécifiquement le pattern **prix unitaire + quantité** qui peut rester dans la désignation :

**Pattern à supprimer** : toute occurrence de `NNN,NN €  N` (prix unitaire suivi optionnellement de la quantité) dans la désignation.

Regex à ajouter après la ligne 662 :
```typescript
// Strip unit price pattern "NNN,NN € QTE" left in designation (Commande format)
// Matches: "408,32 € 3" or "408,32 €" followed by standalone digits
designation = designation.replace(/\s+\d+(?:[\s.]\d{3})*[,.]\d{2}\s*€(?:\s+\d+)?/g, '').trim();
```

De plus, le regex existant à la ligne 662 est trop restrictif (n'agit qu'en fin de chaîne avec `$`). Il faut le remplacer par une version globale qui supprime **toutes les occurrences** de patterns monétaires parasites dans la désignation, pas seulement en fin.

### Fichier modifié

**`src/lib/pdf-import-parser.ts`** — section "Commande format", lignes 659-663 :

```typescript
// AVANT:
let designation = designationParts.join(' ').replace(/\s+/g, ' ').trim();
// Strip trailing unit price pattern "NNN,NN €" that may be left in designation
designation = designation.replace(/\s+\d+(?:[\s.]\d{3})*[,.]\d{2}\s*€\s*$/, '').trim();

// APRÈS:
let designation = designationParts.join(' ').replace(/\s+/g, ' ').trim();
// Strip unit price pattern "NNN,NN € [QTE]" left anywhere in designation (Commande format)
// e.g. "Carte graphique MSI ... 408,32 € 3" → "Carte graphique MSI ..."
designation = designation.replace(/\s+\d+(?:[\s.]\d{3})*[,.]\d{2}\s*€(?:\s+\d{1,3})?/g, '').trim();
// Also strip a trailing standalone amount without leading space (safety net)
designation = designation.replace(/\d+(?:[\s.]\d{3})*[,.]\d{2}\s*€\s*$/, '').trim();
```

### Résultat attendu

| Avant | Après |
|-------|-------|
| `Carte graphique MSI GeForce RTX 5060 Ti 16G VENTUS 2X OC PLUS 408,32 € 3` | `Carte graphique MSI GeForce RTX 5060 Ti 16G VENTUS 2X OC PLUS` |
| `Services Garantie Excellence 5 ans 244,99 €` | `Services Garantie Excellence 5 ans` |

Les colonnes **Nb** et **VUN/VTN** continuent d'être correctement extraites (elles sont dérivées du `amountExtracted.qty` et `amountExtracted.total`).

### Considérations

- Le regex `(?:\s+\d{1,3})?` est optionnel pour gérer les cas où la quantité n'est pas toujours explicitement après le prix unitaire.
- La modification est **non-destructive** pour les PDFs Devis (ils passent par un chemin différent utilisant les refs `SY-`).
- Les PDFs Grosbill et 3D Dental ne sont pas affectés (leurs parseurs sont distincts).

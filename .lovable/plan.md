
# Plan : Corriger le parsing Installation et agrandir les champs Désignation

## Problèmes identifiés

### Problème 1 : Ligne "Prestation d'installation" mal parsée

La ligne d'installation dans le PDF Cybertek affiche :
- **QTE** : 2
- **Prix Total de vente HT** : 974,00 €

Mais le parser extrait :
- **Nb** : 14 (incorrect)
- **VTN** : 700,00 € (incorrect)

**Cause** : Le regex `rowEndRegex` (`/(\d+)\s+${money}\s*€\s*$/`) capture mal les données car :
1. Le texte PDF contient probablement d'autres nombres (comme "16Go", "2x", "12 disques") qui sont confondus avec la quantité
2. Le pattern cherche `\d+ money €` en fin de ligne, mais le buffer accumulé contient trop de texte non filtré

Le problème vient du fait que la ligne "Prestation" est matchée par `specialRefs` et que le buffer accumulé contient des nombres parasites ("2x 16Go", "12 disques 8To").

### Problème 2 : Champ Désignation trop étroit

Le `TableHead` pour "Désignation" n'a pas de largeur définie, il prend l'espace restant mais le `Input` à l'intérieur est contraint par la hauteur `h-8`.

---

## Modifications requises

### Fichier 1 : `src/lib/pdf-import-parser.ts`

#### Modification A : Améliorer le parsing des lignes "Prestation"

Renforcer l'extraction pour les lignes commençant par "Prestation" :
1. Chercher le pattern QTE + montant **à la fin du texte accumulé** uniquement
2. Exclure les nombres faisant partie de la désignation (comme "2x", "16Go", "12 disques")

```typescript
// Dans la section specialRefMatch (lignes 290-318)
// Le pattern actuel match tous les nombres, il faut être plus strict

// Amélioration : créer un pattern qui cherche UNIQUEMENT le pattern final
// Format attendu dans le PDF Cybertek : "... texte 2 974,00 €"
// où 2 = quantité et 974,00 € = prix total

// Solution : scanner depuis la FIN du buffer pour trouver "QTE montant €"
const endOfBufferMatch = buffer.match(/(?: |^)(\d{1,3})\s+([\d\s,]+)\s*€\s*$/);
```

Mais le vrai problème est que le regex actuel capture "14" qui n'est pas la QTE.

**Solution améliorée** : Inverser l'approche - pour les lignes "Prestation", chercher le pattern final strict `\b(\d{1,2})\s+([\d\s,.]+)\s*€\s*$` qui :
- `\b(\d{1,2})` : 1 ou 2 chiffres précédés d'une limite de mot (évite "16Go")
- `\s+([\d\s,.]+)\s*€\s*$` : montant en euros à la fin

```typescript
// Amélioration du pattern pour les prestations
const prestationEndRegex = /(?:^|\s)(\d{1,2})\s+([\d\s,.]+)\s*€\s*$/;
```

### Fichier 2 : `src/components/rental-proposal/RentalDataEditor.tsx`

#### Modification B : Agrandir le champ Désignation

Remplacer le composant `Input` par `Textarea` pour la colonne Désignation, avec une largeur minimum plus grande et permettre le redimensionnement.

```tsx
// Ligne 756-761 - Remplacer Input par Textarea pour Désignation
<TableCell className="min-w-[300px]">
  <Textarea
    value={ligne.designation}
    onChange={(e) => updateLigne(index, { designation: e.target.value })}
    className="min-h-[40px] resize-y"
    rows={2}
  />
</TableCell>
```

---

## Détails techniques

### Modification 1 : Correction du pattern pour les prestations

Dans `parseCybertekText()`, section lignes 290-318, améliorer le pattern pour détecter correctement QTE et Total HT :

```typescript
// Pattern amélioré : cherche le pattern final "QTE montant €"
// - \b assure qu'on ne capture pas "16Go" ou "2x"
// - (\d{1,2}) limite à 1-2 chiffres pour la quantité
// - Montant peut avoir espaces comme séparateurs de milliers
const prestationEndRegex = /(?:^|\s)(\d{1,2})\s+([\d\s,.]+)\s*€\s*$/;

if (specialRefMatch) {
  let buffer = l;
  let j = i;
  while (j < rowsSource.length - 1) {
    // Essayer de matcher la fin du buffer avec le pattern strict
    const endMatch = buffer.match(prestationEndRegex);
    if (endMatch) {
      const quantite = parseInt(endMatch[1], 10) || 1;
      const totalHT = parseNumber(endMatch[2]) || 0;
      // ...
    }
    // ...
  }
}
```

### Modification 2 : Élargir la colonne Désignation

1. Ajouter `min-w-[300px]` ou `w-1/2` au `TableHead` et `TableCell` de Désignation
2. Utiliser `Textarea` au lieu de `Input` pour permettre l'affichage multiligne
3. Ajouter `resize-y` pour permettre le redimensionnement vertical

---

## Résumé des fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `src/lib/pdf-import-parser.ts` | Pattern regex amélioré pour les lignes "Prestation" |
| `src/components/rental-proposal/RentalDataEditor.tsx` | Textarea + min-width pour Désignation |

## Résultat attendu

| Donnée | Avant | Après |
|--------|-------|-------|
| **Désignation Installation** | "d'installation sur..." (tronqué, sans "Prestation") | "Prestation d'installation sur les sites de Bordeaux et Marseille..." (complet) |
| **Nb (Installation)** | 14 ❌ | 2 ✓ |
| **VTN (Installation)** | 700,00 € ❌ | 974,00 € ✓ |
| **Affichage champ Désignation** | Tronqué | Visible en entier avec possibilité de redimensionner |

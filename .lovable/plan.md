

# Plan : Extraire les descriptions multi-lignes du format Dental

## Diagnostic du problème

Le parser actuel capture uniquement la première ligne de description car il traite chaque ligne indépendamment. Dans le PDF Dental, la structure réelle est :

```
| Ligne tableau | → Medit I900C garantie 3 ans tarif fidélité | 1,000 Unité(s) | 11 000,00 € | 13 200,00 € |
| Lignes suivantes | → Un ordinateur adapté doit être utilisé pour...
|                  | → le bon fonctionnement de ce matériel...
|                  | → Mises à jour du logiciel Medit Link gratuites...
|                  | → ... (jusqu'à 10 lignes supplémentaires)
| Sous-total       | → Sous-total : 11 000,00 €
```

**Le texte descriptif continue APRÈS la ligne du tableau, jusqu'au prochain marqueur "Sous-total".**

---

## Fichier à modifier

| Fichier | Modification |
|---------|--------------|
| `src/lib/pdf-import-parser.ts` | Réécrire `parseDentalText` avec extraction multi-lignes |

---

## Solution proposée

### Nouvelle logique d'extraction

1. **Identifier les lignes produits** : Lignes contenant le pattern `X,XXX Unité(s)` avec montants €
2. **Collecter les lignes descriptives** : Toutes les lignes APRÈS la ligne produit, JUSQU'AU prochain marqueur de fin (Sous-total, Section, nouveau produit)
3. **Reconstruire la désignation complète** : Concaténer la première ligne + les lignes descriptives
4. **Inclure la référence** : Préfixer avec `[REF]` si présente (ex: `[i900c 3YW fidelite]` ou `[OF-CAB]`)

### Algorithme détaillé

```text
Pour chaque page du PDF :
  1. Scanner les lignes pour trouver celles avec "X,XXX Unité(s)"
  2. Pour chaque ligne produit trouvée :
     a. Extraire : description initiale, quantité, prix HT
     b. Chercher la référence [XXX] au début de la description
     c. Scanner les lignes suivantes JUSQU'À un stop marker :
        - "Sous-total" ou "Sous-total :"
        - Ligne vide significative (plusieurs d'affilée)
        - Nouvelle section ("Informatique", "Livraison", "Formation")
        - Nouvelle ligne produit (contient "Unité(s)")
        - Footer de page ("Compte bancaire:", "Page X / Y")
     d. Ajouter toutes ces lignes à la désignation
  3. Retourner le produit avec désignation complète
```

### Marqueurs de fin de description

| Marqueur | Description |
|----------|-------------|
| `Sous-total` | Fin de la section produit actuelle |
| `Informatique`, `Livraison`, `Formation` | En-têtes de nouvelles sections |
| `X,XXX Unité(s)` | Début d'un nouveau produit |
| `Compte bancaire:` | Footer de page |
| `Page X / Y` | Numéro de page |
| `Montant hors taxes` | Début des totaux finaux |

---

## Modifications de code

### Nouvelle fonction `parseDentalProducts`

```typescript
function parseDentalProductsWithMultilineDescriptions(text: string): PDFProductLine[] {
  const products: PDFProductLine[] = [];
  const lines = text.split(/\r?\n/).map(l => l.trim());
  
  // Stop markers that end a product description
  const stopMarkers = /^(Sous-total|Informatique|Livraison|Formation|Compte\s+bancaire|Page\s+\d+|Montant\s+hors\s+taxes|Taxes|Total\s+\d)/i;
  const productLinePattern = /(\d+[,.]?\d*)\s*Unit[eé]\(?s?\)?/i;
  const euroAmountPattern = /([\d\s]+[,.][\d]{2,3})\s*€/g;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip headers, totals, empty lines
    if (/^(Description|Quantité|Prix|Sous-total|Montant|Taxes|Total|3D\s*DENTAL)/i.test(line)) continue;
    if (!line || line.length < 5) continue;
    
    // Check if this is a product line (has quantity pattern)
    const qtyMatch = line.match(productLinePattern);
    if (!qtyMatch) continue;
    
    // Extract amounts from the line
    const amounts = [...line.matchAll(euroAmountPattern)].map(m => parseNumber(m[1]));
    const validAmounts = amounts.filter(a => a !== null && a > 0) as number[];
    
    if (validAmounts.length < 1) continue;
    
    // Extract quantity
    const qty = Math.round(parseFloat(qtyMatch[1].replace(',', '.'))) || 1;
    
    // Montant HT is typically second-to-last (before TTC)
    const totalHT = validAmounts.length >= 2 
      ? validAmounts[validAmounts.length - 2] 
      : validAmounts[0];
    
    // Extract initial description (before quantity)
    const qtyIndex = line.indexOf(qtyMatch[0]);
    let descriptionLine = line.substring(0, qtyIndex).trim();
    
    // Check for reference pattern at start: [REF-XXX] or [xxx yyy zzz]
    let reference: string | null = null;
    const refMatch = descriptionLine.match(/^\[([^\]]+)\]\s*/);
    if (refMatch) {
      reference = refMatch[1];
      descriptionLine = descriptionLine.substring(refMatch[0].length).trim();
    }
    
    // Collect multi-line description
    const descriptionParts = [descriptionLine];
    
    // Scan following lines until stop marker
    for (let j = i + 1; j < lines.length; j++) {
      const nextLine = lines[j];
      
      // Stop conditions
      if (!nextLine) continue; // Skip empty but don't stop yet
      if (stopMarkers.test(nextLine)) break;
      if (productLinePattern.test(nextLine)) break; // New product
      if (/^\[.*?\].*Unité/.test(nextLine)) break; // New product with ref
      
      // Skip metadata lines
      if (/^(SASU|IBAN|BIC|TVA|TEL|Capital|SIRET)/i.test(nextLine)) break;
      
      // Add to description
      descriptionParts.push(nextLine);
    }
    
    // Build final designation with reference prefix
    const fullDescription = descriptionParts.join('\n').trim();
    const designation = reference 
      ? `[${reference}] ${fullDescription}` 
      : fullDescription;
    
    if (designation && totalHT > 0) {
      products.push({
        reference,
        designation,
        quantite: qty,
        prixUnitaire: qty > 0 ? Math.round((totalHT / qty) * 100) / 100 : null,
        totalHT,
      });
    }
  }
  
  return products;
}
```

### Mettre à jour `parseDentalText`

Remplacer l'extraction par colonnes par l'extraction multi-lignes comme méthode principale, car le texte brut préserve mieux la structure des descriptions :

```typescript
function parseDentalText(text: string, items?: TextItemWithCoords[]): Partial<PDFParseResult> {
  const result: Partial<PDFParseResult> = { /* ... */ };
  
  // USE TEXT-BASED MULTI-LINE EXTRACTION (more reliable for Dental format)
  result.lignes = parseDentalProductsWithMultilineDescriptions(text);
  
  // Fallback to column-based if text extraction fails
  if (result.lignes!.length === 0 && items && items.length > 0) {
    result.lignes = extractDentalProducts(items);
  }
  
  // ... rest of metadata extraction
}
```

---

## Données attendues après correction

### Produit 1

| Champ | Valeur |
|-------|--------|
| **Référence** | `i900c 3YW fidelite` |
| **Désignation** | `[i900c 3YW fidelite] MEDIT i-Series : Scanner IO (i900c garantie 3 ans fidélité)\nUn ordinateur adapté doit être utilisé pour le bon fonctionnement de ce matériel. Merci de vous rapprocher de notre service technique.\nMises à jour du logiciel Medit Link gratuites. Merci de conserver les emballages pour tout retour SAV...` |
| **Nb** | 1 |
| **VUN** | 11 000 |

### Produit 2

| Champ | Valeur |
|-------|--------|
| **Référence** | `OF-CAB` |
| **Désignation** | `[OF-CAB] Station de travail 3D fixe CAB\nInclus :\n- Tour : carte graphique Nvidia RTX 5060...\n- Ecran non tactile 24''\n- Clavier + Souris\n- Câbles d'alimentations\nGarantie constructeur 2 ans...` |
| **Nb** | 1 |
| **VUN** | 1 666 |

---

## Avantages de cette approche

| Aspect | Bénéfice |
|--------|----------|
| **Fidélité** | Conserve l'intégralité du texte descriptif du PDF |
| **Structure** | Préserve les sauts de ligne dans la désignation |
| **Robustesse** | Fonctionne sur texte brut, indépendant des coordonnées |
| **Compatibilité** | Fallback vers extraction par colonnes si nécessaire |


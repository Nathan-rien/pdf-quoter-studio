

# Plan : Corriger le parser Dental - Détection source et extraction par colonnes

## Problèmes identifiés

### 1. Détection de source défaillante
- **Symptôme** : Badge affiche "GrosBill Pro" au lieu de "3D Dental Store"
- **Cause** : Le pattern regex `/devis_-_so\d+/i` utilise des underscores mais le fichier réel utilise des espaces et tirets : `Devis - SO74920.pdf`

### 2. Désignations polluées avec quantité
- **Symptôme** : "Station de travail 3D fixe CAB 1,000" au lieu de "Station de travail 3D fixe CAB"
- **Cause** : Le seuil X < 280 pour la colonne Description capture aussi le "1,000" qui est dans la même plage X

### 3. Valeurs VUN/VTN incorrectes
- **Symptôme** : VUN = 20 (le taux TVA), VTN = 13200 € (le TTC au lieu du HT)
- **Cause** : Les seuils de colonnes X (360-420, 455-520) ne correspondent pas aux vraies positions

---

## Fichier à modifier

| Fichier | Modification |
|---------|--------------|
| `src/lib/pdf-import-parser.ts` | Corriger pattern détection + seuils colonnes X |

---

## Modifications détaillées

### 1. Corriger la détection du format Dental par nom de fichier

```typescript
// Ligne 53 - Améliorer le pattern pour supporter les variantes
function detectSourceFromFilename(filename: string): 'cybertek' | 'grosbill' | 'dental' | 'unknown' {
  const lowerName = filename.toLowerCase();
  if (lowerName.includes('cybertek') || lowerName.includes('kedge')) {
    return 'cybertek';
  }
  if (lowerName.includes('grosbill') || /devis_\d+_\d+/i.test(lowerName)) {
    return 'grosbill';
  }
  // FIXED: Support "Devis - SO74920.pdf" and "Devis_-_SO74920.pdf" patterns
  if (lowerName.includes('dental') || /devis[\s_-]+so\d+/i.test(lowerName)) {
    return 'dental';
  }
  return 'unknown';
}
```

**Pattern corrigé** : `/devis[\s_-]+so\d+/i` capture :
- `Devis - SO74920.pdf` (avec espaces et tirets)
- `Devis_-_SO74920.pdf` (avec underscores)
- `DevisSO74920.pdf` (collé)

### 2. Améliorer l'extraction des colonnes

Le problème principal est que les seuils de colonnes X sont approximatifs. Il faut analyser dynamiquement les positions X pour identifier les vraies colonnes.

**Nouvelle approche** : Identifier la position X du pattern "Unité(s)" et utiliser ça comme délimiteur entre Description et les colonnes numériques.

```typescript
function extractDentalProducts(items: TextItemWithCoords[]): PDFProductLine[] {
  const products: PDFProductLine[] = [];
  const Y_TOLERANCE = 8;
  
  // 1. Group items by Y coordinate
  const rowMap = new Map<number, TextItemWithCoords[]>();
  for (const item of items) {
    if (!item.str.trim()) continue;
    const normalizedY = Math.round(item.y / Y_TOLERANCE) * Y_TOLERANCE;
    if (!rowMap.has(normalizedY)) rowMap.set(normalizedY, []);
    rowMap.get(normalizedY)!.push(item);
  }
  
  const sortedRows = Array.from(rowMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([_, rowItems]) => rowItems.sort((a, b) => a.x - b.x));
  
  // 2. Process each row using "Unité(s)" as column boundary marker
  for (const row of sortedRows) {
    const rowText = row.map(i => i.str).join(' ');
    
    // Skip headers and totals
    if (/^(Description|Sous-total|Montant\s+hors|Taxes|Total|Quantité|Prix|Informatique|Livraison|Formation)/i.test(rowText)) continue;
    if (/Incluse|Inclus/i.test(rowText) && /0[,.]00/i.test(rowText)) continue;
    
    // Must contain quantity pattern
    if (!/\d+[,.]?\d*\s*Unit[eé]\(?s?\)?/i.test(rowText)) continue;
    
    // 3. Find the "Unité(s)" item to use as column boundary
    const uniteIndex = row.findIndex(item => /unit[eé]\(?s?\)?/i.test(item.str));
    if (uniteIndex === -1) continue;
    
    const uniteItem = row[uniteIndex];
    const uniteX = uniteItem.x;
    
    // 4. Extract based on position relative to "Unité(s)"
    let descriptionParts: string[] = [];
    let reference: string | null = null;
    let quantite = 1;
    let montantHT = 0;
    
    // All items BEFORE "Unité(s)" X position are description
    // Items AT "Unité(s)" contain quantity
    // Items AFTER are numerical columns
    
    for (let i = 0; i < row.length; i++) {
      const item = row[i];
      const text = item.str.trim();
      
      if (i < uniteIndex) {
        // Description column - BEFORE Unité(s)
        // Exclude quantity numbers that may precede "Unité(s)"
        if (/^\d+[,.]?\d*$/.test(text)) {
          // This is likely the quantity number (e.g., "1,000")
          const qtyMatch = text.match(/^(\d+)/);
          if (qtyMatch) quantite = parseInt(qtyMatch[1], 10) || 1;
        } else {
          // Check for reference pattern [XXX-YYY]
          const refMatch = text.match(/^\[([A-Z0-9\-]+)\]\s*/i);
          if (refMatch) {
            reference = refMatch[1];
            const remainder = text.substring(refMatch[0].length).trim();
            if (remainder) descriptionParts.push(remainder);
          } else {
            descriptionParts.push(text);
          }
        }
      } else if (i === uniteIndex) {
        // Skip "Unité(s)" text itself
        continue;
      } else {
        // Numeric columns - AFTER Unité(s)
        // Parse as euro amounts, take the amounts in order:
        // [Prix unitaire, Taxes %, Montant HT, Montant TTC]
        const euroAmount = parseNumber(text.replace('€', ''));
        if (euroAmount !== null && euroAmount > 0) {
          // First significant amount after Unité(s) that's not a percentage (< 100)
          // and larger than typical tax rates is likely HT
          // We want the SECOND-TO-LAST € amount (HT), not the last (TTC)
          // Better: collect all € amounts and pick intelligently
        }
      }
    }
    
    // ALTERNATIVE APPROACH: Find all euro amounts in the row
    const euroAmounts: number[] = [];
    for (const item of row) {
      if (/€/.test(item.str) || /^\d[\d\s]*[,.]?\d{2}$/.test(item.str.trim())) {
        const parsed = parseNumber(item.str);
        if (parsed !== null && parsed > 100) {
          euroAmounts.push(parsed);
        }
      }
    }
    
    // In Dental format: [Prix unitaire, Montant HT, Montant TTC]
    // We want Montant HT (second-to-last or first if only one)
    if (euroAmounts.length >= 2) {
      montantHT = euroAmounts[euroAmounts.length - 2]; // Second to last = HT
    } else if (euroAmounts.length === 1) {
      montantHT = euroAmounts[0];
    }
    
    const designation = descriptionParts.join(' ')
      .replace(/\s+/g, ' ')
      .replace(/\d+[,.]?\d*\s*$/, '') // Remove trailing quantity numbers
      .trim();
    
    if (designation && montantHT > 0) {
      products.push({
        reference,
        designation,
        quantite,
        prixUnitaire: quantite > 0 ? Math.round((montantHT / quantite) * 100) / 100 : null,
        totalHT: montantHT,
      });
    }
  }
  
  return products;
}
```

---

## Résumé des corrections

| Problème | Solution |
|----------|----------|
| Détection source | Pattern `/devis[\s_-]+so\d+/i` pour supporter espaces et tirets |
| Désignation polluée | Utiliser position de "Unité(s)" comme délimiteur, exclure les chiffres |
| VUN/VTN incorrects | Collecter tous les montants €, prendre l'avant-dernier (HT) |

## Données attendues après correction

| Désignation | Nb | VUN | VTN |
|-------------|-----|-----|-----|
| Station de travail 3D fixe CAB | 1 | 1 666 | 1 666,00 € |
| Medit I900C garantie 3 ans tarif fidélité | 1 | 11 000 | 11 000,00 € |


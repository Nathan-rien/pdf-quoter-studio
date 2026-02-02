

# Plan : Corriger l'extraction des désignations du parser Dental

## Diagnostic du problème

Le parser actuel extrait le texte du PDF ligne par ligne, puis cherche le pattern quantité ("X,XXX Unité(s)") pour identifier les lignes produits. La désignation est extraite comme le texte précédant la quantité sur la même ligne.

**Problème identifié :**
- Dans le PDF Dental, le tableau a des colonnes distinctes (Description | Quantité | Prix...)
- pdfjs-dist extrait les éléments textuels avec leurs coordonnées X/Y
- Le groupement par Y (tolérance de 2px) peut séparer ou mal fusionner le texte
- Les descriptions longues peuvent être fragmentées sur plusieurs lignes textuelles

**Ce qui se passe actuellement :**
```
Texte extrait (ligne unique):
"[i900c 3YW fidelite] MEDIT i-Series : Scanner 1,000 Unité(s) 11 000,000 20.0% 11 000,00 € 13 200,00 €"
                                                ↑
                                      Le code coupe ici
```

**Texte attendu du PDF :**
```
"Medit I900C garantie 3 ans tarif fidélité"
```

## Solution proposée

Implémenter une extraction basée sur les colonnes pour le format Dental, en utilisant les coordonnées X des éléments pour assigner chaque texte à sa colonne correcte.

## Fichier à modifier

| Fichier | Modification |
|---------|--------------|
| `src/lib/pdf-import-parser.ts` | Ajouter `extractDentalTableData()` avec parsing par colonnes |

## Modifications détaillées

### 1. Créer une fonction d'extraction spécifique pour Dental

```typescript
interface TextItemWithCoords {
  str: string;
  x: number;
  y: number;
}

interface DentalTableRow {
  description: string;
  quantite: number;
  prixUnitaire: number | null;
  montantHT: number;
}

// Définition des zones de colonnes (approximation basée sur le PDF)
const DENTAL_COLUMNS = {
  DESCRIPTION: { minX: 0, maxX: 250 },
  QUANTITE: { minX: 250, maxX: 330 },
  PRIX_UNITAIRE: { minX: 330, maxX: 400 },
  TAXES: { minX: 400, maxX: 440 },
  MONTANT_HT: { minX: 440, maxX: 520 },
  MONTANT_TTC: { minX: 520, maxX: 600 },
};
```

### 2. Modifier `extractTextWithPdfJs` pour retourner les coordonnées

La fonction actuelle retourne une string. Pour le format Dental, nous avons besoin des coordonnées brutes pour reconstruire le tableau par colonnes.

```typescript
interface ExtractedTextResult {
  text: string;
  items: TextItemWithCoords[];
}

async function extractTextWithPdfJs(file: File): Promise<ExtractedTextResult> {
  // ... code existant ...
  
  // Retourner aussi les items bruts pour analyse par colonnes
  const allItems: TextItemWithCoords[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    for (const item of textContent.items) {
      allItems.push({
        str: item.str ?? '',
        x: item.transform?.[4] ?? 0,
        y: item.transform?.[5] ?? 0,
      });
    }
  }
  
  return { text: lines.join('\n'), items: allItems };
}
```

### 3. Implémenter l'extraction par colonnes pour Dental

```typescript
function extractDentalProducts(items: TextItemWithCoords[]): PDFProductLine[] {
  const products: PDFProductLine[] = [];
  const Y_TOLERANCE = 5;
  
  // 1. Grouper les items par ligne (coordonnée Y)
  const rowMap = new Map<number, TextItemWithCoords[]>();
  
  for (const item of items) {
    if (!item.str.trim()) continue;
    
    // Normaliser Y avec tolérance
    const normalizedY = Math.round(item.y / Y_TOLERANCE) * Y_TOLERANCE;
    
    if (!rowMap.has(normalizedY)) {
      rowMap.set(normalizedY, []);
    }
    rowMap.get(normalizedY)!.push(item);
  }
  
  // 2. Trier les lignes par Y (haut vers bas = Y décroissant)
  const sortedRows = Array.from(rowMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([_, items]) => items.sort((a, b) => a.x - b.x));
  
  // 3. Identifier les lignes produits (contiennent "Unité(s)" ou pattern quantité)
  for (const row of sortedRows) {
    const rowText = row.map(i => i.str).join(' ');
    
    // Vérifier si c'est une ligne produit
    if (!rowText.match(/\d+[,.]?\d*\s*Unit[eé]\(?s?\)?/i)) continue;
    if (/^(Sous-total|Montant|Total|Description)/i.test(rowText)) continue;
    
    // 4. Assigner chaque item à sa colonne selon X
    let description = '';
    let reference: string | null = null;
    let quantite = 1;
    let prixUnitaire: number | null = null;
    let montantHT = 0;
    
    for (const item of row) {
      const x = item.x;
      const text = item.str.trim();
      
      // Description (colonne gauche)
      if (x < 250) {
        // Extraire référence si présente
        const refMatch = text.match(/^\[([A-Z0-9\-]+)\]\s*/i);
        if (refMatch) {
          reference = refMatch[1];
          description += text.substring(refMatch[0].length) + ' ';
        } else {
          description += text + ' ';
        }
      }
      // Quantité
      else if (x >= 250 && x < 330) {
        const qtyMatch = text.match(/(\d+[,.]?\d*)/);
        if (qtyMatch) {
          quantite = Math.round(parseFloat(qtyMatch[1].replace(',', '.'))) || 1;
        }
      }
      // Prix unitaire
      else if (x >= 330 && x < 400) {
        prixUnitaire = parseNumber(text);
      }
      // Montant HT
      else if (x >= 440 && x < 520) {
        montantHT = parseNumber(text) || 0;
      }
    }
    
    description = description.trim();
    
    if (description && montantHT > 0) {
      products.push({
        reference,
        designation: description,
        quantite,
        prixUnitaire: prixUnitaire || (quantite > 0 ? Math.round((montantHT / quantite) * 100) / 100 : null),
        totalHT: montantHT,
      });
    }
  }
  
  return products;
}
```

### 4. Intégrer dans `parseDentalText`

```typescript
function parseDentalText(text: string, items?: TextItemWithCoords[]): Partial<PDFParseResult> {
  // ... code existant pour métadonnées, client, totaux ...
  
  // Extraction des produits avec la nouvelle méthode par colonnes
  if (items && items.length > 0) {
    result.lignes = extractDentalProducts(items);
  }
  
  // Fallback si pas d'items ou extraction vide
  if (result.lignes!.length === 0) {
    // ... code existant de parsing par regex ...
  }
  
  return result;
}
```

### 5. Mettre à jour `parsePDF`

```typescript
export async function parsePDF(file: File): Promise<PDFParseResult> {
  const { text: rawText, items } = await extractTextWithPdfJs(file);
  
  // ...
  
  if (source === 'dental') {
    parsedData = parseDentalText(rawText, items);
  }
  
  // ...
}
```

## Schéma de la solution

```text
+-------------------+     +-------------------+     +-------------------+
|   PDF Dental      |     |  extractText...   |     |  extractDental    |
|                   | --> |  (retourne items  | --> |  Products()       |
|  Tableau multi-   |     |   avec coords)    |     |  (groupe par Y,   |
|  colonnes         |     |                   |     |   assigne par X)  |
+-------------------+     +-------------------+     +-------------------+
                                                            |
                                                            v
                                                    +-------------------+
                                                    |  PDFProductLine[] |
                                                    |  - designation    |
                                                    |  - quantite       |
                                                    |  - prixUnitaire   |
                                                    |  - totalHT        |
                                                    +-------------------+
```

## Avantages de cette approche

| Aspect | Bénéfice |
|--------|----------|
| **Précision** | Utilise les coordonnées natives du PDF |
| **Robustesse** | Fonctionne même si le texte est fragmenté |
| **Extensibilité** | Facile d'ajuster les seuils de colonnes |
| **Compatibilité** | Fallback vers l'ancien parsing si nécessaire |

## Données attendues après correction

| Désignation | Qty | PU | Total HT |
|-------------|-----|-----|----------|
| Medit I900C garantie 3 ans tarif fidélité | 1 | 11 000 | 11 000,00 € |
| Station de travail 3D fixe CAB | 1 | 1 666 | 1 666,00 € |


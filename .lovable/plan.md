

# Plan : Implémenter le parser PDF au format Dental (3D DENTAL STORE)

## Analyse du format Dental

### Structure du PDF
Le devis "Dental" (3D DENTAL STORE) a une structure distincte des formats Cybertek/GrosBill :

| Section | Contenu |
|---------|---------|
| En-tête | Logo 3D DENTAL STORE + coordonnées fournisseur |
| Client | Bloc "CABINET DENTAIRE DR..." avec adresse |
| Métadonnées | Référence (#SO74920), Date, Échéance, Vendeur |
| Produits | Tableau multi-sections avec colonnes spécifiques |
| Totaux | Sous-total HT, Taxes (TVA), Total TTC |

### Colonnes du tableau produits
```
| Description | Quantité | Prix unitaire | Taxes | Montant HT | Montant TTC |
```

### Sections produits identifiées
1. **Produit principal** : "Medit I900C garantie 3 ans..." (11 000 € HT)
2. **Informatique** : "[OF-CAB] Station de travail 3D fixe CAB" (1 666 € HT)
3. **Livraison** : Incluse (0 €)
4. **Formation** : Incluse (0 €)

---

## Fichier à modifier

| Fichier | Modification |
|---------|--------------|
| `src/lib/pdf-import-parser.ts` | Ajouter le type 'dental' + fonction `parseDentalText()` |

---

## Modifications détaillées

### 1. Étendre le type source

```typescript
// Ligne 11 - Ajouter 'dental' au type union
export interface PDFParseResult {
  source: 'cybertek' | 'grosbill' | 'dental' | 'unknown';
  // ...
}
```

### 2. Ajouter la détection du format Dental

```typescript
// Dans detectSourceFromFilename()
function detectSourceFromFilename(filename: string): 'cybertek' | 'grosbill' | 'dental' | 'unknown' {
  const lowerName = filename.toLowerCase();
  if (lowerName.includes('cybertek') || lowerName.includes('kedge')) return 'cybertek';
  if (lowerName.includes('grosbill') || /devis_\d+_\d+/i.test(lowerName)) return 'grosbill';
  if (lowerName.includes('dental') || /devis_-_so\d+/i.test(lowerName)) return 'dental';
  return 'unknown';
}

// Dans detectSourceFromText()
function detectSourceFromText(text: string): 'cybertek' | 'grosbill' | 'dental' | 'unknown' {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('cybertek') || lowerText.includes('groupe cybertek')) return 'cybertek';
  if (lowerText.includes('grosbill')) return 'grosbill';
  if (lowerText.includes('3d dental store') || lowerText.includes('3ddentalstore')) return 'dental';
  return 'unknown';
}
```

### 3. Créer la fonction `parseDentalText()`

```typescript
function parseDentalText(text: string): Partial<PDFParseResult> {
  const result: Partial<PDFParseResult> = {
    source: 'dental',
    lignes: [],
    client: { nom: null, adresse: null, codePostal: null, ville: null, telephone: null, email: null },
    devis: { reference: null, date: null, validite: null, numeroClient: null },
    commercial: { nom: null, email: null },
    location: { duree: null, loyerMensuel: null, montantTotal: null },
    totaux: { totalHT: null, tva: null, totalTTC: null },
  };

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // === MÉTADONNÉES DEVIS ===
  
  // Référence devis : "Devis # SO74920"
  const refMatch = text.match(/Devis\s*#?\s*(SO\d+)/i);
  if (refMatch) result.devis!.reference = refMatch[1];
  
  // Date : "Date du devis : 10/12/2025"
  const dateMatch = text.match(/Date\s+du\s+devis\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (dateMatch) result.devis!.date = dateMatch[1];
  
  // Échéance : "Echéance : 19/12/2025"
  const echeanceMatch = text.match(/[EÉ]ch[eé]ance\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (echeanceMatch) result.devis!.validite = echeanceMatch[1];
  
  // Référence client : "Référence Client : 6500"
  const clientNumMatch = text.match(/R[eé]f[eé]rence\s+Client\s*:\s*(\d+)/i);
  if (clientNumMatch) result.devis!.numeroClient = clientNumMatch[1];
  
  // Commercial : "Vendeur : Ambre-Lise SAVOÏA"
  const vendeurMatch = text.match(/Vendeur\s*:\s*([A-Za-zÀ-ÿ\s\-]+?)(?=\n|$)/i);
  if (vendeurMatch) result.commercial!.nom = vendeurMatch[1].trim();

  // === INFORMATIONS CLIENT ===
  
  // Rechercher le bloc client (nom en majuscules après l'en-tête 3D DENTAL STORE)
  const clientBlockMatch = text.match(
    /(CABINET\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s\-]+)\s+(\d+\s+[A-Za-zÀ-ÿ\s\-]+)\s+(\d{5})\s+([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s\-]+)/i
  );
  if (clientBlockMatch) {
    result.client!.nom = clientBlockMatch[1].trim();
    result.client!.adresse = clientBlockMatch[2].trim();
    result.client!.codePostal = clientBlockMatch[3];
    result.client!.ville = clientBlockMatch[4].trim();
  }

  // === LIGNES PRODUITS ===
  
  // Pattern pour lignes de produit Dental :
  // "Description | 1,000 Unité(s) | 11 000,000 | 20.0% | 11 000,00 € | 13 200,00 €"
  // Ou format simplifié avec Montant HT uniquement
  const money = '(\\d+(?:[\\s\\.]\\d{3})*(?:[,.]\\d{2,3})?)';
  
  // Pattern 1: Ligne avec code "[OF-XXX]" ou sans
  const productLineRegex = new RegExp(
    `^(\\[?[A-Z0-9\\-]+\\]?)?\\s*(.+?)\\s+(\\d+[,.]\\d{3})\\s+Unit[eé]\\(s\\)\\s+${money}\\s+\\d+[,.]\\d%\\s+${money}\\s*€`,
    'i'
  );
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip header, sous-totaux, sections vides
    if (/^(Description|Sous-total|Montant|Informatique|Livraison|Formation|Taxes|Total)/i.test(line)) continue;
    if (/Incluse|Inclus/i.test(line) && /0[,.]00/i.test(line)) continue;
    
    // Match product line
    const m = line.match(productLineRegex);
    if (m) {
      const ref = m[1] ? m[1].replace(/[\[\]]/g, '').trim() : null;
      const designation = m[2].trim();
      const qtyRaw = m[3].replace(',', '.'); // "1,000" -> "1.000"
      const qty = Math.round(parseFloat(qtyRaw));
      const prixUnitaire = parseNumber(m[4]);
      const totalHT = parseNumber(m[5]) || 0;
      
      if (designation && totalHT > 0) {
        result.lignes!.push({
          reference: ref,
          designation,
          quantite: qty || 1,
          prixUnitaire,
          totalHT,
        });
      }
    }
  }
  
  // Fallback: Scanner pour lignes avec montant HT
  if (result.lignes!.length === 0) {
    const fallbackRegex = new RegExp(`(.+?)\\s+(\\d+[,.]\\d{3})\\s+Unit[eé].*?${money}\\s*€.*?${money}\\s*€`, 'gi');
    let match;
    while ((match = fallbackRegex.exec(text)) !== null) {
      const designation = match[1].trim();
      const qty = Math.round(parseFloat(match[2].replace(',', '.')));
      const totalHT = parseNumber(match[3]) || 0;
      
      if (designation && totalHT > 0 && !/Sous-total|Montant|Total/i.test(designation)) {
        result.lignes!.push({
          reference: null,
          designation,
          quantite: qty || 1,
          prixUnitaire: qty > 0 ? Math.round((totalHT / qty) * 100) / 100 : null,
          totalHT,
        });
      }
    }
  }

  // === TOTAUX ===
  
  // Montant hors taxes : "12 666,00 €"
  const totalHTMatch = text.match(/Montant\s+hors\s+taxes\s*[\n\r]?\s*([\d\s,.]+)\s*€/i);
  if (totalHTMatch) {
    result.totaux!.totalHT = parseNumber(totalHTMatch[1]);
  }
  
  // Taxes : "2 533,20 €"
  const taxesMatch = text.match(/^Taxes\s*[\n\r]?\s*([\d\s,.]+)\s*€/im);
  if (taxesMatch) {
    result.totaux!.tva = parseNumber(taxesMatch[1]);
  }
  
  // Total TTC : "Total 15 199,20 €"
  const totalTTCMatch = text.match(/^Total\s+(?:Total\s+)?([\d\s,.]+)\s*€/im);
  if (totalTTCMatch) {
    result.totaux!.totalTTC = parseNumber(totalTTCMatch[1]);
  }
  
  // Fallback: Calculer depuis les lignes si non trouvé
  if (result.totaux!.totalHT === null && result.lignes!.length > 0) {
    const sumHT = result.lignes!.reduce((s, l) => s + (l.totalHT || 0), 0);
    result.totaux!.totalHT = Math.round(sumHT * 100) / 100;
    result.totaux!.tva = Math.round(sumHT * 0.20 * 100) / 100;
    result.totaux!.totalTTC = Math.round(sumHT * 1.20 * 100) / 100;
  }

  return result;
}
```

### 4. Intégrer dans la fonction principale `parsePDF()`

```typescript
// Ligne ~1240 dans parsePDF()
if (source === 'cybertek') {
  parsedData = parseCybertekText(rawText);
} else if (source === 'grosbill') {
  parsedData = parseGrosbillText(rawText);
} else if (source === 'dental') {
  parsedData = parseDentalText(rawText);  // ← NOUVEAU
}
```

### 5. Mettre à jour l'UI (PDFImportZone.tsx)

```typescript
// Ajouter le label pour le source 'dental'
const getSourceLabel = (source: 'cybertek' | 'grosbill' | 'dental' | 'unknown') => {
  switch (source) {
    case 'cybertek': return 'Cybertek Pro';
    case 'grosbill': return 'GrosBill Pro';
    case 'dental': return '3D Dental Store';
    default: return 'Inconnu';
  }
};

// Ajouter le badge dans la zone d'import
<div className="flex gap-2 mt-2">
  <Badge variant="outline">Cybertek Pro</Badge>
  <Badge variant="outline">GrosBill Pro</Badge>
  <Badge variant="outline">3D Dental Store</Badge>  {/* ← NOUVEAU */}
</div>
```

---

## Données extraites pour le PDF exemple

| Champ | Valeur extraite |
|-------|-----------------|
| **Référence devis** | SO74920 |
| **Date** | 10/12/2025 |
| **Échéance** | 19/12/2025 |
| **N° client** | 6500 |
| **Vendeur** | Ambre-Lise SAVOÏA |
| **Nom client** | CABINET DENTAIRE DR LECARDINAL |
| **Adresse** | 9 Rue Stanislas |
| **Code postal** | 75006 |
| **Ville** | PARIS |
| **Ligne 1** | Medit I900C garantie 3 ans (Qty: 1, HT: 11 000 €) |
| **Ligne 2** | [OF-CAB] Station de travail 3D fixe CAB (Qty: 1, HT: 1 666 €) |
| **Total HT** | 12 666,00 € |
| **TVA** | 2 533,20 € |
| **Total TTC** | 15 199,20 € |

---

## Fichiers modifiés

| Fichier | Type de modification |
|---------|---------------------|
| `src/lib/pdf-import-parser.ts` | Ajout type 'dental' + `parseDentalText()` + intégration |
| `src/components/data-editor/PDFImportZone.tsx` | Ajout label + badge "3D Dental Store" |

---

## Champs NON disponibles (comme prévu)

| Champ | Raison |
|-------|--------|
| PX ACHAT | Non présent dans le devis client |
| MARGE | Calculable uniquement avec le prix d'achat |
| GROSSISTE | Non applicable (vente directe 3D Dental Store) |


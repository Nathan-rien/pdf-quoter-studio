

# Plan : Corriger le parsing Cybertek (Adresse, Totaux, Ligne Installation)

## Problèmes identifiés

### 1. Adresse non récupérée
Le parser Cybertek cherche des patterns très spécifiques mais ne récupère pas correctement le bloc "ADRESSE DE LIVRAISON":
- **Actuellement** : regex trop spécifique (`DOMAINE DE RABA + RUE/AVENUE/COURS...`)
- **Attendu** : Extraction multi-lignes après "ADRESSE DE LIVRAISON"

### 2. Données Matrice non populées  
Les totaux (Total HT, TVA, TTC) ne sont pas visibles dans le texte extrait du PDF Cybertek. Ils doivent être **calculés** à partir des lignes produits :
- Total HT = 2 176 + 3 222 + 216 + 8 112 + 974 = **14 700,00 €**
- TVA 20% = 14 700 × 0.20 = **2 940,00 €**
- Total TTC = 14 700 × 1.20 = **17 640,00 €**

### 3. Ligne "Installation" manquante
Le parser cherche les lignes commençant par "Installation" mais le PDF Cybertek montre:
- REF = "Installation"
- DESIGNATION = "Prestation d'installation sur les sites de Bordeaux..."

Le problème : la ligne parsée commence par "Prestation d'installation" car le texte est concaténé différemment.

---

## Modifications requises

### Fichier : `src/lib/pdf-import-parser.ts`

### Modification 1 : Extraire l'adresse depuis "ADRESSE DE LIVRAISON"

**Lignes 122-141** - Ajouter une extraction multi-lignes après "ADRESSE DE LIVRAISON":

```typescript
// Cybertek: Extract address from ADRESSE DE LIVRAISON block
const livraisonIdx = lines.findIndex((l) => /ADRESSE\s+DE\s+LIVRAISON/i.test(l));
if (livraisonIdx !== -1) {
  // Skip header lines (GROUPE CYBERTEK, etc.) - look for client name pattern
  for (let i = livraisonIdx + 1; i < Math.min(livraisonIdx + 10, lines.length); i++) {
    const line = lines[i];
    
    // Skip company info lines
    if (/S\.?A\.?S\.?\s+GROUPE\s+CYBERTEK|SIEGE\s+SOCIAL|AU\s+CAPITAL|RCS|TVA\s*:/i.test(line)) {
      continue;
    }
    
    // Stop at next section marker
    if (/ADRESSE\s+DE\s+FACTURATION|N°\s*client|Devis\s+du/i.test(line)) {
      break;
    }
    
    // Client name (first significant line after headers)
    if (!result.client!.nom && /^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s]+$/.test(line) && line.length > 5) {
      result.client!.nom = line.trim();
      continue;
    }
    
    // Address line (contains street keywords or numbers)
    if (!result.client!.adresse && /\d+|RUE|AVENUE|COURS|BOULEVARD|DOMAINE|CHEMIN/i.test(line)) {
      result.client!.adresse = line.trim();
      continue;
    }
    
    // Postal code + City (5 digits + city name)
    const cpVille = line.match(/^(\d{5})\s+(.+?)(?:\s+FR)?$/i);
    if (cpVille) {
      result.client!.codePostal = cpVille[1];
      result.client!.ville = cpVille[2].replace(/\s+FR$/i, '').trim();
      break;
    }
  }
}
```

### Modification 2 : Calculer les totaux si non trouvés

**Lignes 396-427** - Ajouter une stratégie de calcul après les fallbacks:

```typescript
// Strategy 4: Calculate totals from line items if still not found
if (result.totaux!.totalHT === null && result.lignes!.length > 0) {
  const calculatedTotalHT = result.lignes!.reduce(
    (sum, line) => sum + (line.totalHT || 0), 
    0
  );
  
  if (calculatedTotalHT > 0) {
    result.totaux!.totalHT = Math.round(calculatedTotalHT * 100) / 100;
    result.totaux!.tva = Math.round(calculatedTotalHT * 0.20 * 100) / 100;
    result.totaux!.totalTTC = Math.round(calculatedTotalHT * 1.20 * 100) / 100;
    console.log('Cybertek - Totals calculated from line items:', result.totaux);
  }
}
```

### Modification 3 : Ajouter "Prestation" dans les références spéciales

**Ligne 199** - Étendre la liste `specialRefs`:

```typescript
// Special refs without dash - including service/prestation lines
const specialRefs = ['Installation', 'Frais de livraison', 'Prestation'];
```

Et modifier la logique de matching pour être plus flexible (lignes 236-265):

```typescript
// Special refs: match at start OR check if "Installation" is the reference column
const specialRefMatch = specialRefs.find((sr) => 
  l.toLowerCase().startsWith(sr.toLowerCase()) ||
  (sr === 'Installation' && /^Installation\s+/i.test(l))
);

// Also handle case where "Installation" appears as a standalone ref followed by description
if (!specialRefMatch && /^Installation$/i.test(l.trim())) {
  // This is likely the REF "Installation" - look for designation in next line
  // ... handle this case
}
```

---

## Résumé des résultats attendus

| Donnée | Avant | Après |
|--------|-------|-------|
| **Nom client** | GROUPE KEDGE BUSINESS SCHOOL ✓ | GROUPE KEDGE BUSINESS SCHOOL ✓ |
| **Adresse** | null ❌ | DOMAINE DE RABA 680 COURS DE LA LIBERATION ✓ |
| **Code postal** | 33400 ✓ | 33400 ✓ |
| **Ville** | TALENCE FR ✓ | TALENCE ✓ (sans "FR") |
| **Total HT** | null ❌ | 14 700,00 € ✓ (calculé) |
| **TVA 20%** | null ❌ | 2 940,00 € ✓ (calculé) |
| **Total TTC** | null ❌ | 17 640,00 € ✓ (calculé) |
| **Ligne Installation** | manquante ❌ | Présente ✓ |

---

## Impact technique

- **Fichier modifié** : `src/lib/pdf-import-parser.ts`
- **Fonction modifiée** : `parseCybertekText()`
- **Aucun impact sur** : Le parser Grosbill (fonction séparée)
- **Rétrocompatibilité** : Les extractions existantes restent en fallback


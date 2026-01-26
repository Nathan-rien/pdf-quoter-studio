
# Plan : Corriger l'extraction complète de la désignation "Installation"

## Problème identifié

D'après les logs, la structure du PDF est :

```
Ligne 1: "Prestation d'installation sur les sites de Bordeaux et Marseille :"
Ligne 2: "Deplacement sur site / Installation de 2x 16Go de RAM dans"
Ligne 3: "2 974,00 € Installation"     ← QTE=2, Total=974€, marqueur "Installation"
Ligne 4: "chaque NAS + Ajout d'un tiroir d'extension avec 12 disques 8To"
Ligne 5: "sur chaque NAS"
Ligne 6: "1 0,00 € Frais de livraison" ← Fin du bloc
```

**Résultat actuel** :
- Montant : 2974€ (FAUX — le 2 est la quantité, pas une partie du montant)
- Désignation : s'arrête à la ligne 2 (manque lignes 4-5)

**Résultat attendu** :
- Montant : 974€ (VTN total)
- Désignation : "Prestation d'installation sur les sites de Bordeaux et Marseille : Deplacement sur site / Installation de 2x 16Go de RAM dans chaque NAS + Ajout d'un tiroir d'extension avec 12 disques 8To sur chaque NAS"

---

## Cause racine

Le parser actuel collecte la désignation **avant** la ligne contenant le montant, puis s'arrête. 
Or dans ce PDF, la désignation **continue après** la ligne du montant.

Logique actuelle du fallback (lignes ~461-495) :
```typescript
if (fallbackTotal === 0 || j < fallbackEndIdx) {
  fallbackDesignationLines.push(line);
}
```
→ Dès qu'on trouve le montant (`fallbackTotal > 0`), on arrête de collecter.

---

## Solution

### Modification 1 : Collecter la désignation APRÈS la ligne du montant

Dans le bloc de scan des services (`specialRefMatch === 'Installation'`), après avoir détecté la ligne contenant le montant :

1. **Continuer à scanner** les lignes suivantes jusqu'à un marqueur de fin (ex: `Frais de livraison`, `Offre Locative`, prochain produit SY-)
2. **Ajouter ces lignes** à `fallbackDesignationLines`

```typescript
// Après la boucle de collecte du montant, continuer pour récupérer la suite de la désignation
if (fallbackTotal > 0) {
  for (let k = fallbackEndIdx + 1; k < rowsSource.length && k <= fallbackEndIdx + 4; k++) {
    const line = rowsSource[k];
    
    // Arrêter si on atteint un nouveau bloc
    if (isFraisLivraisonLine(line) || 
        stopRe.test(line) || 
        syRefPattern.test(line) ||
        /Offre\s+Locative/i.test(line)) {
      break;
    }
    
    // Ignorer les lignes bannies
    if (isBannedLine(line) || isGarantieLine(line)) continue;
    
    // Ajouter à la désignation
    fallbackDesignationLines.push(line);
  }
}
```

### Modification 2 : Corriger l'extraction du montant (974€ au lieu de 2974€)

Le pattern actuel lit `2 974,00` comme un seul montant. 
Il faut détecter que le `2` est la QTE et `974,00` est le montant.

Format de la ligne : `2 974,00 € Installation`

Pattern corrigé :
```typescript
// Détecter spécifiquement le pattern "QTE (espace) MONTANT €" pour Installation
const installAmountPattern = /^(\d{1,2})\s+([\d\s,.]+)\s*€/;
const match = line.match(installAmountPattern);
if (match) {
  fallbackQty = parseInt(match[1], 10);      // 2
  fallbackTotal = parseNumber(match[2]);     // 974.00
}
```

### Modification 3 : Nettoyer la désignation finale

Retirer :
- Le marqueur "Installation" s'il est collé à la fin de la ligne du montant
- Les espaces multiples
- Les chiffres orphelins

---

## Fichier modifié

`src/lib/pdf-import-parser.ts`

### Zones à modifier

1. **Lignes ~461-496** (fallback scan) : Ajouter une boucle de continuation après la détection du montant pour collecter les lignes 4-5
2. **Lignes ~469-480** (extraction montant) : Améliorer la regex pour séparer correctement QTE (2) du montant (974,00)
3. **Lignes ~500-507** (construction désignation) : S'assurer que les lignes après le montant sont incluses

---

## Résultat attendu après correction

| Champ | Avant | Après |
|-------|-------|-------|
| Désignation | "...Installation de 2x 16Go de RAM dans" | "...Installation de 2x 16Go de RAM dans chaque NAS + Ajout d'un tiroir d'extension avec 12 disques 8To sur chaque NAS" |
| Quantité | 2 | 2 (inchangé) |
| VTN | 2 974,00 € | 974,00 € |

---

## Détail technique

```text
┌─────────────────────────────────────────────────────────────────┐
│ PDF extrait (rowsSource)                                        │
├─────────────────────────────────────────────────────────────────┤
│ [i]   "Prestation d'installation sur les sites de..."          │
│ [i+1] "Deplacement sur site / Installation de 2x 16Go..."      │
│ [i+2] "2 974,00 € Installation"  ← QTE=2, Total=974€           │
│ [i+3] "chaque NAS + Ajout d'un tiroir..."                      │ ← À COLLECTER
│ [i+4] "sur chaque NAS"                                         │ ← À COLLECTER
│ [i+5] "1 0,00 € Frais de livraison"  ← STOP                    │
└─────────────────────────────────────────────────────────────────┘
```

**Logique corrigée :**
1. Détecter "Prestation d'installation..." → déclenche le mode Installation
2. Collecter lignes i, i+1 pour la désignation
3. Ligne i+2 : extraire QTE=2, Total=974€ (regex améliorée)
4. **NOUVEAU** : Continuer à scanner i+3, i+4 → ajouter à la désignation
5. Ligne i+5 : "Frais de livraison" → STOP

---

## Risques

- **Risque** : Collecter des lignes non pertinentes après le montant
  - **Garde-fou** : Limiter la fenêtre post-montant à 4 lignes max
  - **Garde-fou** : S'arrêter immédiatement sur les marqueurs de fin

- **Risque** : Regex trop permissive pour le montant
  - **Garde-fou** : Vérifier que le montant est dans une plage raisonnable (100-5000€ pour les services)

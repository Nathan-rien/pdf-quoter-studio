

# Plan : Corriger la détection de la ligne "Installation" dans le parser Cybertek

## Analyse du problème

D'après les logs et les captures d'écran :
- **3 lignes extraites** : Mémoire, Chassis, Disque dur
- **2 lignes manquantes** : Kit Rails RKS-02, Installation (+ Frais de livraison à 0€)

### Cause racine identifiée

1. **La ligne "Kit Rails RKS-02"** (SY-RKS02) n'est pas extraite → probablement absorbée dans une autre ligne ou le pattern `syRefPattern` ne la détecte pas
2. **La ligne "Installation"** n'est pas détectée → le texte extrait du PDF ne contient peut-être pas cette ligne dans le bon format, ou le `stopRe` interrompt le parsing avant d'y arriver

Le pattern `stopRe` actuel est :
```typescript
const stopRe = /^(Offre\s+Locative|TOTAL\s*HT|Total\s*HT|TVA\s*20|Total\s*TTC|CONDITIONS)/i;
```

Si le PDF contient "TOTAL HT" ou similaire **avant** la ligne "Installation", le parsing s'arrête prématurément.

## Modifications requises

### Fichier : `src/lib/pdf-import-parser.ts`

#### Modification 1 : Ajouter des logs de debug pour diagnostiquer

Ajouter un log qui affiche **toutes les lignes** du `rowsSource` pour comprendre où se situent "Installation" et "Frais de livraison" par rapport aux marqueurs d'arrêt.

```typescript
// Après la ligne 240 (construction de rowsSource)
console.log('[Cybertek Parser] Table rows count:', rowsSource.length);
console.log('[Cybertek Parser] Sample rows (last 20):', rowsSource.slice(-20));
```

#### Modification 2 : Ajuster le `stopRe` pour ne pas s'arrêter trop tôt

Le problème : le pattern `stopRe` contient `TOTAL\s*HT` qui peut matcher une ligne de sous-total **avant** les services.

Solution : Ne pas arrêter sur le premier "Total HT" rencontré. Modifier le `stopRe` pour être plus spécifique :

```typescript
// Au lieu de stopper sur n'importe quel "Total HT", 
// stopper uniquement sur les marqueurs de fin de tableau définitifs
const stopRe = /^(Offre\s+Locative|CONDITIONS|Prix\s+Total\s+de\s+vente|PRIX\s+TOTAL)/i;
```

OU : Parcourir **tout** le tableau avant de s'arrêter, puis filtrer les lignes après.

#### Modification 3 : Scan en deux passes

1. **Première passe** : Extraire les produits standards (SY-XXX)
2. **Deuxième passe** : Parcourir **tout** le texte pour trouver les lignes "Installation" et "Frais de livraison"

Cette approche garantit que les services ne sont pas ignorés même s'ils apparaissent après des marqueurs de total.

```typescript
// Après la boucle principale (ligne 542), ajouter une recherche dédiée
// Scan for "Installation" anywhere in the document
const installIdx = lines.findIndex(l => /^Installation$/i.test(l.trim()));
if (installIdx !== -1) {
  // Extract the following lines for designation and amounts
  // ...
}
```

#### Modification 4 : Recherche de "Installation" dans tout le document

Implémenter une recherche spécifique qui ne dépend pas de l'ordre des lignes :

```typescript
// Après le parsing standard, chercher explicitement les services
// si non trouvés dans result.lignes
const hasInstallation = result.lignes.some(l => 
  l.reference?.toLowerCase().includes('installation')
);

if (!hasInstallation) {
  // Chercher "Installation" dans TOUTES les lignes
  for (let i = 0; i < lines.length; i++) {
    if (/^Installation$/i.test(lines[i].trim())) {
      // Fenêtre lookahead pour récupérer désignation + montant
      // ...
    }
  }
}
```

## Résumé technique

| Modification | Description |
|--------------|-------------|
| 1. Logs de debug | Afficher `rowsSource.slice(-20)` pour voir les dernières lignes du tableau |
| 2. `stopRe` moins agressif | Ne pas stopper sur "Total HT" mais seulement sur "Offre Locative" ou "CONDITIONS" |
| 3. Scan dédié services | Rechercher "Installation" et "Frais de livraison" dans **tout** le document après le parsing standard |
| 4. Fallback texte complet | Si les services ne sont pas trouvés, parcourir `lines` (pas `rowsSource`) |

## Résultat attendu

| Ligne | Avant | Après |
|-------|-------|-------|
| Mémoire Synology | ✅ | ✅ |
| Chassis RX1217RP | ✅ | ✅ |
| Kit Rails RKS-02 | ❌ | ✅ |
| Disque dur HAT5320 | ✅ | ✅ |
| Installation | ❌ | ✅ (Nb=2, VTN=974€) |
| Frais de livraison | ❌ | ✅ (VTN=0€) |

**Total lignes** : 6 au lieu de 3


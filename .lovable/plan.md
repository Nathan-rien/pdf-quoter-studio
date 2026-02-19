
## Problème : Email client non extrait dans les PDFs "Commande" Cybertek

### Diagnostic précis

Le PDF `Commande_6397708_20260217_10h21.pdf` a la structure suivante (deux colonnes côte à côte) :

```
ADRESSE DE LIVRAISON         ADRESSE DE FACTURATION
SIERRA PRODUCTIONS           SIERRA PRODUCTIONS
40-42 QUAI DU POINT DU JOUR  40-42 QUAI DU POINT DU JOUR
BATIMENT QUAI OUEST          BATIMENT QUAI OUEST
N° CLIENT: 2500096           92650 BOULOGNE BILLANCOURT CEDEX FR
15/01/2026 12:19             06 09 21 89 87
92650 BOULOGNE...  FR        mgiorgetti@aso.fr
06 09 21 89 87
rdebry@aso.fr
```

Il y a **deux bugs** dans `parseCybertekText()` :

**Bug 1 — La boucle s'arrête trop tôt**
À la ligne 206, dès que le parser trouve le code postal + ville, il exécute `break`. Résultat : les lignes téléphone et email qui viennent **après** dans le bloc livraison ne sont jamais lues.

**Bug 2 — L'email client n'est pas extrait**
La boucle du bloc `ADRESSE DE LIVRAISON` (lignes 168-208) ne contient aucune logique pour extraire `result.client.email` ni `result.client.telephone`. Seuls le nom, l'adresse et le code postal/ville sont récupérés.

**Bug 3 — Pas de fallback sur l'ADRESSE DE FACTURATION**
Le PDF Commande contient aussi un bloc `ADRESSE DE FACTURATION` (à droite) qui a un email différent (`mgiorgetti@aso.fr`). Pour les Commandes, cet email de facturation est celui du vrai décideur client. Il devrait être utilisé en priorité s'il est différent.

### Solution

**Fichier modifié : `src/lib/pdf-import-parser.ts`**

#### Modification 1 — Continuer après le code postal pour extraire téléphone et email

Dans la boucle `ADRESSE DE LIVRAISON`, supprimer le `break` après la détection CP+ville et continuer à scanner pour extraire :
- Téléphone (`/^0\d[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}$/`)
- Email (`/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i`)

```typescript
// Postal code + City
const cpVille = line.match(/^(\d{5})\s+(.+?)(?:\s+FR)?$/i);
if (cpVille) {
  result.client!.codePostal = cpVille[1];
  result.client!.ville = cleanCityName(cpVille[2]);
  // ← NE PAS break ici, continuer pour extraire tel/email
  continue;
}

// Phone number
if (!result.client!.telephone && /^0\d[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}$/.test(line.replace(/\s/g, ''))) {
  result.client!.telephone = line.trim();
  continue;
}

// Client email
if (!result.client!.email && /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(line.trim())) {
  result.client!.email = line.trim();
  continue;
}
```

#### Modification 2 — Fallback sur l'ADRESSE DE FACTURATION pour l'email

Pour les PDFs Commande (qui n'ont pas de `Contact commercial direct`), ajouter une extraction du bloc `ADRESSE DE FACTURATION` pour récupérer l'email de facturation, qui prend la priorité sur l'email de livraison :

```typescript
// Extract email from ADRESSE DE FACTURATION block (Commande PDFs)
const facturationIdx = lines.findIndex((l) => /ADRESSE\s+DE\s+FACTURATION/i.test(l));
if (facturationIdx !== -1) {
  for (let i = facturationIdx + 1; i < Math.min(facturationIdx + 12, lines.length); i++) {
    const line = lines[i];
    if (/S\.?A\.?S\.?\s+GROUPE\s+CYBERTEK|SIEGE\s+SOCIAL/i.test(line)) continue;
    if (/COMMENTAIRES|BON\s+POUR\s+ACCORD/i.test(line)) break;
    
    // Phone
    if (!result.client!.telephone && /^0\d[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}$/.test(line.replace(/\s/g, ''))) {
      result.client!.telephone = line.trim();
    }
    // Email from billing address takes priority (override livraison email)
    if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(line.trim())) {
      result.client!.email = line.trim(); // override
      break;
    }
  }
}
```

#### Modification 3 — Fallback regex global pour email client

Si les deux blocs échouent (PDF Devis sans blocs structurés), ajouter un fallback regex global qui cherche un email qui n'est **pas** un email Cybertek (commercial@cybertek-pro.fr) :

```typescript
// Global email fallback for client
if (!result.client!.email) {
  const allEmails = [...text.matchAll(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi)];
  const clientEmail = allEmails.find(m => !/@cybertek/i.test(m[1]));
  if (clientEmail) {
    result.client!.email = clientEmail[1];
  }
}
```

### Résultat attendu après correction

Pour le PDF `Commande_6397708_20260217_10h21.pdf` :

| Champ | Avant | Après |
|-------|-------|-------|
| `client.email` | `null` | `mgiorgetti@aso.fr` (facturation) |
| `client.telephone` | `null` | `06 09 21 89 87` |
| `client.nom` | `SIERRA PRODUCTIONS` (inchangé) | `SIERRA PRODUCTIONS` |
| `client.adresse` | `40-42 QUAI DU POINT...` | `40-42 QUAI DU POINT...` |

### Fichier modifié

| Fichier | Modification |
|---------|-------------|
| `src/lib/pdf-import-parser.ts` | 3 modifications dans `parseCybertekText()` : (1) ne plus `break` après CP/ville, extraire tel+email; (2) scanner ADRESSE DE FACTURATION; (3) fallback regex global |

Aucune modification de base de données. Aucune modification d'interface.

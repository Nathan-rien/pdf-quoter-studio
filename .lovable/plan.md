

## Problème

Le parseur PDF tente de séparer prénom/nom via `splitClientName`, mais l'ordre dans les PDF Dental (et parfois Cybertek/GrosBill) est imprévisible — "Guédon Jonathan" vs "Jonathan Guédon". La séparation automatique échoue souvent.

## Solution : fusionner prénom+nom en un seul champ `nom`

### 1. Store — `src/stores/rentalProposalStore.ts`

- Supprimer le champ `prenom` de l'interface `ClientData`
- Mettre à jour `initialClientData` (plus de `prenom`)
- Dans `importFromPDF` : concaténer `result.client.prenom` + `result.client.nom` dans le seul champ `nom`
- Partout où `[clientData.prenom, clientData.nom].filter(Boolean).join(' ')` est utilisé, remplacer par `clientData.nom`

### 2. Parseur PDF — `src/lib/pdf-import-parser.ts`

- Supprimer la fonction `splitClientName` (plus besoin de séparer)
- Supprimer l'appel à `splitClientName` dans `parsePDFContent` (lignes 2038-2042)
- Le champ `client.nom` du résultat contiendra le nom complet tel qu'extrait du PDF
- Le champ `client.prenom` reste dans le type `PDFParseResult` mais sera toujours `null` (le store le fusionne)

### 3. Formulaire — `src/components/rental-proposal/RentalDataEditor.tsx`

- Remplacer les 2 champs "Prénom" + "Nom / Raison sociale" par :
  - **"Prénom Nom"** (champ texte, largeur 1/2) — lié à `clientData.nom`
  - **"Raison sociale"** (champ texte, largeur 1/4) — nouveau champ optionnel ou réutilisé
- Garder le champ Email en 3ème colonne

Réflexion : pour l'instant il n'y a pas de champ `raisonSociale` séparé dans le modèle. Deux options :
- Option A : ajouter un champ `raisonSociale` au `ClientData` (propre, mais nécessite mise à jour store + preview + export)
- Option B : garder un seul champ `nom` qui contient soit le nom de la personne soit la raison sociale (plus simple, moins de changements)

Je recommande **Option A** — ajouter `raisonSociale` — car l'utilisateur demande explicitement 2 champs distincts.

### 4. Détail Option A — ajout `raisonSociale`

**Store** (`ClientData`) :
```typescript
interface ClientData {
  nom: string;           // "Prénom Nom" (ex: "Jonathan Guédon")
  raisonSociale: string; // Raison sociale (ex: "CABINET DENTAIRE DU FALAISE")
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  email: string;
  logoUrl: string;
}
```

**Formulaire** (grille 3 colonnes) :
- Col 1 : "Prénom Nom" → `clientData.nom`
- Col 2 : "Raison sociale" → `clientData.raisonSociale`
- Col 3 : "Email" → `clientData.email`

**Parseur** : les raisons sociales détectées (CABINET, SAS…) iront dans `raisonSociale`, le nom de la personne dans `nom`.

**Aperçu + Export** : afficher `raisonSociale` si renseigné (en gras au-dessus du nom), sinon seulement le nom.

### 5. Fichiers impactés

| Fichier | Modification |
|---|---|
| `src/stores/rentalProposalStore.ts` | Remplacer `prenom` par `raisonSociale`, fusionner dans `importFromPDF` |
| `src/lib/pdf-import-parser.ts` | Supprimer `splitClientName`, ne plus séparer prénom/nom |
| `src/components/rental-proposal/RentalDataEditor.tsx` | Champs "Prénom Nom" + "Raison sociale" |
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Afficher `raisonSociale` + `nom` |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Idem pour l'export HTML/PDF |


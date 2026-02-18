
## Correction de l'import des Options Services vers l'aperçu

### Diagnostic

Le bug est une incohérence dans `src/components/rental-proposal/RentalDataEditor.tsx` entre deux fonctions d'import quasi-identiques :

**Fonction `handleImportSelected` (Options page 5) — ligne 90 :**
```typescript
const description = descriptionParts.join(', ');  // ← VIRGULE = tout sur une ligne
```

**Fonction `handleImportNosOptionsSelected` (Nos Options page 6) — ligne 119 :**
```typescript
const description = descriptionParts.join('\n');  // ← SAUT DE LIGNE ✓
```

Résultat visible dans l'aperçu (image fournie) : les 3 services de "Pro-Actif" apparaissent concaténés — `Audit et valorisation du parc existant, Enlèvement et reprise de parc, Destruction garantie des données...` — au lieu d'être affichés ligne par ligne avec des puces.

---

### Solution — 1 ligne modifiée

**`src/components/rental-proposal/RentalDataEditor.tsx`, ligne 90**

```typescript
// AVANT
const description = descriptionParts.join(', ');

// APRÈS
const description = descriptionParts.join('\n');
```

Le rendu dans l'aperçu (`RentalProposalPreview.tsx`) fait déjà un `description.split('\n')` pour afficher chaque ligne comme une puce séparée — le correctif est donc uniquement dans la construction de la `description` lors de l'import.

---

### Fichier modifié

| Fichier | Ligne | Changement |
|---|---|---|
| `src/components/rental-proposal/RentalDataEditor.tsx` | 90 | `join(', ')` → `join('\n')` |

### Impact

- Les services importés depuis l'Admin s'afficheront en liste à puces dans l'aperçu, comme dans l'administration
- Aucun effet sur les données existantes déjà importées (uniquement les futurs imports)
- Aucun effet sur les Nos Options ni sur le reste du code

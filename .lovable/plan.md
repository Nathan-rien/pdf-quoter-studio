

## Correction du parsing d'adresse GrosBill Pro

### Probleme identifie

Trois bugs dans la fonction `parseGrosbillText` de `src/lib/pdf-import-parser.ts` provoquent l'extraction de donnees incorrectes :

| Champ | Valeur affichee (fausse) | Valeur attendue | Cause |
|-------|------------------------|-----------------|-------|
| Adresse | 130 rue Achard - Bat U - | *(vide ou adresse client)* | Le fallback capture l'adresse du siege social Cybertek |
| Code postal | 23014 | 00000 | Le regex capture "23014" depuis le numero de devis "6423014" |
| Ville | - | ST MEDARD EN JALLES | La ligne "00000 ST MEDARD EN JALLES FR" est mappee en bloc sur "ville" au lieu d'etre decomposee |

### Corrections prevues

**Fichier** : `src/lib/pdf-import-parser.ts`, fonction `parseGrosbillText` (lignes ~1015-1055)

1. **Bloc facturation (lignes 1021-1029)** : analyser `l2` intelligemment
   - Si `l2` commence par 5 chiffres (pattern CP), extraire code postal + ville depuis cette ligne
   - Sinon, traiter `l2` comme adresse et chercher CP+ville sur `l3`
   - Aussi examiner les lignes suivantes pour une eventuelle adresse rue si elle existe entre le nom et le CP

2. **Fallback adresse (lignes 1044-1046)** : exclure les adresses du footer
   - Ajouter un filtre pour ignorer les lignes contenant "Siege Social", "SAS GROUPE", ou situees apres ces marqueurs

3. **Fallback CP (lignes 1048-1054)** : eviter les faux positifs
   - Ajouter une frontiere de mot (`\b`) au debut du regex pour ne pas capturer "23014" depuis "6423014"
   - Exclure les lignes qui contiennent "DEVIS", "PAGE", ou "N°"

### Detail technique

```text
Avant (ligne 1022-1029):
  factIdx+1 → nom = "CENTRE DE JALLES"
  factIdx+2 → ville = "00000 ST MEDARD EN JALLES FR"  // BUG

Apres:
  factIdx+1 → nom = "CENTRE DE JALLES"
  factIdx+2 → detecte "00000 ST MEDARD EN JALLES FR"
    → codePostal = "00000"
    → ville = "ST MEDARD EN JALLES"
    → (pas d'adresse rue dans ce devis)
```

Les modifications seront concentrees dans une seule fonction (~30 lignes modifiees) sans impact sur les parsers Cybertek ou Dental.


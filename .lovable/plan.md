

## Problème identifié

La fonction `isDentalNoiseLine` (ligne 1512 de `pdf-import-parser.ts`) filtre les lignes contenant `support@3ddentalstore` :

```typescript
if (/support@3ddentalstore/i.test(line)) return true;
```

Or, dans le PDF Dental, le texte du produit contient légitimement cette adresse email en fin de description :
> *(9h-12h30/14h-17h30) au 02.30.32.24.03 ou par email à support@3ddentalstore.fr*

Quand le PDF est découpé en lignes, la partie contenant l'email est classée comme "bruit" et supprimée.

## Correction

**Fichier** : `src/lib/pdf-import-parser.ts`

Supprimer la règle de filtrage `support@3ddentalstore` dans `isDentalNoiseLine` (ligne 1512). Ce texte fait partie de la description produit et doit être conservé.

Les autres filtres de bruit (adresses vendeur, SIRET/IBAN, entêtes HT/TTC) restent inchangés car ils ne concernent pas le contenu produit.


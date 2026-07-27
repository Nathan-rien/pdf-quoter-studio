## Objectif
Sur le bloc **Signatures** de la page 7 du contrat (la seule page qui rend `service_signature`), forcer le nom du représentant Cybertek à **Grégory Moinet**, indépendamment du commercial sélectionné pour la proposition.

## Changement
Fichier : `src/lib/service-proposal-html-generator.ts`, fonction `renderSignatureZone` (~ligne 372).

Remplacer :
```
Représentée par ${escapeText(selectedCommercial?.nom || commercialData?.commercialId || '—')}
```
par :
```
Représentée par Grégory Moinet
```

## Portée
- Uniquement le bloc `renderSignatureZone`, utilisé exclusivement sur la dernière page CG (page 7) via `signatureBlockHtml`.
- Aucun autre emplacement (interlocuteurs, entête, bloc commercial du devis, autres pages) n'est modifié — `selectedCommercial` reste utilisé partout ailleurs.
- Le côté droit (client) reste inchangé.

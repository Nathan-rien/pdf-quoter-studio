
## Problème : Adresse de l'entité absente du PDF généré

### Diagnostic précis

L'aperçu (`RentalProposalPreview.tsx`) affiche bien l'adresse du commercial en bas de page 1 (lignes 622-628) via un bloc absolu `bottom-0`. Mais dans l'export PDF (`RentalProposalExport.tsx`), le bloc dynamique de la page 1 (lignes 261-286) ne contient que :
- Les données du client (nom, adresse, code postal, email)
- Les coordonnées du commercial (nom, téléphone, email)

**L'adresse de l'entité (`selectedCommercial.adresse`) n'est jamais injectée dans le HTML du PDF.**

### Solution : Ajouter l'adresse de l'entité dans le bloc dynamique de la page 1 du PDF

Dans `generateDynamicContentByPage()` (ligne 261), le bloc `dynamicContent[1]` est enrichi avec un élément positionné en bas de page, identique à ce qu'affiche l'aperçu.

Le bloc final ressemblera à :

```
┌──────────────────────────────────────────────────────────┐
│  [SPARKLAB SRL          ]  [Votre interlocuteur         ]│
│  [Avenue des Cailles 62 ]  [Grégory Moinet              ]│
│  [75013 PARIS           ]  [07 43 15 32 11              ]│
│  [olivier@supercube.com ]  [g.moinet@cybertek-pro.fr    ]│
└──────────────────────────────────────────────────────────┘
     60 Boulevard de l'hôpital, 75013 Paris        ← ici
```

### Fichier modifié

**`src/components/rental-proposal/RentalProposalExport.tsx`** — uniquement la section `dynamicContent[1]` dans `generateDynamicContentByPage()` (autour de la ligne 285).

Ajout juste avant le `</div>` fermant du bloc dynamique de la page 1 :

```html
<!-- Adresse de l'entité en bas de page, centré -->
${selectedCommercial?.adresse ? `
  <div style="
    position: absolute;
    bottom: 0px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 8px;
    color: #6b7280;
    padding-bottom: 4px;
  ">
    ${selectedCommercial.adresse}
  </div>
` : ''}
```

Attention : ce bloc doit être positionné **en dehors** du `dynamic-content` existant (qui a `position: absolute; bottom: 40px`), et placé dans un second élément avec `position: absolute; bottom: 0`.

### Implémentation précise

Le bloc `dynamicContent[1]` actuel est un seul `div.dynamic-content` avec `bottom: 40px`. L'adresse doit être dans un **second div absolu** avec `bottom: 0` (séparé du premier), pour reproduire fidèlement le comportement de l'aperçu.

```html
dynamicContent[1] = `
  <!-- Bloc client + commercial -->
  <div class="dynamic-content" style="position: absolute; bottom: 40px; left: 5%; right: 5%; ...">
    ...contenu existant...
  </div>
  
  <!-- Adresse de l'entité en pied de page -->
  ${selectedCommercial?.adresse ? `
    <div style="position: absolute; bottom: 4px; left: 0; right: 0; text-align: center; font-size: 8px; color: #6b7280; z-index: 40;">
      ${selectedCommercial.adresse}
    </div>
  ` : ''}
`;
```

### Pourquoi pas le placeholder `{{ADRESSE_ENTITE}}` ?

Le mécanisme `{{ADRESSE_ENTITE}}` dans `substituteDynamicPlaceholders` fonctionne uniquement pour les éléments texte **du template** qui contiennent littéralement `{{ADRESSE_ENTITE}}` dans leur contenu. Si le template de l'utilisateur ne l'a pas intégré (il est probable que non), il faut injecter l'adresse directement via le bloc dynamique — comme c'est déjà fait pour les données client et commercial.

### Impact

- Aucune modification de base de données
- Aucune modification de l'aperçu (déjà correct)
- Un seul fichier modifié : `RentalProposalExport.tsx`
- Parité parfaite aperçu ↔ PDF pour l'adresse de l'entité

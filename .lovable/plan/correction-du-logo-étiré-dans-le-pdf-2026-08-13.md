# Correction du logo étiré dans le PDF

## Problème
Le logo Cybertek Pro en haut à droite des pages s'affiche correctement dans l'aperçu, mais apparaît étiré dans le PDF téléchargé.

Cause : le logo est rendu via une balise `<img>` avec une taille forcée (210x60 px) corrigée par `object-fit: contain`. Le moteur de capture utilisé pour le PDF (html2canvas) ne respecte pas `object-fit` sur les images : il étire l'image aux dimensions du cadre.

## Correction
Dans le générateur HTML des pages (`src/lib/service-proposal-html-generator.ts`, en-tête de page) :
- Remplacer l'`<img>` du logo par un conteneur avec `background-image`, `background-size: contain`, `background-repeat: no-repeat`, `background-position: right center` — rendu identique en aperçu et fidèlement respecté à la conversion PDF.
- Conserver exactement la même position, la même largeur et la même hauteur du bloc, pour ne rien changer visuellement dans l'aperçu.

## Vérification
Générer l'aperçu et le PDF d'une proposition Services et comparer le logo sur les pages devis et contrat : proportions identiques, aucune autre modification de mise en page.

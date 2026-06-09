# Plan : Menu déroulant Liens utiles dans la sidebar

## Objectif
Ajouter un onglet déroulant **Liens utiles** dans la barre de navigation verticale de gauche, positionné **juste en dessous de "Mes infos"**. Chaque lien s'ouvre dans un nouvel onglet (`target="_blank"`).

## Implémentation

### 1. Modification de `src/components/layout/AppSidebar.tsx`
- Importer les composants `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` depuis `@/components/ui/collapsible`.
- Importer l'icône `Link` (ou `ExternalLink`) depuis `lucide-react`.
- Ajouter une nouvelle section **Liens utiles** sous le bouton "Mes infos".
- Utiliser `Collapsible` avec un trigger affichant l'icône + le label "Liens utiles".
- À l'intérieur du `CollapsibleContent`, afficher la liste des liens sous forme de petits boutons `ghost` stylisés (taille réduite, légère indentation gauche).

### Liens à intégrer
| Label | URL |
|-------|-----|
| Projet prod | https://quote-enricher.lovable.app/auth |
| ERP | https://jaja.cybertek.fr/magasin/vente.aspx |
| Produit Destock | https://data-shepherd-92.lovable.app/ |
| CRM | https://app-eu1.hubspot.com/reports-dashboard/143332020/view/106706371/183256509 |
| Contact fournisseur | https://cybertekfr-my.sharepoint.com/:o:/r/personal/z_azakri_cybertek-pro_fr/_layouts/15/Doc.aspx?sourcedoc=%7B95415c87-9bb9-4296-80ca-78674a5ecf30%7D&action=edit&wd=target(lenovo.one%7Cce05277c-e208-4cdc-b7b0-93dd3b6a1d4e%2FLenovo%7C4df99934-34b0-4cb2-b5c3-31a875dd9194%2F)&wdorigin=NavigationUrl |
| Dossier commun | https://cybertekfr-my.sharepoint.com/shared?id=%2Fsites%2Fequipe%5FB2B%2FShared%20Documents%2FGeneral&listurl=https%3A%2F%2Fcybertekfr%2Esharepoint%2Ecom%2Fsites%2Fequipe%5FB2B%2FShared%20Documents&viewid=a5737b31%2D7990%2D43a2%2D88ec%2D123f9ee56ea0 |
| TNT | https://www.tnt.fr/mytnt/suivi_colis/recherche/detailbontransport.do |
| Kuehne | https://sso.kuehne-nagel.com/authorization/login |
| Geodis | https://parcelsapp.com/fr/carriers/geodis |
| WelcomeTrack | https://app.welcometrack.io/index.cfm |

- Les 4 derniers liens (TNT, Kuehne, Geodis, WelcomeTrack) seront regroupés visuellement sous un petit label "Suivi transport" à l'intérieur du menu déroulant.

### 2. Style
- Cohérent avec les boutons existants (`ghost`, `w-full`, `justify-start`, `h-8`, `text-sm`).
- Les éléments déroulés auront un `pl-8` (indentation) et une taille de texte légèrement réduite (`text-xs`) pour signifier la hiérarchie.
- Icône `ExternalLink` (ou `Link`) à côté de chaque lien pour indiquer l'ouverture externe.
- Ajout de `rel="noopener noreferrer"` sur chaque `<a>` pour la sécurité.

### 3. Aucun autre fichier modifié
La modification est strictement limitée au composant `AppSidebar.tsx`. Aucun changement de state, de routing ou de store n'est requis.

## Résultat attendu
Un menu "Liens utiles" repliable apparaît dans la sidebar. En cliquant dessus, la liste des liens s'afficre. Un clic sur un lien ouvre l'URL dans un nouvel onglet du navigateur.
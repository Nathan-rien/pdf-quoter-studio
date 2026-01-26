
# Plan : Corriger le rendu PDF pour correspondre au template sélectionné

## Problème identifié

Le PDF téléchargé ne ressemble pas du tout au template visible dans l'aperçu. Deux problèmes majeurs :

1. **Template incorrect** : L'export utilise `getActiveTemplate()` au lieu du `selectedTemplateId` choisi dans le workflow
2. **Rendu hardcodé** : La fonction `generatePDFContent()` génère un HTML statique et basique sans utiliser les éléments du template (images de fond, logos, styles, polices)

### Comparaison

| Élément | Aperçu (Preview) | Export PDF |
|---------|-----------------|------------|
| Image de fond | Rendue depuis le template | Absente |
| Logos | Positionnés selon l'éditeur | Absents |
| Styles texte | Polices, couleurs, tailles | HTML basique |
| Mise en page | Fidèle à l'éditeur | Structure générique |

## Solution technique

### 1. Utiliser le template sélectionné (`selectedTemplateId`)

Modifier `RentalProposalExport.tsx` pour importer et utiliser le template sélectionné :

```typescript
// AVANT
const { getActiveTemplate, getTemplateLatestVersion } = useTemplateEditorStore();
const activeTemplate = getActiveTemplate();

// APRÈS
const { selectedTemplateId } = useRentalProposalStore();
const { allTemplates, getTemplateLatestVersion } = useTemplateEditorStore();

const activeTemplate = useMemo(() => {
  if (selectedTemplateId) {
    return allTemplates.find(t => t.id === selectedTemplateId) || getActiveTemplate();
  }
  return getActiveTemplate();
}, [selectedTemplateId, allTemplates, getActiveTemplate]);
```

### 2. Refactoriser `generatePDFContent()` pour utiliser les éléments du template

Créer une nouvelle fonction qui :
- Charge les éléments de chaque page du template
- Génère le HTML correspondant avec les styles corrects
- Convertit les images en base64 pour l'impression

```typescript
const generatePDFContentFromTemplate = async () => {
  const version = getTemplateLatestVersion(activeTemplate.id);
  if (!version) return generateFallbackPDFContent();
  
  const pagesHTML = await Promise.all(
    version.pages.map(async (page) => {
      const elementsHTML = await Promise.all(
        page.elements.map(el => renderElementToHTML(el))
      );
      return `<div class="page">${elementsHTML.join('')}</div>`;
    })
  );
  
  return buildPDFDocument(pagesHTML);
};
```

### 3. Créer un helper `renderElementToHTML()` dans un fichier partagé

Nouveau fichier `src/lib/pdf-html-generator.ts` :

```typescript
export async function renderElementToHTML(
  element: EditableElement,
  canvasScale: typeof CANVAS_SCALE
): Promise<string> {
  switch (element.type) {
    case 'text':
      return renderTextElementToHTML(element);
    case 'image':
      return await renderImageElementToHTML(element);
    case 'shape':
      return renderShapeElementToHTML(element);
    case 'icon':
      return renderIconElementToHTML(element);
    default:
      return '';
  }
}

function renderTextElementToHTML(element: EditableElement): string {
  const content = element.content as TextContent;
  const style = getSharedElementStyle({ element });
  
  return `<div style="
    position: absolute;
    left: ${style.left};
    top: ${style.top};
    font-family: ${ALLOWED_FONTS.find(f => f.name === content.fontFamily)?.value};
    font-size: ${content.fontSize * PREVIEW_FONT_SCALE}px;
    color: ${content.color};
    font-weight: ${content.bold ? 'bold' : 'normal'};
    ${content.italic ? 'font-style: italic;' : ''}
  ">${escapeHTML(content.text)}</div>`;
}

async function renderImageElementToHTML(element: EditableElement): Promise<string> {
  const content = element.content as ImageContent;
  const resolvedUrl = resolveImageUrl(content);
  
  if (!resolvedUrl) return '';
  
  // Convertir l'image en base64 pour l'impression
  const base64 = await imageToBase64(resolvedUrl);
  
  const style = getSharedElementStyle({ element });
  return `<img src="${base64}" style="
    position: absolute;
    left: ${style.left};
    top: ${style.top};
    width: ${style.width};
    height: ${style.height};
    object-fit: ${content.objectFit || 'contain'};
  " />`;
}
```

### 4. Gérer la conversion des images en base64

Pour que les images s'affichent dans la fenêtre d'impression, elles doivent être converties en base64 :

```typescript
async function imageToBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}
```

### 5. Structure CSS pour impression A4

```css
@media print {
  @page { size: A4 portrait; margin: 0; }
  body { margin: 0; padding: 0; }
  .page {
    width: 210mm;
    height: 297mm;
    position: relative;
    page-break-after: always;
    overflow: hidden;
  }
}
.page {
  width: 210mm;
  min-height: 297mm;
  position: relative;
  background: white;
}
```

## Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/rental-proposal/RentalProposalExport.tsx` | Utiliser `selectedTemplateId`, appeler le nouveau générateur |
| `src/lib/pdf-html-generator.ts` | **Nouveau** - Fonctions de rendu HTML des éléments |
| `src/lib/template-render-utils.ts` | Ajouter helpers pour le rendu HTML (si nécessaire) |

## Injection des données dynamiques

Les données injectées (produits, options, client) seront rendues dans des zones définies :

```typescript
// Page 1 : Données client
function renderPage1DynamicContent(clientData, commercialData): string {
  return `<div class="client-block" style="...">
    <h3>Client</h3>
    <p>${clientData.nom}</p>
    <p>${clientData.adresse}</p>
    ...
  </div>`;
}

// Page 4 : Tableau produits
function renderProductTableHTML(lignesData): string {
  const rows = lignesData.map(ligne => `
    <tr>
      <td>${ligne.designation}</td>
      <td>${ligne.quantite}</td>
      <td>${formatNumber(ligne.prixUnitaire)} €</td>
      <td>${formatNumber(ligne.totalHT)} €</td>
    </tr>
  `).join('');
  
  return `<table class="product-table">${rows}</table>`;
}
```

## Rendu attendu après correction

Le PDF généré affichera :
- L'image de fond de couverture (Page 1)
- Les logos positionnés exactement comme dans l'aperçu
- Les textes avec les bonnes polices, tailles et couleurs
- Les formes et lignes de décoration
- Les données dynamiques injectées dans les zones appropriées

## Complexité et risques

### Complexité : Moyenne-Haute
- Conversion async des images en base64
- Synchronisation exacte des styles entre Preview et HTML
- Gestion des polices personnalisées dans l'impression

### Risques
- **Polices** : Les polices custom (Garet) peuvent ne pas s'afficher dans le PDF si non installées localement
- **Images** : La conversion base64 peut échouer pour des images CORS-protégées
- **Performance** : Conversion de plusieurs images = temps de génération plus long

### Mitigations
- Fallback sur des polices système si la police custom échoue
- Timeout et fallback pour les images qui échouent
- Indicateur de progression pendant la génération

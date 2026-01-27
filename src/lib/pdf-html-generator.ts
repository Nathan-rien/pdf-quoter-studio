/**
 * Générateur HTML pour l'export PDF
 * Convertit les éléments du template en HTML pour l'impression
 * 
 * IMPORTANT: Ce module doit garantir une fidélité WYSIWYG parfaite avec RentalProposalPreview
 * - Utilise les mêmes constantes (CANVAS_SCALE, PREVIEW_FONT_SCALE, etc.)
 * - Applique la même normalisation z-index (+10)
 * - Rend les icônes Lucide en SVG inline
 */

import { CANVAS_SCALE, PREVIEW_FONT_SCALE, PREVIEW_ICON_SCALE, LIST_INDENT_PX, CANVAS_DISPLAY_MAX_WIDTH } from './canvas-constants';
import { ALLOWED_FONTS } from './template-styles';
import { getSharedElementStyle, resolveImageUrl } from './template-render-utils';
import { renderIconSVG } from './lucide-svg-paths';
import type { 
  EditableElement, 
  TextContent, 
  ImageContent, 
  ShapeContent, 
  IconContent,
  TemplateVersion,
  TemplatePageContent
} from '@/types/template-editor';

/**
 * Normalise le z-index d'un élément (identique à RentalProposalPreview)
 * Ajoute +10 pour éviter que les éléments avec zIndex négatif soient cachés
 */
const normalizeZIndex = (element: EditableElement): number => (element.zIndex ?? 0) + 10;

// Cache pour les images base64 (éviter les conversions répétées)
const imageCache = new Map<string, string>();

/**
 * Convertit une image URL en base64 pour l'impression
 */
export async function imageToBase64(url: string): Promise<string> {
  // Vérifier le cache
  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout loading image: ${url}`));
    }, 10000);
    
    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL('image/png');
        imageCache.set(url, base64);
        resolve(base64);
      } catch (err) {
        reject(err);
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      // Fallback : retourner l'URL originale si la conversion échoue
      console.warn(`Failed to convert image to base64: ${url}`);
      resolve(url);
    };
    
    img.src = url;
  });
}

/**
 * Échappe les caractères HTML dangereux
 */
export function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br>');
}

/**
 * Convertit les styles CSS React en string inline
 */
function styleToString(style: React.CSSProperties): string {
  return Object.entries(style)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      // Convertir camelCase en kebab-case
      const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${kebabKey}: ${value}`;
    })
    .join('; ');
}

/**
 * Rend un élément texte en HTML
 * Structure harmonisée avec RentalProposalPreview :
 * - Wrapper externe : position absolute + zIndex normalisé
 * - Wrapper interne : padding px-0.5 py-px (~2px/1px) + styles typo
 * - Contenu : htmlContent ou texte brut avec gestion listType
 */
function renderTextElementToHTML(element: EditableElement): string {
  const content = element.content as TextContent;
  const positionStyle = getSharedElementStyle({ element });
  
  const fontDef = ALLOWED_FONTS.find(f => f.name === content.fontFamily);
  // IMPORTANT: fallback identique à l'Aperçu (RentalProposalPreview)
  // Un fallback différent change les métriques (wrap) et provoque des chevauchements sur les pages denses (ex: page 3)
  const fontValue = fontDef?.value || 'Outfit, sans-serif';
  const scaledFontSize = Math.max(content.fontSize * PREVIEW_FONT_SCALE, 6);
  const indentPx = (content.indentLevel || 0) * LIST_INDENT_PX;
  
  // Wrapper externe : positionnement absolu (identique à getSharedElementStyle)
  const outerStyle: React.CSSProperties = {
    ...positionStyle,
    zIndex: normalizeZIndex(element),
  };
  
  // Wrapper interne : padding équivalent à Tailwind "px-0.5 py-px" (~2px horizontal, 1px vertical)
  // + styles typographiques pour héritage dans htmlContent
  // width: 100% pour matcher la structure de l'aperçu
  const innerStyle: React.CSSProperties = {
    width: '100%',
    padding: '1px 2px',
    fontFamily: fontValue,
    fontSize: `${scaledFontSize}px`,
    color: content.color || '#1f2937',
    fontWeight: content.bold ? 'bold' : 'normal',
    fontStyle: content.italic ? 'italic' : 'normal',
    textDecoration: content.underline ? 'underline' : 'none',
    lineHeight: 1.2,
    textAlign: content.textAlign || 'left',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };
  
  // Contenu : htmlContent ou génération manuelle des lignes
  let textContent: string;
  if (content.htmlContent) {
    // Wrapper pour l'indentation si nécessaire
    const contentStyle = indentPx > 0 ? `padding-left: ${indentPx}px;` : '';
    textContent = contentStyle ? `<div style="${contentStyle}">${content.htmlContent}</div>` : content.htmlContent;
  } else {
    const text = content.text || '';
    const lines = text.split('\n');
    textContent = lines.map((line, i) => {
      let prefix = '';
      if (content.listType === 'bullet') prefix = '• ';
      if (content.listType === 'numbered') prefix = `${i + 1}. `;
      const lineIndent = indentPx > 0 ? `padding-left: ${indentPx}px;` : '';
      return `<div style="${lineIndent}">${prefix}${escapeHTML(line) || '&nbsp;'}</div>`;
    }).join('');
  }
  
  return `<div style="${styleToString(outerStyle)}"><div style="${styleToString(innerStyle)}">${textContent}</div></div>`;
}

/**
 * Rend un élément image en HTML (avec conversion base64)
 */
async function renderImageElementToHTML(element: EditableElement): Promise<string> {
  const content = element.content as ImageContent;
  const resolvedUrl = resolveImageUrl(content);
  
  if (!resolvedUrl) return '';
  
  // Convertir l'image en base64 pour l'impression
  const imageSource = await imageToBase64(resolvedUrl);
  
  const style = getSharedElementStyle({ element });
  const opacity = (content.opacity ?? 100) / 100;
  const rotation = content.rotation || 0;
  
  const imgStyle: React.CSSProperties = {
    ...style,
    zIndex: normalizeZIndex(element), // Normalisation z-index WYSIWYG
    opacity,
  };
  
  const innerImgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: content.objectFit || 'contain',
    transform: rotation ? `rotate(${rotation}deg)` : undefined,
  };
  
  return `<div style="${styleToString(imgStyle)}">
    <img src="${imageSource}" alt="${content.alt || ''}" style="${styleToString(innerImgStyle)}" />
  </div>`;
}

/**
 * Rend un élément forme en HTML
 */
function renderShapeElementToHTML(element: EditableElement): string {
  const content = element.content as ShapeContent;
  const positionStyle = getSharedElementStyle({ element });
  
  // Ligne spéciale (horizontale ou verticale)
  if (content.shapeType === 'line' || content.shapeType === 'line-vertical') {
    const isVertical = content.shapeType === 'line-vertical';
    const lineStyle = content.lineStyle || 'solid';
    const lineWidth = content.border?.width || 2;
    const lineColor = content.border?.color || '#1f2937';
    
    const wrapperStyle: React.CSSProperties = {
      ...positionStyle,
      zIndex: normalizeZIndex(element), // Normalisation z-index WYSIWYG
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
    
    const innerWrapperStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transform: content.rotation ? `rotate(${content.rotation}deg)` : undefined,
    };
    
    const lineElementStyle: React.CSSProperties = {
      width: isVertical ? `${lineWidth}px` : '100%',
      height: isVertical ? '100%' : `${lineWidth}px`,
      backgroundColor: lineStyle === 'solid' ? lineColor : 'transparent',
      borderTop: !isVertical && lineStyle !== 'solid' ? `${lineWidth}px ${lineStyle} ${lineColor}` : undefined,
      borderLeft: isVertical && lineStyle !== 'solid' ? `${lineWidth}px ${lineStyle} ${lineColor}` : undefined,
    };
    
    return `<div style="${styleToString(wrapperStyle)}">
      <div style="${styleToString(innerWrapperStyle)}">
        <div style="${styleToString(lineElementStyle)}"></div>
      </div>
    </div>`;
  }
  
  // Formes standard
  const shapeStyle: React.CSSProperties = {
    ...positionStyle,
    zIndex: normalizeZIndex(element),
    backgroundColor: content.backgroundColor !== 'transparent' ? content.backgroundColor : undefined,
    opacity: (content.backgroundOpacity ?? 100) / 100,
    borderRadius: content.shapeType === 'circle' || content.shapeType === 'ellipse'
      ? '50%'
      : `${content.cornerRadius || 0}px`,
    transform: content.rotation ? `rotate(${content.rotation}deg)` : undefined,
    border: content.border?.enabled ? `${content.border.width}px solid ${content.border.color}` : undefined,
  };
  
  // Contenu interne de la forme
  let innerContent = '';
  if (content.innerContent) {
    const innerStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: content.innerContent.alignment.horizontal === 'left' ? 'flex-start'
        : content.innerContent.alignment.horizontal === 'right' ? 'flex-end' : 'center',
      alignItems: content.innerContent.alignment.vertical === 'top' ? 'flex-start'
        : content.innerContent.alignment.vertical === 'bottom' ? 'flex-end' : 'center',
      padding: `${content.innerContent.padding || 0}px`,
    };
    
    let textHtml = '';
    if (content.innerContent.text) {
      const t = content.innerContent.text;
      const textStyle: React.CSSProperties = {
        fontSize: `${Math.max(t.fontSize * PREVIEW_FONT_SCALE, 6)}px`,
        color: t.color,
        fontWeight: t.bold ? 'bold' : 'normal',
        fontStyle: t.italic ? 'italic' : 'normal',
      };
      textHtml = `<span style="${styleToString(textStyle)}">${escapeHTML(t.content)}</span>`;
    }
    
    // Rendu SVG inline des icônes internes
    let iconHtml = '';
    if (content.innerContent.icon) {
      const icon = content.innerContent.icon;
      const scaledIconSize = Math.max(icon.size * PREVIEW_ICON_SCALE, 8);
      iconHtml = renderIconSVG(icon.name, scaledIconSize, icon.color);
    }
    
    innerContent = `<div style="${styleToString(innerStyle)}">${iconHtml}${textHtml}</div>`;
  }
  
  return `<div style="${styleToString(shapeStyle)}">${innerContent}</div>`;
}

/**
 * Rend un élément icône en HTML avec SVG inline
 */
function renderIconElementToHTML(element: EditableElement): string {
  const content = element.content as IconContent;
  const style = getSharedElementStyle({ element });
  const scaledSize = Math.max(content.size * PREVIEW_ICON_SCALE, 8);
  
  const iconStyle: React.CSSProperties = {
    ...style,
    zIndex: normalizeZIndex(element),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: content.rotation ? `rotate(${content.rotation}deg)` : undefined,
  };
  
  // Rendu SVG inline de l'icône Lucide
  const svgHtml = renderIconSVG(content.iconName, scaledSize, content.color, content.strokeWidth);
  
  return `<div style="${styleToString(iconStyle)}">${svgHtml}</div>`;
}

/**
 * Rend un élément du template en HTML
 */
export async function renderElementToHTML(element: EditableElement): Promise<string> {
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

/**
 * Trie les éléments par z-index
 */
function sortByZIndex(elements: EditableElement[]): EditableElement[] {
  return [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
}

/**
 * Génère le HTML d'une page du template
 * Utilise un wrapper .page-sheet (A4) + .page (canvas 650x919) pour un scaling uniforme
 */
export async function renderPageToHTML(
  page: TemplatePageContent,
  dynamicContentHTML?: string
): Promise<string> {
  const sortedElements = sortByZIndex(page.elements.filter(el => !el.isDynamic));
  
  // Convertir tous les éléments en parallèle
  const elementsHTML = await Promise.all(
    sortedElements.map(el => renderElementToHTML(el))
  );
  
  // Structure : .page-sheet (A4 en print) > .page (canvas source, scalé uniformément)
  return `
    <div class="page-sheet">
      <div class="page">
        ${elementsHTML.join('\n')}
        ${dynamicContentHTML || ''}
      </div>
    </div>
  `;
}

/**
 * Dimensions du canvas PDF alignées sur l'Aperçu (580px de large, ratio A4)
 * Cela garantit une parité WYSIWYG parfaite avec RentalProposalPreview
 */
const PDF_BASE_WIDTH = CANVAS_DISPLAY_MAX_WIDTH; // 580px - identique à l'Aperçu
// IMPORTANT: ne pas arrondir -> évite des écarts de pagination (Chrome) et des débordements inter-pages
const PDF_BASE_HEIGHT = PDF_BASE_WIDTH * (297 / 210); // ≈ 820.095... - ratio A4

/**
 * Génère le document PDF complet en HTML
 */
export async function generatePDFDocumentHTML(
  version: TemplateVersion,
  dynamicContentByPage: Record<number, string>
): Promise<string> {
  // Générer le HTML de toutes les pages en parallèle
  const pagesHTML = await Promise.all(
    version.pages.map(async (page) => {
      const dynamicContent = dynamicContentByPage[page.pageNumber] || '';
      return renderPageToHTML(page, dynamicContent);
    })
  );
  
  // Calcul du facteur de scale pour A4 (210mm à 96dpi = ~793.7px)
  // Basé sur la largeur du canvas PDF (580px) pour correspondre à l'Aperçu
  const A4_WIDTH_CSS_PX = (210 / 25.4) * 96; // ≈ 793.7008
  const A4_HEIGHT_CSS_PX = (297 / 25.4) * 96; // ≈ 1122.5197
  // Sécurise la pagination : garantit que ça rentre dans A4 en largeur ET hauteur
  const PRINT_SCALE = Math.min(
    A4_WIDTH_CSS_PX / PDF_BASE_WIDTH,
    A4_HEIGHT_CSS_PX / PDF_BASE_HEIGHT
  );
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Proposition de Location</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 0; 
          }
          html, body {
            margin: 0;
            padding: 0;
          }
          /* Le wrapper feuille A4 gère les sauts de page */
          .page-sheet {
            display: block;
            page-break-after: always;
            page-break-inside: avoid;
            /* Modern equivalents (Chrome) */
            break-after: page;
            break-inside: avoid;
          }
          .page-sheet:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          /* Le canvas interne est scalé uniformément pour remplir la feuille A4 */
          .page {
            transform: scale(${PRINT_SCALE.toFixed(6)});
            transform-origin: top left;
          }
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        /* Preflight STRICT pour Rich Text - neutralise complètement les styles navigateur par défaut */
        /* Aligné sur Tailwind Preflight + renforcé avec !important pour garantir la parité WYSIWYG */
        ul, ol {
          list-style: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        li {
          list-style: none !important;
          margin: 0 !important;
          padding: 0 !important;
          display: block;
        }
        /* Suppression du ::marker pour Chrome/Safari */
        li::marker {
          content: "" !important;
          display: none !important;
        }
        h1, h2, h3, h4, h5, h6 {
          font-size: inherit !important;
          font-weight: inherit !important;
          margin: 0 !important;
        }
        p {
          margin: 0 !important;
        }
        strong, b {
          font-weight: bolder;
        }
        em, i {
          font-style: italic;
        }
        
        body {
          font-family: 'DM Sans', 'Outfit', sans-serif;
          line-height: 1.5;
          color: #1f2937;
          background: white;
        }
        
        /* Wrapper feuille A4 : dimensionné en mm pour l'impression */
        .page-sheet {
          width: 210mm;
          height: 297mm;
          overflow: hidden;
          background: white;
          position: relative;
        }
        
        /* Canvas interne : dimensions identiques à l'Aperçu (580x820) */
        /* En print, il sera scalé uniformément via transform: scale() pour remplir A4 */
        .page {
          width: ${PDF_BASE_WIDTH}px;
          height: ${PDF_BASE_HEIGHT}px;
          position: relative;
          overflow: hidden;
          background: white;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* En mode écran (prévisualisation), on garde les mêmes dimensions */
        @media screen {
          .page-sheet {
            width: ${PDF_BASE_WIDTH}px;
            height: ${PDF_BASE_HEIGHT}px;
          }
        }
        
        img {
          max-width: 100%;
          height: auto;
        }
        
        /* Styles pour les données dynamiques */
        .dynamic-content {
          position: absolute;
          z-index: 40;
        }
        
        .product-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
        }
        
        .product-table th {
          background: #f3f4f6;
          padding: 8px;
          text-align: left;
          font-weight: 600;
        }
        
        .product-table td {
          padding: 6px 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .summary-box {
          background: #eff6ff;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #bfdbfe;
        }
        
        .total-box {
          background: #f0fdf4;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #bbf7d0;
          text-align: center;
        }
        
        .option-card {
          padding: 10px;
          margin-bottom: 6px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: #f9fafb;
        }
        
        .signature-box {
          border: 2px dashed #d1d5db;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          border-radius: 8px;
          margin-top: 8px;
        }
      </style>
    </head>
    <body>
      ${pagesHTML.join('\n')}
    </body>
    </html>
  `;
}

/**
 * Vide le cache d'images (utile entre les exports)
 */
export function clearImageCache(): void {
  imageCache.clear();
}

/**
 * Générateur HTML pour l'export PDF
 * Convertit les éléments du template en HTML pour l'impression
 */

import { CANVAS_SCALE, PREVIEW_FONT_SCALE, PREVIEW_ICON_SCALE, LIST_INDENT_PX } from './canvas-constants';
import { ALLOWED_FONTS } from './template-styles';
import { getSharedElementStyle, resolveImageUrl } from './template-render-utils';
import type { 
  EditableElement, 
  TextContent, 
  ImageContent, 
  ShapeContent, 
  IconContent,
  TemplateVersion,
  TemplatePageContent
} from '@/types/template-editor';

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
 */
function renderTextElementToHTML(element: EditableElement): string {
  const content = element.content as TextContent;
  const style = getSharedElementStyle({ element });
  
  const fontDef = ALLOWED_FONTS.find(f => f.name === content.fontFamily);
  const fontValue = fontDef?.value || 'sans-serif';
  const scaledFontSize = Math.max(content.fontSize * PREVIEW_FONT_SCALE, 6);
  const indentPx = (content.indentLevel || 0) * LIST_INDENT_PX;
  
  const textStyle: React.CSSProperties = {
    ...style,
    fontFamily: fontValue,
    fontSize: `${scaledFontSize}px`,
    color: content.color || '#1f2937',
    fontWeight: content.bold ? 'bold' : 'normal',
    fontStyle: content.italic ? 'italic' : 'normal',
    textDecoration: content.underline ? 'underline' : 'none',
    lineHeight: 1.2,
    textAlign: content.textAlign || 'left',
    paddingLeft: indentPx > 0 ? `${indentPx}px` : undefined,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };
  
  // Utiliser le contenu HTML enrichi s'il existe, sinon le texte brut
  let textContent: string;
  if (content.htmlContent) {
    textContent = content.htmlContent;
  } else {
    const text = content.text || '';
    const lines = text.split('\n');
    textContent = lines.map((line, i) => {
      let prefix = '';
      if (content.listType === 'bullet') prefix = '• ';
      if (content.listType === 'numbered') prefix = `${i + 1}. `;
      return `<div>${prefix}${escapeHTML(line) || '&nbsp;'}</div>`;
    }).join('');
  }
  
  return `<div style="${styleToString(textStyle)}">${textContent}</div>`;
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
    
    // Note: Les icônes Lucide ne peuvent pas être rendues en HTML pur de manière simple
    // On les omet pour le PDF
    
    innerContent = `<div style="${styleToString(innerStyle)}">${textHtml}</div>`;
  }
  
  return `<div style="${styleToString(shapeStyle)}">${innerContent}</div>`;
}

/**
 * Rend un élément icône en HTML (placeholder - les icônes SVG sont complexes)
 */
function renderIconElementToHTML(element: EditableElement): string {
  // Les icônes Lucide nécessiteraient d'inclure le SVG complet
  // Pour simplifier, on affiche un placeholder ou on omet
  const content = element.content as IconContent;
  const style = getSharedElementStyle({ element });
  const scaledSize = Math.max(content.size * PREVIEW_ICON_SCALE, 8);
  
  // Placeholder simple avec le nom de l'icône
  const iconStyle: React.CSSProperties = {
    ...style,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${scaledSize * 0.5}px`,
    color: content.color,
    transform: content.rotation ? `rotate(${content.rotation}deg)` : undefined,
  };
  
  // Note: On pourrait inclure les SVG des icônes Lucide ici si nécessaire
  return `<div style="${styleToString(iconStyle)}"></div>`;
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
  
  return `
    <div class="page" style="position: relative; width: 210mm; height: 297mm; overflow: hidden; background: white; page-break-after: always;">
      ${elementsHTML.join('\n')}
      ${dynamicContentHTML || ''}
    </div>
  `;
}

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
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Proposition de Location</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap');
        
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 0; 
          }
          html, body {
            margin: 0;
            padding: 0;
            width: 210mm;
            height: 297mm;
          }
          .page {
            page-break-after: always;
            page-break-inside: avoid;
          }
          .page:last-child {
            page-break-after: auto;
          }
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'DM Sans', 'Outfit', sans-serif;
          line-height: 1.5;
          color: #1f2937;
          background: white;
        }
        
        .page {
          width: 210mm;
          height: 297mm;
          position: relative;
          overflow: hidden;
          background: white;
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

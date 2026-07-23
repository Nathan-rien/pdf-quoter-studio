/**
 * Converts an HTML string containing `.page-sheet` elements (A4 sized, 210x297mm each)
 * into a multi-page PDF Blob using html2canvas + jsPDF.
 *
 * Each `.page-sheet` maps to exactly one PDF page — no cross-page splits, no mid-table cuts.
 */
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { fitPageContentBlocks } from '@/lib/service-proposal-html-generator';


const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

async function waitForAssets(root: HTMLElement, timeoutMs = 6000): Promise<void> {
  try {
    const fontsReady = (document as any).fonts?.ready;
    if (fontsReady) {
      await Promise.race([fontsReady, new Promise((r) => setTimeout(r, timeoutMs))]);
    }
  } catch {
    /* ignore */
  }
  const images = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          const t = setTimeout(resolve, timeoutMs);
          img.onload = () => {
            clearTimeout(t);
            resolve();
          };
          img.onerror = () => {
            clearTimeout(t);
            resolve();
          };
        }),
    ),
  );
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}

export async function htmlToPdfBlob(htmlContent: string): Promise<Blob> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const headHtml = doc.head.innerHTML;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-10000px';
  container.style.left = '0';
  container.style.width = `${A4_WIDTH_MM}mm`;
  container.style.background = '#ffffff';
  container.style.zIndex = '-1';

  const styleWrap = document.createElement('div');
  styleWrap.innerHTML = headHtml;
  styleWrap.querySelectorAll('title, meta').forEach((n) => n.remove());
  container.appendChild(styleWrap);

  const pagesWrap = document.createElement('div');
  pagesWrap.innerHTML = doc.body.innerHTML;
  container.appendChild(pagesWrap);
  document.body.appendChild(container);

  try {
    await waitForAssets(container);

    const sheets = Array.from(pagesWrap.querySelectorAll<HTMLElement>('.page-sheet'));
    if (sheets.length === 0) {
      throw new Error('No .page-sheet elements found in generator output');
    }

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });

    for (let i = 0; i < sheets.length; i += 1) {
      const sheet = sheets[i];
      // eslint-disable-next-line no-await-in-loop
      await waitForAssets(sheet);
      // eslint-disable-next-line no-await-in-loop
      const canvas = await html2canvas(sheet, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: sheet.scrollWidth,
      });
      const img = canvas.toDataURL('image/jpeg', 0.95);
      if (i > 0) pdf.addPage([A4_WIDTH_MM, A4_HEIGHT_MM], 'p');
      pdf.addImage(img, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, 'FAST');
    }

    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}

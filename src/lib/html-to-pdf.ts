/**
 * Converts an HTML string containing `.page-sheet` elements (A4 sized, 210x297mm each)
 * into a multi-page PDF Blob using html2pdf.js / html2canvas / jsPDF.
 *
 * Each `.page-sheet` maps to exactly one PDF page — no cross-page splits.
 */
// @ts-expect-error - html2pdf.js has no types
import html2pdf from 'html2pdf.js';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

async function waitForAssets(root: HTMLElement, timeoutMs = 6000): Promise<void> {
  try {
    const fontsReady = (document as any).fonts?.ready;
    if (fontsReady) {
      await Promise.race([
        fontsReady,
        new Promise((resolve) => setTimeout(resolve, timeoutMs)),
      ]);
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

/**
 * Renders the HTML string offscreen, converts every `.page-sheet` to a canvas,
 * and stitches them into a single multi-page PDF. Returns a Blob (application/pdf).
 */
export async function htmlToPdfBlob(htmlContent: string, fileName: string): Promise<Blob> {
  // Extract only the <body> content of the generator output so we can drop it into a container.
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Preserve the fonts + styles that the generator declares in <head>
  const headStyle = doc.head.innerHTML;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-10000px';
  container.style.left = '0';
  container.style.width = `${A4_WIDTH_MM}mm`;
  container.style.background = 'white';
  container.style.zIndex = '-1';
  // Inject styles into a shadow-free inline block; head <link>/<style> we clone into container
  const styleWrap = document.createElement('div');
  styleWrap.innerHTML = headStyle;
  // Only keep <style> / <link> nodes
  styleWrap.querySelectorAll('title, meta').forEach((n) => n.remove());
  container.appendChild(styleWrap);

  const pagesWrap = document.createElement('div');
  pagesWrap.innerHTML = doc.body.innerHTML;
  container.appendChild(pagesWrap);
  document.body.appendChild(container);

  try {
    await waitForAssets(container);

    const opt = {
      margin: 0,
      filename: fileName,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: container.scrollWidth,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true,
      },
      // Rely on our own .page-sheet breaks — html2pdf will render each sheet independently.
      pagebreak: { mode: ['css', 'legacy'], avoid: '.page-sheet' },
    };

    // Build one worker per sheet to guarantee 1 template page = 1 PDF page, no mid-row cuts.
    const sheets = Array.from(pagesWrap.querySelectorAll<HTMLElement>('.page-sheet'));
    if (sheets.length === 0) {
      // Fallback: convert the whole container as-is
      const blob: Blob = await html2pdf().set(opt).from(pagesWrap).outputPdf('blob');
      return blob;
    }

    // Generate each sheet separately then merge into a single PDF via jsPDF instance reuse.
    // html2pdf exposes a chainable worker; we use `toPdf().get('pdf')` to grab the underlying jsPDF.
    let pdf: any = null;
    for (let i = 0; i < sheets.length; i += 1) {
      const sheet = sheets[i];
      // Ensure inner assets are ready
      await waitForAssets(sheet);
      // eslint-disable-next-line no-await-in-loop
      const worker = html2pdf().set({ ...opt, pagebreak: { mode: [] } }).from(sheet).toPdf();
      // eslint-disable-next-line no-await-in-loop
      const sheetPdf = await worker.get('pdf');
      if (!pdf) {
        pdf = sheetPdf;
      } else {
        // Copy pages from sheetPdf into the accumulator pdf
        const pageCount = sheetPdf.internal.getNumberOfPages();
        for (let p = 1; p <= pageCount; p += 1) {
          pdf.addPage([A4_WIDTH_MM, A4_HEIGHT_MM], 'p');
          const pageData = sheetPdf.internal.pages[p];
          // jsPDF doesn't expose a clean copy API — take the image from html2canvas result instead.
          // Fallback: rebuild the sheet as image and add.
          const canvas = await html2canvasSnapshot(sheet);
          const img = canvas.toDataURL('image/jpeg', 0.95);
          pdf.setPage(pdf.internal.getNumberOfPages());
          pdf.addImage(img, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, 'FAST');
          break;
        }
      }
    }
    const blob = pdf.output('blob');
    return blob;
  } finally {
    document.body.removeChild(container);
  }
}

// html2canvas snapshot helper (avoids re-importing separately: html2pdf bundles html2canvas)
async function html2canvasSnapshot(el: HTMLElement): Promise<HTMLCanvasElement> {
  // html2pdf bundles html2canvas at (html2pdf as any).html2canvas after first use — safer to import.
  // We lazy-load via dynamic import to keep the bundle small.
  const h2c = (await import('html2canvas')).default;
  return h2c(el, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: el.scrollWidth,
  });
}

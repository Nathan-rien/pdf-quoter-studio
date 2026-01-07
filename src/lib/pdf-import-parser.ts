import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PDFProductLine {
  reference: string | null;
  designation: string;
  prixUnitaire: number | null;
  quantite: number;
  totalHT: number;
}

export interface PDFParseResult {
  source: 'cybertek' | 'grosbill' | 'unknown';
  client: {
    nom: string | null;
    adresse: string | null;
    codePostal: string | null;
    ville: string | null;
    telephone: string | null;
    email: string | null;
  };
  devis: {
    reference: string | null;
    date: string | null;
    validite: string | null;
    numeroClient: string | null;
  };
  commercial: {
    nom: string | null;
    email: string | null;
  };
  lignes: PDFProductLine[];
  location: {
    duree: number | null;
    loyerMensuel: number | null;
    montantTotal: number | null;
  };
  totaux: {
    totalHT: number | null;
    tva: number | null;
    totalTTC: number | null;
  };
}

function detectSource(text: string): 'cybertek' | 'grosbill' | 'unknown' {
  if (text.includes('CYBERTEK PRO') || text.includes('Groupe Cybertek')) {
    return 'cybertek';
  }
  if (text.includes('GrosBill Pro') || text.includes('GROSBILL PRO')) {
    return 'grosbill';
  }
  return 'unknown';
}

function parseNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/\s/g, '').replace(',', '.').replace('€', '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : Math.round(num * 100) / 100;
}

function parseCybertekPDF(text: string): PDFParseResult {
  const result: PDFParseResult = {
    source: 'cybertek',
    client: { nom: null, adresse: null, codePostal: null, ville: null, telephone: null, email: null },
    devis: { reference: null, date: null, validite: null, numeroClient: null },
    commercial: { nom: null, email: null },
    lignes: [],
    location: { duree: null, loyerMensuel: null, montantTotal: null },
    totaux: { totalHT: null, tva: null, totalTTC: null },
  };

  // Extract client number
  const clientMatch = text.match(/N°\s*client\s*:\s*(\d+)/i);
  if (clientMatch) result.devis.numeroClient = clientMatch[1];

  // Extract date
  const dateMatch = text.match(/Devis du\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (dateMatch) result.devis.date = dateMatch[1];

  // Extract validity
  const validiteMatch = text.match(/Valable jusqu'au\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (validiteMatch) result.devis.validite = validiteMatch[1];

  // Extract commercial
  const commercialMatch = text.match(/Votre\s+contact\s*:\s*([^\n]+)/i);
  if (commercialMatch) result.commercial.nom = commercialMatch[1].trim();

  const commercialEmailMatch = text.match(/([a-zA-Z0-9._%+-]+@(?:cybertek|grosbill)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (commercialEmailMatch) result.commercial.email = commercialEmailMatch[1];

  // Extract client info from delivery address
  const livraisonMatch = text.match(/Adresse de livraison\s*:\s*([^\n]+(?:\n[^\n]+)*?)(?=Adresse de facturation|$)/i);
  if (livraisonMatch) {
    const lines = livraisonMatch[1].split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length >= 1) result.client.nom = lines[0];
    if (lines.length >= 2) result.client.adresse = lines[1];
    // Try to extract postal code and city
    const cpVilleMatch = lines.find(l => /^\d{5}/.test(l));
    if (cpVilleMatch) {
      const cpMatch = cpVilleMatch.match(/^(\d{5})\s+(.+)/);
      if (cpMatch) {
        result.client.codePostal = cpMatch[1];
        result.client.ville = cpMatch[2];
      }
    }
  }

  // Extract product lines - look for table pattern
  const lignesRegex = /([A-Z0-9-]+)\s+(.+?)\s+(\d+)\s+([\d\s,]+€)/g;
  let match;
  while ((match = lignesRegex.exec(text)) !== null) {
    const totalHT = parseNumber(match[4]);
    if (totalHT !== null) {
      result.lignes.push({
        reference: match[1],
        designation: match[2].trim(),
        prixUnitaire: null,
        quantite: parseInt(match[3]) || 1,
        totalHT,
      });
    }
  }

  // Extract location offer
  const loyerMatch = text.match(/Loyer\s+mensuel\s*[:\s]*([\d\s,]+)\s*€/i);
  if (loyerMatch) result.location.loyerMensuel = parseNumber(loyerMatch[1]);

  const dureeMatch = text.match(/(\d+)\s*mois/i);
  if (dureeMatch) result.location.duree = parseInt(dureeMatch[1]);

  // Extract totals
  const totalHTMatch = text.match(/Total\s+HT\s*[:\s]*([\d\s,]+)\s*€/i);
  if (totalHTMatch) result.totaux.totalHT = parseNumber(totalHTMatch[1]);

  const tvaMatch = text.match(/TVA\s*(?:20%?)?\s*[:\s]*([\d\s,]+)\s*€/i);
  if (tvaMatch) result.totaux.tva = parseNumber(tvaMatch[1]);

  const totalTTCMatch = text.match(/Total\s+TTC\s*[:\s]*([\d\s,]+)\s*€/i);
  if (totalTTCMatch) result.totaux.totalTTC = parseNumber(totalTTCMatch[1]);

  return result;
}

function parseGrosbillPDF(text: string): PDFParseResult {
  const result: PDFParseResult = {
    source: 'grosbill',
    client: { nom: null, adresse: null, codePostal: null, ville: null, telephone: null, email: null },
    devis: { reference: null, date: null, validite: null, numeroClient: null },
    commercial: { nom: null, email: null },
    lignes: [],
    location: { duree: null, loyerMensuel: null, montantTotal: null },
    totaux: { totalHT: null, tva: null, totalTTC: null },
  };

  // Extract devis number
  const devisMatch = text.match(/DEVIS\s+N°\s*(\d+)/i);
  if (devisMatch) result.devis.reference = devisMatch[1];

  // Extract client number
  const clientMatch = text.match(/N°\s*CLIENT\s*:\s*(\d+)/i);
  if (clientMatch) result.devis.numeroClient = clientMatch[1];

  // Extract date
  const dateMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
  if (dateMatch) result.devis.date = dateMatch[1];

  // Extract client email
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch) result.client.email = emailMatch[1];

  // Extract phone
  const phoneMatch = text.match(/(\d{2}[\s.]\d{2}[\s.]\d{2}[\s.]\d{2}[\s.]\d{2})/);
  if (phoneMatch) result.client.telephone = phoneMatch[1];

  // Extract delivery client
  const livraisonMatch = text.match(/CLIENT LIVRAISON\s*:\s*([^\n]+)/i);
  if (livraisonMatch) result.client.nom = livraisonMatch[1].trim();

  // Extract delivery address
  const adresseMatch = text.match(/ADRESSE LIVRAISON\s*:\s*([^\n]+)/i);
  if (adresseMatch) result.client.adresse = adresseMatch[1].trim();

  // Extract product lines from table
  const lines = text.split('\n');
  for (const line of lines) {
    // Pattern: CODE | DESIGNATION | PRIX UNI. | QTÉ. | TOTAL HT
    const productMatch = line.match(/^([A-Z0-9-]+)\s+(.+?)\s+([\d\s,]+€)\s+(\d+)\s+([\d\s,]+€)$/);
    if (productMatch) {
      result.lignes.push({
        reference: productMatch[1],
        designation: productMatch[2].trim(),
        prixUnitaire: parseNumber(productMatch[3]),
        quantite: parseInt(productMatch[4]) || 1,
        totalHT: parseNumber(productMatch[5]) || 0,
      });
    }
  }

  // Extract totals
  const totalHTMatch = text.match(/TOTAL\s+HT\s*[:\s]*([\d\s,]+)\s*€/i);
  if (totalHTMatch) result.totaux.totalHT = parseNumber(totalHTMatch[1]);

  const tvaMatch = text.match(/TVA\s*(?:\d+%?)?\s*[:\s]*([\d\s,]+)\s*€/i);
  if (tvaMatch) result.totaux.tva = parseNumber(tvaMatch[1]);

  const totalTTCMatch = text.match(/TOTAL\s+TTC\s*[:\s]*([\d\s,]+)\s*€/i);
  if (totalTTCMatch) result.totaux.totalTTC = parseNumber(totalTTCMatch[1]);

  return result;
}

export async function parsePDF(file: File): Promise<PDFParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  const source = detectSource(fullText);
  
  switch (source) {
    case 'cybertek':
      return parseCybertekPDF(fullText);
    case 'grosbill':
      return parseGrosbillPDF(fullText);
    default:
      // Return empty result for unknown source
      return {
        source: 'unknown',
        client: { nom: null, adresse: null, codePostal: null, ville: null, telephone: null, email: null },
        devis: { reference: null, date: null, validite: null, numeroClient: null },
        commercial: { nom: null, email: null },
        lignes: [],
        location: { duree: null, loyerMensuel: null, montantTotal: null },
        totaux: { totalHT: null, tva: null, totalTTC: null },
      };
  }
}

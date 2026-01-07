// PDF text extraction using pdfjs-dist legacy build (avoids top-level await)

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
  rawText?: string;
}

function detectSourceFromFilename(filename: string): 'cybertek' | 'grosbill' | 'unknown' {
  const lowerName = filename.toLowerCase();
  if (lowerName.includes('cybertek') || lowerName.includes('kedge')) {
    return 'cybertek';
  }
  if (lowerName.includes('grosbill') || /devis_\d+_\d+/i.test(lowerName)) {
    return 'grosbill';
  }
  return 'unknown';
}

function detectSourceFromText(text: string): 'cybertek' | 'grosbill' | 'unknown' {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('cybertek') || lowerText.includes('groupe cybertek')) {
    return 'cybertek';
  }
  if (lowerText.includes('grosbill')) {
    return 'grosbill';
  }
  return 'unknown';
}

function parseNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/\s/g, '').replace(',', '.').replace('€', '').replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : Math.round(num * 100) / 100;
}

function parseCybertekText(text: string): Partial<PDFParseResult> {
  const result: Partial<PDFParseResult> = {
    source: 'cybertek',
    lignes: [],
    client: { nom: null, adresse: null, codePostal: null, ville: null, telephone: null, email: null },
    devis: { reference: null, date: null, validite: null, numeroClient: null },
    commercial: { nom: null, email: null },
    location: { duree: null, loyerMensuel: null, montantTotal: null },
    totaux: { totalHT: null, tva: null, totalTTC: null },
  };

  // Extract client number
  const clientMatch = text.match(/N°\s*client\s*[:\s]*(\d+)/i);
  if (clientMatch) {
    result.devis!.numeroClient = clientMatch[1];
  }

  // Extract date
  const dateMatch = text.match(/Devis\s+du\s+(\d{2}\/\d{2}\/\d{4})/i);
  if (dateMatch) {
    result.devis!.date = dateMatch[1];
  }

  // Extract validity date
  const validiteMatch = text.match(/Valable\s+jusqu['']au\s+(\d{2}\/\d{2}\/\d{4})/i);
  if (validiteMatch) {
    result.devis!.validite = validiteMatch[1];
  }

  // Extract client name (GROUPE KEDGE BUSINESS SCHOOL pattern)
  const clientNameMatch = text.match(/GROUPE\s+KEDGE\s+BUSINESS\s+SCHOOL/i) ||
    text.match(/Facturation\s*[:\s]*([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s]+(?:BUSINESS|SCHOOL|SARL|SAS|SA|EURL)?[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s]*)/i);
  if (clientNameMatch) {
    result.client!.nom = clientNameMatch[0].includes('KEDGE') ? 'GROUPE KEDGE BUSINESS SCHOOL' : clientNameMatch[1]?.trim() || null;
  }

  // Extract address (look for patterns like "DOMAINE DE RABA 680 COURS DE LA LIBERATION")
  const addressMatch = text.match(/(?:DOMAINE\s+DE\s+RABA\s+)?(\d+\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s]+(?:RUE|AVENUE|COURS|BOULEVARD|PLACE|CHEMIN)[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s]+)/i);
  if (addressMatch) {
    result.client!.adresse = addressMatch[0].trim();
  }

  // Extract postal code and city
  const cpVilleMatch = text.match(/(\d{5})\s+([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s-]+?)(?=\s+(?:N°|Devis|Tél|Email|Contact|France))/i);
  if (cpVilleMatch) {
    result.client!.codePostal = cpVilleMatch[1];
    result.client!.ville = cpVilleMatch[2].trim();
  }

  // Extract commercial name
  const commercialMatch = text.match(/Contact\s+commercial\s+direct\s*[:\s]*([A-Za-zÀ-ÿ\s]+?)(?=\s*(?:Tél|Email|$))/i);
  if (commercialMatch) {
    result.commercial!.nom = commercialMatch[1].trim();
  }

  // Extract commercial email
  const emailCommMatch = text.match(/(?:Email|E-mail)\s*[:\s]*([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
  if (emailCommMatch) {
    result.commercial!.email = emailCommMatch[1];
  }

  // Extract location duration
  const dureeMatch = text.match(/Durée\s*[:\s]*(\d+)\s*Mois/i);
  if (dureeMatch) {
    result.location!.duree = parseInt(dureeMatch[1]);
  }

  // Extract monthly rent
  const loyerMatch = text.match(/Loyer\s+mensuel\s*[:\s]*([\d\s,]+)\s*€/i);
  if (loyerMatch) {
    result.location!.loyerMensuel = parseNumber(loyerMatch[1]);
  }

  // Parse product lines - look for REF patterns followed by designation and price
  const productLineRegex = /([A-Z]{2,3}-[A-Z0-9-]+)\s+(.+?)\s+(\d+)\s+([\d\s,]+)\s*€/gi;
  let match;
  while ((match = productLineRegex.exec(text)) !== null) {
    const totalHT = parseNumber(match[4]) || 0;
    const quantite = parseInt(match[3]) || 1;
    result.lignes!.push({
      reference: match[1],
      designation: match[2].trim(),
      quantite,
      totalHT,
      prixUnitaire: quantite > 0 ? Math.round((totalHT / quantite) * 100) / 100 : null,
    });
  }

  // Calculate totals from product lines
  if (result.lignes!.length > 0) {
    result.totaux!.totalHT = result.lignes!.reduce((sum, l) => sum + l.totalHT, 0);
  }

  return result;
}

function parseGrosbillText(text: string): Partial<PDFParseResult> {
  const result: Partial<PDFParseResult> = {
    source: 'grosbill',
    lignes: [],
    client: { nom: null, adresse: null, codePostal: null, ville: null, telephone: null, email: null },
    devis: { reference: null, date: null, validite: null, numeroClient: null },
    commercial: { nom: null, email: null },
    location: { duree: null, loyerMensuel: null, montantTotal: null },
    totaux: { totalHT: null, tva: null, totalTTC: null },
  };

  // Extract devis number
  const devisMatch = text.match(/DEVIS\s+N°\s*(\d+)/i);
  if (devisMatch) {
    result.devis!.reference = devisMatch[1];
  }

  // Extract date
  const dateMatch = text.match(/(\d{2}\/\d{2}\/\d{4})\s+\d{2}:\d{2}/);
  if (dateMatch) {
    result.devis!.date = dateMatch[1];
  }

  // Extract client number
  const clientNumMatch = text.match(/N°\s*CLIENT\s*[:\s]*(\d+)/i);
  if (clientNumMatch) {
    result.devis!.numeroClient = clientNumMatch[1];
  }

  // Extract client name (look for company name pattern after "Livraison")
  const livraisonMatch = text.match(/Livraison\s*[:\s]*([A-Za-zÀ-ÿ\s]+?)(?=\s+\d+\s+RUE|\s+[A-Z]+\s+[A-Z]+)/i);
  if (livraisonMatch) {
    result.client!.nom = livraisonMatch[1].trim();
  }

  // Extract address
  const adresseMatch = text.match(/(\d+\s+RUE\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s]+)/i);
  if (adresseMatch) {
    result.client!.adresse = adresseMatch[1].trim();
  }

  // Extract postal code and city
  const cpVilleMatch = text.match(/(\d{5})\s+([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ]+)/i);
  if (cpVilleMatch) {
    result.client!.codePostal = cpVilleMatch[1];
    result.client!.ville = cpVilleMatch[2];
  }

  // Extract phone
  const telMatch = text.match(/(?:Tél|Tel|Téléphone)\s*[:\s]*(\d{10})/i) || text.match(/(\d{10})/);
  if (telMatch) {
    result.client!.telephone = telMatch[1];
  }

  // Extract email
  const emailMatch = text.match(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
  if (emailMatch) {
    result.client!.email = emailMatch[1];
  }

  // Extract totals
  const totalHTMatch = text.match(/TOTAL\s+HT\s*[:\s]*([\d\s,]+)\s*€/i);
  if (totalHTMatch) {
    result.totaux!.totalHT = parseNumber(totalHTMatch[1]);
  }

  const tvaMatch = text.match(/(?:TVA|T\.V\.A\.?)\s*(?:\d+(?:[.,]\d+)?%?)?\s*[:\s]*([\d\s,]+)\s*€/i);
  if (tvaMatch) {
    result.totaux!.tva = parseNumber(tvaMatch[1]);
  }

  const totalTTCMatch = text.match(/TOTAL\s+TTC\s*[:\s]*([\d\s,]+)\s*€/i);
  if (totalTTCMatch) {
    result.totaux!.totalTTC = parseNumber(totalTTCMatch[1]);
  }

  // Parse product lines - GrosBill format: CODE DESIGNATION PRIX_UNI QTE TOTAL_HT
  const productLineRegex = /(\d{8,})\s+(.+?)\s+([\d\s,]+)\s*€\s+(\d+)\s+([\d\s,]+)\s*€/gi;
  let match;
  while ((match = productLineRegex.exec(text)) !== null) {
    // Skip eco-taxe lines
    if (match[2].toLowerCase().includes('eco-taxe') || match[2].toLowerCase().includes('ecotaxe')) {
      continue;
    }
    result.lignes!.push({
      reference: match[1],
      designation: match[2].trim(),
      prixUnitaire: parseNumber(match[3]),
      quantite: parseInt(match[4]) || 1,
      totalHT: parseNumber(match[5]) || 0,
    });
  }

  return result;
}

// Extract text using pdfjs-dist legacy build
async function extractTextWithPdfJs(file: File): Promise<string> {
  try {
    // Dynamic import of legacy build to avoid top-level await
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    // Set worker source
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => {
          if ('str' in item && typeof item.str === 'string') {
            return item.str;
          }
          return '';
        })
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('PDF.js extraction failed:', error);
    return '';
  }
}

export async function parsePDF(file: File): Promise<PDFParseResult> {
  // Detect source from filename first
  let source = detectSourceFromFilename(file.name);
  
  // Extract text using pdfjs-dist
  const rawText = await extractTextWithPdfJs(file);
  
  // If source unknown from filename, try from text content
  if (source === 'unknown' && rawText.length > 20) {
    source = detectSourceFromText(rawText);
  }
  
  // Create base result
  const baseResult: PDFParseResult = {
    source,
    client: { nom: null, adresse: null, codePostal: null, ville: null, telephone: null, email: null },
    devis: { reference: null, date: null, validite: null, numeroClient: null },
    commercial: { nom: null, email: null },
    lignes: [],
    location: { duree: null, loyerMensuel: null, montantTotal: null },
    totaux: { totalHT: null, tva: null, totalTTC: null },
    rawText,
  };
  
  // Log for debugging
  console.log('PDF Parser - Source detected:', source, 'Raw text length:', rawText.length);
  console.log('PDF Parser - Raw text sample:', rawText.substring(0, 1000));
  
  // Parse based on detected source
  if (rawText.length > 50) {
    let parsedData: Partial<PDFParseResult> = {};
    
    if (source === 'cybertek') {
      parsedData = parseCybertekText(rawText);
    } else if (source === 'grosbill') {
      parsedData = parseGrosbillText(rawText);
    }
    
    console.log('PDF Parser - Parsed data:', parsedData);
    
    return {
      ...baseResult,
      ...parsedData,
      source,
      rawText,
    };
  }
  
  console.log('PDF Parser - No text extracted, manual entry required');
  return baseResult;
}

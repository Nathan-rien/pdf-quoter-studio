// PDF text extraction - client-side implementation
// Note: Full PDF text extraction requires server-side processing
// This implementation provides a structure for PDF import with manual data entry fallback

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
  if (lowerName.includes('cybertek')) {
    return 'cybertek';
  }
  if (lowerName.includes('grosbill') || lowerName.match(/devis_\d+_\d+/)) {
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

function parseCybertekText(text: string): Partial<PDFParseResult> {
  const result: Partial<PDFParseResult> = {
    source: 'cybertek',
    lignes: [],
  };

  // Extract client number
  const clientMatch = text.match(/N°\s*client\s*:\s*(\d+)/i);
  if (clientMatch) {
    result.devis = { ...result.devis, numeroClient: clientMatch[1] } as PDFParseResult['devis'];
  }

  // Extract date
  const dateMatch = text.match(/Devis du\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (dateMatch) {
    result.devis = { ...result.devis, date: dateMatch[1] } as PDFParseResult['devis'];
  }

  // Extract location offer
  const loyerMatch = text.match(/Loyer\s+mensuel\s*[:\s]*([\d\s,]+)\s*€/i);
  const dureeMatch = text.match(/(\d+)\s*mois/i);
  if (loyerMatch || dureeMatch) {
    result.location = {
      duree: dureeMatch ? parseInt(dureeMatch[1]) : null,
      loyerMensuel: loyerMatch ? parseNumber(loyerMatch[1]) : null,
      montantTotal: null,
    };
  }

  // Extract totals
  const totalHTMatch = text.match(/Total\s+HT\s*[:\s]*([\d\s,]+)\s*€/i);
  const totalTTCMatch = text.match(/Total\s+TTC\s*[:\s]*([\d\s,]+)\s*€/i);
  if (totalHTMatch || totalTTCMatch) {
    result.totaux = {
      totalHT: totalHTMatch ? parseNumber(totalHTMatch[1]) : null,
      tva: null,
      totalTTC: totalTTCMatch ? parseNumber(totalTTCMatch[1]) : null,
    };
  }

  return result;
}

function parseGrosbillText(text: string): Partial<PDFParseResult> {
  const result: Partial<PDFParseResult> = {
    source: 'grosbill',
    lignes: [],
  };

  // Extract devis number
  const devisMatch = text.match(/DEVIS\s+N°\s*(\d+)/i);
  if (devisMatch) {
    result.devis = { ...result.devis, reference: devisMatch[1] } as PDFParseResult['devis'];
  }

  // Extract date
  const dateMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
  if (dateMatch) {
    result.devis = { ...result.devis, date: dateMatch[1] } as PDFParseResult['devis'];
  }

  // Extract totals
  const totalHTMatch = text.match(/TOTAL\s+HT\s*[:\s]*([\d\s,]+)\s*€/i);
  const totalTTCMatch = text.match(/TOTAL\s+TTC\s*[:\s]*([\d\s,]+)\s*€/i);
  if (totalHTMatch || totalTTCMatch) {
    result.totaux = {
      totalHT: totalHTMatch ? parseNumber(totalHTMatch[1]) : null,
      tva: null,
      totalTTC: totalTTCMatch ? parseNumber(totalTTCMatch[1]) : null,
    };
  }

  return result;
}

// Basic PDF text extraction using browser's built-in capabilities
async function extractBasicPDFInfo(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(content);
      
      // Extract readable text from PDF binary
      let text = '';
      let inText = false;
      let textBuffer = '';
      
      for (let i = 0; i < bytes.length; i++) {
        const char = String.fromCharCode(bytes[i]);
        
        // Look for text markers in PDF
        if (char === '(' && !inText) {
          inText = true;
          textBuffer = '';
        } else if (char === ')' && inText) {
          inText = false;
          // Filter out binary garbage
          if (textBuffer.length > 0 && /^[\x20-\x7E\u00A0-\u00FF]+$/.test(textBuffer)) {
            text += textBuffer + ' ';
          }
        } else if (inText) {
          textBuffer += char;
        }
      }
      
      resolve(text);
    };
    reader.onerror = () => resolve('');
    reader.readAsArrayBuffer(file);
  });
}

export async function parsePDF(file: File): Promise<PDFParseResult> {
  // Detect source from filename first
  const source = detectSourceFromFilename(file.name);
  
  // Try to extract basic text
  const rawText = await extractBasicPDFInfo(file);
  
  // Create base result
  const baseResult: PDFParseResult = {
    source: source,
    client: { nom: null, adresse: null, codePostal: null, ville: null, telephone: null, email: null },
    devis: { reference: null, date: null, validite: null, numeroClient: null },
    commercial: { nom: null, email: null },
    lignes: [],
    location: { duree: null, loyerMensuel: null, montantTotal: null },
    totaux: { totalHT: null, tva: null, totalTTC: null },
    rawText,
  };
  
  // If we got some text, try to parse it
  if (rawText.length > 50) {
    let parsedData: Partial<PDFParseResult> = {};
    
    if (source === 'cybertek') {
      parsedData = parseCybertekText(rawText);
    } else if (source === 'grosbill') {
      parsedData = parseGrosbillText(rawText);
    }
    
    return {
      ...baseResult,
      ...parsedData,
      source, // Keep the detected source
    };
  }
  
  // Return result with source detected from filename
  // User will need to fill in details manually
  return baseResult;
}

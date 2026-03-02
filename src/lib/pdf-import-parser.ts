// PDF text extraction using pdfjs-dist legacy build (avoids top-level await)

export interface PDFProductLine {
  reference: string | null;
  designation: string;
  prixUnitaire: number | null;
  quantite: number;
  totalHT: number;
  isSeparator?: boolean;
}

export interface PDFParseResult {
  source: 'cybertek' | 'grosbill' | 'dental' | 'unknown';
  client: {
    prenom: string | null;
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

/**
 * Nettoie le nom de ville extrait d'un PDF en supprimant les informations parasites
 * (horaires d'ouverture, suffixe FR, etc.)
 */
function cleanCityName(raw: string): string {
  if (!raw) return '';
  let city = raw.trim();
  // Supprimer suffixe FR
  city = city.replace(/\s+FR\s*$/i, '').trim();
  // Couper au premier tiret suivi de texte non pertinent (horaires, infos d'ouverture)
  city = city.replace(/\s*[–\-]\s*(?:Ouvert|du\s+lundi|Lundi|Horaires|Fermé|Accès|Tél|Tel|Fax|Site).*/i, '').trim();
  // Couper aussi si tiret simple suivi de texte long (probablement pas un nom de ville composé)
  city = city.replace(/\s*[–\-]\s+[A-Za-zÀ-ÿ]{4,}\s+[A-Za-zÀ-ÿ].*$/i, (match) => {
    // Garder les noms de ville composés courts comme "ST-MEDARD" mais pas "Ouvert du lundi..."
    if (/ouvert|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|horaire|fermé/i.test(match)) {
      return '';
    }
    return match;
  });
  return city.trim();
}

function detectSourceFromFilename(filename: string): 'cybertek' | 'grosbill' | 'dental' | 'unknown' {
  const lowerName = filename.toLowerCase();
  if (lowerName.includes('cybertek') || lowerName.includes('kedge')) {
    return 'cybertek';
  }
  if (lowerName.includes('grosbill') || /devis_\d+_\d+/i.test(lowerName)) {
    return 'grosbill';
  }
  // FIXED: Support "Devis - SO74920.pdf" (spaces+dashes) and "Devis_-_SO74920.pdf" (underscores)
  if (lowerName.includes('dental') || /(?:devis|quotation)[\s_-]+so\d+/i.test(lowerName)) {
    return 'dental';
  }
  return 'unknown';
}

function detectSourceFromText(text: string): 'cybertek' | 'grosbill' | 'dental' | 'unknown' {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('cybertek') || lowerText.includes('groupe cybertek')) {
    return 'cybertek';
  }
  if (lowerText.includes('grosbill')) {
    return 'grosbill';
  }
  if (lowerText.includes('3d dental store') || lowerText.includes('3ddentalstore')) {
    return 'dental';
  }
  return 'unknown';
}

function parseNumber(value: string | null | undefined): number | null {
  if (!value) return null;

  const raw = value.replace(/\s/g, '').replace('€', '');

  // Handle common French/European formats:
  // - "37 972,80" (space thousands + comma decimals)
  // - "37.972,80" (dot thousands + comma decimals)
  // - "37972.80" (dot decimals)
  let normalized = raw;

  // If we have both '.' and ',', assume '.' are thousands separators and ',' is decimal
  if (normalized.includes('.') && normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (normalized.includes(',')) {
    // Comma decimal
    normalized = normalized.replace(',', '.');
  }

  // Keep only digits, minus and dot
  normalized = normalized.replace(/[^\d.-]/g, '');

  const num = parseFloat(normalized);
  return isNaN(num) ? null : Math.round(num * 100) / 100;
}

// Split a full name into prenom (first name) and nom (last name).
// Company names (CABINET, SAS, SARL, etc.) stay entirely in nom with empty prenom.
function splitClientName(fullName: string | null): { prenom: string | null; nom: string | null } {
  if (!fullName) return { prenom: null, nom: null };
  const trimmed = fullName.trim();
  if (!trimmed) return { prenom: null, nom: null };
  // Company patterns — keep everything in nom
  if (/^(CABINET|SAS|SARL|SCI|EURL|SELARL|SCP|SCM|SA\b|CLINIQUE|CENTRE|GROUPE|DR\b|DOCTEUR)/i.test(trimmed)) {
    return { prenom: null, nom: trimmed };
  }
  // All-uppercase multi-word (likely a company name)
  if (/^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇ\s-]+$/.test(trimmed) && trimmed.split(/\s+/).length > 2) {
    return { prenom: null, nom: trimmed };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) return { prenom: null, nom: trimmed };
  return { prenom: parts[0], nom: parts.slice(1).join(' ') };
}


function parseCybertekText(text: string): Partial<PDFParseResult> {
  const result: Partial<PDFParseResult> = {
    source: 'cybertek',
    lignes: [],
    client: { prenom: null, nom: null, adresse: null, codePostal: null, ville: null, telephone: null, email: null },
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

  // Extract devis/commande reference number (e.g. "DEVIS N°6380967" or "COMMANDE N°6397708")
  const refDocMatch = text.match(/(?:DEVIS|COMMANDE)\s*N[°o]\s*[:#]?\s*(\d{6,})/i);
  if (refDocMatch) {
    result.devis!.reference = refDocMatch[1];
  }

  // Extract date - support both "Devis du DD/MM/YYYY" and "DD/MM/YYYY HH:MM" (Commande format)
  const dateMatch = text.match(/Devis\s+du\s+(\d{2}\/\d{2}\/\d{4})/i)
    || text.match(/N°\s*client\s*[:\s]*\d+\s+(\d{2}\/\d{2}\/\d{4})/i)
    || text.match(/(\d{2}\/\d{2}\/\d{4})\s+\d{2}:\d{2}/);
  if (dateMatch) {
    result.devis!.date = dateMatch[1];
  }

  // Extract validity date
  const validiteMatch = text.match(/Valable\s+jusqu['']au\s+(\d{2}\/\d{2}\/\d{4})/i);
  if (validiteMatch) {
    result.devis!.validite = validiteMatch[1];
  }

  // Parse lines early for address extraction
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Extract client info from ADRESSE DE LIVRAISON block (multi-line extraction)
  const livraisonIdx = lines.findIndex((l) => /ADRESSE\s+DE\s+LIVRAISON/i.test(l));
  if (livraisonIdx !== -1) {
    for (let i = livraisonIdx + 1; i < Math.min(livraisonIdx + 12, lines.length); i++) {
      const line = lines[i];
      
      // Skip company info lines (Cybertek headers)
      if (/S\.?A\.?S\.?\s+GROUPE\s+CYBERTEK|SIEGE\s+SOCIAL|AU\s+CAPITAL|RCS|TVA\s*:|ADRESSE\s+DE\s+FACTURATION/i.test(line)) {
        continue;
      }
      
      // Stop at next section marker
      if (/N°\s*client|Devis\s+du|Contact\s+commercial/i.test(line)) {
        break;
      }
      
      // Client name (all uppercase line, first significant line after headers)
      if (!result.client!.nom && /^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s-]+$/.test(line) && line.length > 5 && !/^\d/.test(line)) {
        result.client!.nom = line.trim();
        continue;
      }
      
      // Address line (contains street keywords or starts with number/DOMAINE)
      if (!result.client!.adresse && /\d+|DOMAINE|RUE|AVENUE|COURS|BOULEVARD|PLACE|CHEMIN/i.test(line)) {
        // May need to concatenate multiple address lines
        let fullAddress = line.trim();
        // Check if next line continues the address (before postal code)
        const nextLine = lines[i + 1];
        if (nextLine && !/^\d{5}\s/.test(nextLine) && /RUE|AVENUE|COURS|BOULEVARD|LIBERATION|CHEMIN/i.test(nextLine)) {
          fullAddress += ' ' + nextLine.trim();
          i++; // Skip the next line since we consumed it
        }
        result.client!.adresse = fullAddress;
        continue;
      }
      
      // Postal code + City (5 digits + city name, optionally ending with FR)
      const cpVille = line.match(/^(\d{5})\s+(.+?)(?:\s+FR)?$/i);
      if (cpVille) {
        result.client!.codePostal = cpVille[1];
        result.client!.ville = cleanCityName(cpVille[2]);
        // Do NOT break — continue to extract phone and email that may follow
        continue;
      }

      // Phone number (after postal code)
      if (!result.client!.telephone && /^0\d[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}$/.test(line.replace(/\s/g, ''))) {
        result.client!.telephone = line.trim();
        continue;
      }

      // Client email (after postal code)
      if (!result.client!.email && /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(line.trim())) {
        result.client!.email = line.trim();
        continue;
      }
    }
  }

  // Extract email from ADRESSE DE FACTURATION block (Commande PDFs) — takes priority over livraison email
  const facturationIdx = lines.findIndex((l) => /ADRESSE\s+DE\s+FACTURATION/i.test(l));
  if (facturationIdx !== -1) {
    for (let i = facturationIdx + 1; i < Math.min(facturationIdx + 12, lines.length); i++) {
      const line = lines[i];
      if (/S\.?A\.?S\.?\s+GROUPE\s+CYBERTEK|SIEGE\s+SOCIAL/i.test(line)) continue;
      if (/COMMENTAIRES|BON\s+POUR\s+ACCORD/i.test(line)) break;

      // Phone (fallback if not already found)
      if (!result.client!.telephone && /^0\d[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}[\s.]?\d{2}$/.test(line.replace(/\s/g, ''))) {
        result.client!.telephone = line.trim();
      }
      // Email from billing address overrides livraison email (billing contact = decision maker)
      if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(line.trim())) {
        result.client!.email = line.trim();
        break;
      }
    }
  }

  // Global email fallback: find any non-Cybertek email in the document
  if (!result.client!.email) {
    const allEmails = [...text.matchAll(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi)];
    const clientEmail = allEmails.find((m) => !/@cybertek/i.test(m[1]));
    if (clientEmail) {
      result.client!.email = clientEmail[1];
    }
  }

  // Fallback: Extract client name from specific patterns if not found
  if (!result.client!.nom) {
    const clientNameMatch = text.match(/GROUPE\s+KEDGE\s+BUSINESS\s+SCHOOL/i) ||
      text.match(/Facturation\s*[:\s]*([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s]+(?:BUSINESS|SCHOOL|SARL|SAS|SA|EURL)?[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s]*)/i);
    if (clientNameMatch) {
      result.client!.nom = clientNameMatch[0].includes('KEDGE') ? 'GROUPE KEDGE BUSINESS SCHOOL' : clientNameMatch[1]?.trim() || null;
    }
  }

  // Fallback: Extract address from inline pattern
  if (!result.client!.adresse) {
    const addressMatch = text.match(/(?:DOMAINE\s+DE\s+RABA\s+)?(\d+\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s]+(?:RUE|AVENUE|COURS|BOULEVARD|PLACE|CHEMIN)[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s]+)/i);
    if (addressMatch) {
      result.client!.adresse = addressMatch[0].trim();
    }
  }

  // Fallback: Extract postal code and city
  if (!result.client!.codePostal) {
    const cpVilleMatch = text.match(/(\d{5})\s+([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s-]+?)(?=\s+(?:N°|Devis|Tél|Email|Contact|France|FR))/i);
    if (cpVilleMatch) {
      result.client!.codePostal = cpVilleMatch[1];
      result.client!.ville = cleanCityName(cpVilleMatch[2]);
    }
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

  // Parse product lines - Cybertek PDFs have multi-line structure:
  // Line 1: SY-XXX (first REF with SY- prefix)
  // Line 2: XXX (second REF without prefix - THIS is what we want)
  // Line 3+: Designation text (can span multiple lines)
  // Last line of product: ends with QTE and Total HT (e.g. "... 4 2 176,00 €")

  const money = '(\\d+(?:[\\s\\.]\\d{3})*(?:[,.]\\d{2})?)';

  const tableStartIdx = lines.findIndex(
    (l) =>
      (/\bREF\b/i.test(l) || /\bCODE\b/i.test(l)) &&
      /D[EÉ]SIGNATION/i.test(l) &&
      /QT[EÉ]/i.test(l)
  );

  // Less aggressive stopRe: do NOT stop on "TOTAL HT" / "Total HT" / "TVA 20" / "Total TTC"
  // because services like "Installation" and "Frais de livraison" appear AFTER these totals
  // Only stop on truly terminal markers
  const stopRe = /^(Offre\s+Locative|CONDITIONS\s+GENERALES)/i;
  
  // Secondary stop pattern for row-by-row break (used for backtracking limits)
  const softStopRe = /^(TOTAL\s*HT|Total\s*HT|TVA\s*20|Total\s*TTC)/i;
  
  const rowsSource = tableStartIdx !== -1 ? lines.slice(tableStartIdx + 1) : lines;
  
  console.log('[Cybertek Parser] Table rows count:', rowsSource.length);
  console.log('[Cybertek Parser] Sample rows (last 30):', rowsSource.slice(-30));

  // Pattern for the end of a product row: QTE followed by Total HT amount
  // FIXED: Remove end-of-line anchor to allow matching amounts anywhere in the line
  // Use matchAll to find the LAST occurrence in case of multiple amounts
  const rowEndRegex = new RegExp(`(\\d+)\\s+${money}\\s*€`, 'gi');
  
  // Pattern for SY- prefix refs (start of a new product block)
  const syRefPattern = /^SY-[A-Z0-9-]+$/i;
  
  // Pattern for the short ref (2nd line, without SY- prefix)
  const shortRefPattern = /^[A-Z0-9]+-[A-Z0-9-]+$|^[A-Z0-9]{4,}$/i;
  
  // Service lines (Installation / Frais de livraison)
  // NOTE: Cybertek PDFs often write the service ref as "Prestation d’installation ..." and
  // the delivery line as "1 0,00 € Frais de livraison" (keyword not at start).
  const installationRefLineRe = /^\s*Installation\b/i;
  const prestationInstallationLineRe = /^\s*Prestation\s+d[’']installation\b/i;
  const isInstallationStartLine = (line: string) =>
    installationRefLineRe.test(line) || prestationInstallationLineRe.test(line);

  const fraisLivraisonLineRe = /Frais\s+de\s+livraison/i;
  const isFraisLivraisonLine = (line: string) => fraisLivraisonLineRe.test(line);

  const isBannedLine = (line: string) =>
    /(ADRESSE\s+DE\s+LIVRAISON|ADRESSE\s+DE\s+FACTURATION|SIEGE\s+SOCIAL|AU\s+CAPITAL|GROUPE\s+KEDGE|N°\s*client)/i.test(line);

  const isGarantieLine = (line: string) => /^Garantie\s*:/i.test(line);

  // FIXED: Extend backtracking window from 8 to 15 lines for long product descriptions (e.g., Kit Rails)
  const findSyRefIndexBackwards = (fromIdx: number) => {
    for (let j = fromIdx; j >= 0 && j >= fromIdx - 15; j--) {
      const v = rowsSource[j];
      if (syRefPattern.test(v)) return j;
      // Stop on both hard and soft stop patterns for backtracking
      if (stopRe.test(v) || softStopRe.test(v)) break;
      // Stop if we hit another product's end line (QTE+amount pattern, not just any €)
      // Use a stricter pattern to avoid stopping on partial lines
      if (j < fromIdx && /\b\d{1,3}\s+[\d\s,.]+\s*€/.test(v)) break;
    }
    return -1;
  };

  const findShortRefForward = (fromIdx: number) => {
    for (let k = fromIdx + 1; k < rowsSource.length && k <= fromIdx + 8; k++) {
      const v = rowsSource[k];
      // For product refs, use soft stop to avoid crossing into totals section
      if (stopRe.test(v) || softStopRe.test(v) || syRefPattern.test(v)) break;
      if (isBannedLine(v) || isGarantieLine(v)) continue;
      if (shortRefPattern.test(v) && !/^SY-/i.test(v)) return v;
    }
    return null;
  };
  
  // Helper: Extract the last QTE+amount match from a line (tolerant to non-end-of-line amounts)
  const extractLastAmountFromLine = (line: string): { qty: number; total: number; matchIndex: number } | null => {
    const matches = [...line.matchAll(rowEndRegex)];
    if (matches.length === 0) return null;
    
    // Take the LAST match in the line
    const lastMatch = matches[matches.length - 1];
    const qty = parseInt(lastMatch[1], 10) || 1;
    const total = parseNumber(lastMatch[2]) || 0;
    const matchIndex = lastMatch.index ?? 0;
    
    return { qty, total, matchIndex };
  };

  // Cybertek: we parse rows by detecting the *end* of a product line ("QTE + Total HT")
  // then we look around it to recover:
  // - REF: the short ref line (without SY-) that often comes AFTER the end line
  // - DESIGNATION: lines around the SY- ref and the end line
  for (let i = 0; i < rowsSource.length; i++) {
    const l = rowsSource[i];

    if (stopRe.test(l)) break;
    // Skip soft stop lines (Total HT, TVA, etc.) but don't break - continue scanning for services
    if (softStopRe.test(l)) continue;
    if (/Dont\s+eco-?taxe/i.test(l)) continue;
    if (isBannedLine(l) || isGarantieLine(l)) continue;

    // Special refs first (Installation ONLY - Frais de livraison is excluded from import)
    // Using windowed lookahead to avoid absorbing global totals like "14 700,00 €"
    // FIXED: Use permissive regex patterns instead of strict startsWith()
    const isInstallation = isInstallationStartLine(l);
    // NOTE: Frais de livraison is intentionally NOT imported
    const specialRefMatch = isInstallation ? 'Installation' : null;
    
    if (specialRefMatch) {
      // Windowed lookahead: scan up to 6 lines maximum to find QTE + total
      const maxLookahead = 6;
      const designationParts: string[] = [];
      let foundQty = 0;
      let foundTotal = 0;
      let endLineIdx = i;
      
      // Pattern to extract "QTE (1-2 digits) + Amount + €" at end of a SINGLE line
      // More restrictive: we check EACH line individually, not an accumulated buffer
      const lineEndPattern = /(?:^|\s)(\d{1,2})\s+([\d\s,.]+)\s*€\s*$/;
      
      // Pattern to detect another special ref or product start (stop conditions)
      const isNewBlockStart = (line: string) =>
        syRefPattern.test(line) ||
        ((isInstallationStartLine(line) || isFraisLivraisonLine(line)) && line !== l) ||
        stopRe.test(line) ||
        /^Total/i.test(line);
      
      // Collect candidate amounts from each line in the window
      interface Candidate { lineIdx: number; qty: number; total: number; linePart: string; }
      const candidates: Candidate[] = [];
      
      for (let j = i; j < rowsSource.length && j <= i + maxLookahead; j++) {
        const currentLine = rowsSource[j];
        
        // Stop if we hit a new block
        if (j > i && isNewBlockStart(currentLine)) break;
        if (isBannedLine(currentLine) || isGarantieLine(currentLine)) continue;
        
        // Try to extract QTE + total from THIS line specifically
        const lineMatch = currentLine.match(lineEndPattern);
        if (lineMatch) {
          const qty = parseInt(lineMatch[1], 10) || 1;
          const total = parseNumber(lineMatch[2]) || 0;
          
          // Skip if this looks like a global total (> 10000 € and qty > 10)
          // Heuristic: service lines typically have qty < 10 and total < 5000
          if (total > 0 && total < 50000 && qty <= 20) {
            const linePart = currentLine.slice(0, currentLine.lastIndexOf(lineMatch[0])).trim();
            candidates.push({ lineIdx: j, qty, total, linePart });
          }
        }
        
        // Also try to detect just an amount (fallback: qty=1)
        const amountOnlyMatch = currentLine.match(/([\d\s,.]+)\s*€\s*$/);
        if (amountOnlyMatch && !lineMatch) {
          const total = parseNumber(amountOnlyMatch[1]) || 0;
          if (total > 0 && total < 10000) {
            const linePart = currentLine.slice(0, currentLine.lastIndexOf(amountOnlyMatch[0])).trim();
            candidates.push({ lineIdx: j, qty: 1, total, linePart });
          }
        }
      }
      
      // Select best candidate: earliest line with valid qty+total
      // Prefer candidates with qty > 1 (explicit quantity), then smallest total
      let bestCandidate: Candidate | null = null;
      
      if (candidates.length > 0) {
        // Sort by: line index (earlier is better), then prefer explicit qty, then smaller totals
        candidates.sort((a, b) => {
          // Prefer earlier lines
          if (a.lineIdx !== b.lineIdx) return a.lineIdx - b.lineIdx;
          // Prefer explicit qty > 1 over fallback qty=1
          if ((a.qty > 1) !== (b.qty > 1)) return b.qty > 1 ? 1 : -1;
          // Prefer smaller totals (less likely to be global total)
          return a.total - b.total;
        });
        bestCandidate = candidates[0];
      }
      
      if (bestCandidate) {
        foundQty = bestCandidate.qty;
        foundTotal = bestCandidate.total;
        endLineIdx = bestCandidate.lineIdx;
        
        // Build designation from lines between start and the candidate line
        for (let j = i; j <= endLineIdx; j++) {
          const currentLine = rowsSource[j];
          if (isBannedLine(currentLine) || isGarantieLine(currentLine)) continue;
          
          if (j === endLineIdx) {
            // For the line with the amount, use only the text part before the amount
            if (bestCandidate.linePart) {
              designationParts.push(bestCandidate.linePart);
            }
          } else {
            designationParts.push(currentLine);
          }
        }
        
        // Clean up designation: remove the reference prefix, collapse whitespace
        let designation = designationParts.join(' ').replace(/\s+/g, ' ').trim();
        // Only strip a literal leading "Installation" label; keep "Prestation d’installation..."
        if (/^\s*Installation\b/i.test(designation)) {
          designation = designation.replace(/^\s*Installation\s*/i, '').trim();
        }
        
        console.log('[Cybertek Parser] Service line extracted:', {
          reference: specialRefMatch,
          qty: foundQty,
          total: foundTotal,
          designation: designation.substring(0, 100) + (designation.length > 100 ? '...' : ''),
        });
        
        result.lignes!.push({
          reference: specialRefMatch,
          designation,
          quantite: foundQty,
          totalHT: foundTotal,
          prixUnitaire: foundQty > 0 ? Math.round((foundTotal / foundQty) * 100) / 100 : null,
        });
        
        i = endLineIdx;
      } else {
        // FALLBACK: When no strict pattern matched, try permissive extraction
        // Look for any amount € in the window and collect designation lines
        const fallbackDesignationLines: string[] = [];
        let fallbackTotal = 0;
        let fallbackQty = 1;
        let fallbackEndIdx = i;
        let amountLineIdx = -1;
        
        for (let j = i; j < rowsSource.length && j <= i + maxLookahead; j++) {
          const line = rowsSource[j];
          
          // Stop if we hit a new block (but allow current line to be collected)
          if (j > i && isNewBlockStart(line)) break;
          if (isBannedLine(line) || isGarantieLine(line)) continue;
          
          // Look for any amount € on this line
          const amountMatch = line.match(/([\d\s,.]+)\s*€/);
          if (amountMatch && fallbackTotal === 0) {
            // Special handling for Installation: detect "QTE MONTANT €" pattern
            // e.g., "2 974,00 € Installation" where 2 is QTE and 974,00 is the amount
            const installQtyAmountPattern = /^(\d{1,2})\s+([\d]+(?:[,.][\d]{2})?)\s*€/;
            const installMatch = line.match(installQtyAmountPattern);
            
            if (installMatch && specialRefMatch === 'Installation') {
              // Pattern matched: "2 974,00 €" → QTE=2, Amount=974.00
              fallbackQty = parseInt(installMatch[1], 10) || 1;
              fallbackTotal = parseNumber(installMatch[2]) ?? 0;
              fallbackEndIdx = j;
              amountLineIdx = j;
              console.log('[Cybertek Parser] Installation amount detected:', { qty: fallbackQty, total: fallbackTotal, line });
            } else {
              const val = parseNumber(amountMatch[1]);
              // Accept amounts between 0 and 10000 for service lines
              if (val !== null && val >= 0 && val < 10000) {
                fallbackTotal = val;
                fallbackEndIdx = j;
                amountLineIdx = j;
                
                // Try to find a QTE before the amount (e.g., "2 974,00 €")
                const qtyBeforeAmount = line.match(/\b(\d{1,2})\s+[\d\s,.]+\s*€/);
                if (qtyBeforeAmount) {
                  fallbackQty = parseInt(qtyBeforeAmount[1], 10) || 1;
                }
              }
            }
            
            // Add the text part before the amount to designation (if any)
            const textPart = line.slice(0, line.indexOf(amountMatch[0])).trim();
            if (textPart) {
              fallbackDesignationLines.push(textPart);
            }
            continue;
          }
          
          // Collect line for designation if no amount found yet
          if (fallbackTotal === 0) {
            fallbackDesignationLines.push(line);
          }
        }
        
        // NEW: After finding the amount, continue scanning for designation continuation
        // Lines AFTER the amount line may still be part of the designation
        if (fallbackTotal > 0 && amountLineIdx >= 0) {
          for (let k = amountLineIdx + 1; k < rowsSource.length && k <= amountLineIdx + 4; k++) {
            const line = rowsSource[k];
            
            // Stop if we hit a new block marker
            if (isFraisLivraisonLine(line) || 
                stopRe.test(line) || 
                syRefPattern.test(line) ||
                /Offre\s+Locative/i.test(line) ||
                /TOTAL\s*H\.?T/i.test(line)) {
              break;
            }
            
            // Skip banned lines and lines with amounts (likely new products)
            if (isBannedLine(line) || isGarantieLine(line)) continue;
            if (/\d+[,.\s]+\d{2}\s*€/.test(line)) break;
            
            // Add to designation
            fallbackDesignationLines.push(line);
            fallbackEndIdx = k;
          }
        }
        
        // Build and add the line if we found a total (even if 0 for "Frais de livraison")
        // We need at least some designation content OR a valid total
        if (fallbackTotal > 0 || (specialRefMatch.toLowerCase().includes('frais') && fallbackDesignationLines.length > 0)) {
          let designation = fallbackDesignationLines.join(' ')
            .replace(/[\d\s,.]+\s*€.*$/, '')
            .replace(/\bInstallation\s*$/i, '') // Remove trailing "Installation" marker
            .replace(/\s+/g, ' ')
            .trim();
          if (/^\s*Installation\b/i.test(designation)) {
            designation = designation.replace(/^\s*Installation\s*/i, '').trim();
          }
          
          console.log('[Cybertek Parser] Service line (fallback):', {
            reference: specialRefMatch,
            qty: fallbackQty,
            total: fallbackTotal,
            designation: designation.substring(0, 150) + (designation.length > 150 ? '...' : ''),
          });
          
          result.lignes!.push({
            reference: specialRefMatch,
            designation,
            quantite: fallbackQty,
            totalHT: fallbackTotal,
            prixUnitaire: fallbackQty > 0 ? Math.round((fallbackTotal / fallbackQty) * 100) / 100 : null,
          });
          
          i = fallbackEndIdx;
        }
      }
      continue;
    }

    // Standard products: detect end of row using tolerant extraction
    const amountExtracted = extractLastAmountFromLine(l);
    if (!amountExtracted) continue;

    const syIdx = findSyRefIndexBackwards(i);
    
    // === COMMANDE FORMAT: Single-line rows starting with numeric CODE ===
    // Format: "00602456  Carte graphique MSI...  408,32 €  3  1 224,96 €"
    // Or multi-line: CODE on one line, then designation + amounts on subsequent lines
    if (syIdx === -1) {
      // Try to detect Commande-style rows: look backwards for a numeric code line
      const numericCodePattern = /^(\d{6,10})\b/;
      let codeIdx = -1;
      for (let j = i; j >= 0 && j >= i - 10; j--) {
        if (numericCodePattern.test(rowsSource[j])) {
          codeIdx = j;
          break;
        }
        if (stopRe.test(rowsSource[j]) || softStopRe.test(rowsSource[j])) break;
        // Stop if we hit another product's amount line
        if (j < i && /\b\d{1,3}\s+[\d\s,.]+\s*€/.test(rowsSource[j])) break;
      }
      
      if (codeIdx !== -1) {
        const codeLine = rowsSource[codeIdx];
        const codeMatch = codeLine.match(numericCodePattern);
        const reference = codeMatch ? codeMatch[1] : null;
        const quantite = amountExtracted.qty;
        const totalHT = amountExtracted.total;
        
        // Build designation from lines between code and amount line
        const designationParts: string[] = [];
        for (let j = codeIdx; j <= i; j++) {
          const v = rowsSource[j];
          if (isBannedLine(v) || isGarantieLine(v)) continue;
          if (/Dont\s+eco-?taxe/i.test(v)) continue;
          
          if (j === codeIdx) {
            // Remove the code prefix from the first line
            const afterCode = v.replace(numericCodePattern, '').trim();
            if (afterCode) designationParts.push(afterCode);
          } else if (j === i) {
            // Use matchIndex to get text before the amount
            const leftPart = v.slice(0, amountExtracted.matchIndex).trim();
            if (leftPart) designationParts.push(leftPart);
          } else {
            designationParts.push(v);
          }
        }
        
        // Remove price unit from designation (e.g. "408,32 €" appearing before QTE)
        let designation = designationParts.join(' ').replace(/\s+/g, ' ').trim();
        // Strip unit price pattern "NNN,NN € [QTE]" left anywhere in designation (Commande format)
        // e.g. "Carte graphique MSI ... 408,32 € 3" → "Carte graphique MSI ..."
        designation = designation.replace(/\s+\d+(?:[\s.]\d{3})*[,.]\d{2}\s*€(?:\s+\d{1,3})?/g, '').trim();
        // Also strip a trailing standalone amount without leading space (safety net)
        designation = designation.replace(/\d+(?:[\s.]\d{3})*[,.]\d{2}\s*€\s*$/, '').trim();
        
        // Skip "Produit inclus dans l'extension de garantie" and eco-taxe lines
        if (/Produit\s+inclus/i.test(designation) || /eco-?taxe/i.test(designation)) {
          continue;
        }
        
        // Skip transport/livraison lines (excluded from Invest like in Devis format)
        if (/Transport\s+CYBERTEK|Forfait\s+Transport/i.test(designation)) {
          console.log('[Cybertek Parser] Skipping transport line:', designation);
          continue;
        }
        
        if (designation) {
          console.log('[Cybertek Parser] Commande line extracted:', {
            reference, designation: designation.substring(0, 100), quantite, totalHT,
          });
          
          result.lignes!.push({
            reference,
            designation,
            quantite,
            totalHT,
            prixUnitaire: quantite > 0 ? Math.round((totalHT / quantite) * 100) / 100 : null,
          });
        }
      }
      continue;
    }

    const quantite = amountExtracted.qty;
    const totalHT = amountExtracted.total;

    const syRef = rowsSource[syIdx];
    const shortRef = findShortRefForward(i);

    // Build designation around the SY- ref and the end line
    const designationParts: string[] = [];

    // Often the first designation line is just before the SY- ref
    const beforeSy = rowsSource[syIdx - 1];
    if (
      beforeSy &&
      !stopRe.test(beforeSy) &&
      !isBannedLine(beforeSy) &&
      !isGarantieLine(beforeSy) &&
      !syRefPattern.test(beforeSy) &&
      !(shortRefPattern.test(beforeSy) && !/^SY-/i.test(beforeSy))
    ) {
      designationParts.push(beforeSy);
    }

    for (let j = syIdx + 1; j <= i; j++) {
      const v = rowsSource[j];
      if (isBannedLine(v) || isGarantieLine(v)) continue;
      if (/Dont\s+eco-?taxe/i.test(v)) continue;
      if (syRefPattern.test(v)) continue;
      if (shortRefPattern.test(v) && !/^SY-/i.test(v)) continue;

      if (j === i) {
        // Use the matchIndex from extractLastAmountFromLine to cut the line properly
        const leftPart = v.slice(0, amountExtracted.matchIndex).trim();
        if (leftPart) designationParts.push(leftPart);
      } else {
        designationParts.push(v);
      }
    }

    const designation = designationParts.join(' ').replace(/\s+/g, ' ').trim();

    // Prefer short ref (2nd line) as requested; fallback to extracting from designation; else strip SY-
    const extractedFromDesignation = designation.match(/\b([A-Z0-9]{2,}-[A-Z0-9-]{2,})\b/i)?.[1] ?? null;
    const reference = shortRef ?? extractedFromDesignation ?? (syRef ? syRef.replace(/^SY-/i, '') : null);

    result.lignes!.push({
      reference,
      designation,
      quantite,
      totalHT,
      prixUnitaire: quantite > 0 ? Math.round((totalHT / quantite) * 100) / 100 : null,
    });
  }

  // ==============================
  // RECOVERY PASS: Capture missing lines by scanning the entire document
  // ==============================
  
  // Recovery for "Installation" if not already found
  const hasInstallation = result.lignes!.some(l => 
    l.reference?.toLowerCase() === 'installation'
  );
  
  if (!hasInstallation) {
    console.log('[Cybertek Parser] Recovery: searching for Installation in full document...');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for the service header line (often "Prestation d’installation ...")
      if (isInstallationStartLine(line)) {
        console.log('[Cybertek Parser] Recovery: found Installation at line', i, ':', line);
        
        // Collect designation from subsequent lines (up to 25 lines lookahead)
        const maxWindow = 25;
        const designationParts: string[] = [];
        let recoveredQty = 1;
        let recoveredTotal = 0;
        let foundAmount = false;
        
        for (let j = i; j < lines.length && j <= i + maxWindow && !foundAmount; j++) {
          const currentLine = lines[j];
          
          // Stop conditions: next product, end markers
          if (j > i && (
            syRefPattern.test(currentLine) ||
            isFraisLivraisonLine(currentLine) ||
            stopRe.test(currentLine) ||
            /^Offre\s+Locative/i.test(currentLine)
          )) {
            break;
          }
          
          // Skip banned lines
          if (isBannedLine(currentLine) || isGarantieLine(currentLine)) continue;
          
          // Try to extract amount from this line
          // Format expected: "QTE AMOUNT €" where AMOUNT is the TOTAL (not unitaire)
          // Example: "2 974,00 € Installation" → qty=2, total=974.00€
          const amountMatches = [...currentLine.matchAll(/([\d\s,.]+)\s*€/gi)];
          if (amountMatches.length > 0 && recoveredTotal === 0) {
            const lastMatch = amountMatches[amountMatches.length - 1];
            const total = parseNumber(lastMatch[1]) || 0;
            
            // Only accept reasonable amounts (100€ to 5000€ for service lines)
            if (total >= 100 && total < 5000) {
              // Look for a standalone QTE before the amount (e.g., "2 974,00")
              // The QTE is typically a 1-2 digit number at the START of the line or right before
              const lineBeforeAmount = currentLine.slice(0, currentLine.indexOf(lastMatch[0])).trim();
              const qtyMatch = lineBeforeAmount.match(/\b(\d{1,2})\s*$/);
              if (qtyMatch) {
                recoveredQty = parseInt(qtyMatch[1], 10) || 1;
              }
              recoveredTotal = total; // This is already the VTN (total)
              foundAmount = true;
              
              // Add text before the qty+amount (the real designation part)
              const textBeforeQty = qtyMatch 
                ? lineBeforeAmount.slice(0, lineBeforeAmount.lastIndexOf(qtyMatch[0])).trim()
                : lineBeforeAmount;
              if (textBeforeQty && !isInstallationStartLine(textBeforeQty)) {
                designationParts.push(textBeforeQty);
              }
              continue;
            }
          }
          
          // Collect line for designation if no amount found yet
          if (!foundAmount && j > i) {
            // Clean the line (remove "Installation" prefix if present)
             // Keep the full wording ("Prestation d’installation ...")
             let cleanLine = currentLine;
             if (/^\s*Installation\b/i.test(cleanLine)) {
               cleanLine = cleanLine.replace(/^\s*Installation\s*/i, '').trim();
             } else {
               cleanLine = cleanLine.trim();
             }
            if (cleanLine && !/^\d+$/.test(cleanLine)) {
              designationParts.push(cleanLine);
            }
          }
        }
        
        if (recoveredTotal > 0) {
          const designation = designationParts.join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          console.log('[Cybertek Parser] Recovery: Installation extracted', {
            qty: recoveredQty,
            total: recoveredTotal,
            designation: designation.substring(0, 100),
          });
          
          result.lignes!.push({
            reference: 'Installation',
            designation,
            quantite: recoveredQty,
            totalHT: recoveredTotal,
            prixUnitaire: recoveredQty > 0 ? Math.round((recoveredTotal / recoveredQty) * 100) / 100 : null,
          });
          
          break; // Only add once
        }
      }
    }
  }
  
  // Recovery for "Kit Rails RKS-02" (SY-RKS02) if not already found
  const hasRKS02 = result.lignes!.some(l => 
    l.reference?.toUpperCase().includes('RKS') || 
    l.designation?.toUpperCase().includes('RKS-02') ||
    l.designation?.toUpperCase().includes('RAILS COULISSANTS')
  );
  
  if (!hasRKS02) {
    console.log('[Cybertek Parser] Recovery: searching for SY-RKS02 / Kit Rails in full document...');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for SY-RKS02 reference
      if (/SY-RKS02/i.test(line)) {
        console.log('[Cybertek Parser] Recovery: found SY-RKS02 at line', i, ':', line);
        
        // Scan a TIGHT window around the SY-RKS02 line only
        // Stop as soon as we hit another product or marker
        const designationParts: string[] = [];
        let recoveredQty = 1;
        let recoveredTotal = 0;
        
        // Look 1 line before for the main designation
        const prevLine = i > 0 ? lines[i - 1] : '';
        if (prevLine && /Kit\s+Rails\s+coulissants/i.test(prevLine)) {
          designationParts.push(prevLine.trim());
        }
        
        // Scan forward for amount and additional designation (max 8 lines)
        for (let j = i; j < lines.length && j <= i + 8; j++) {
          const currentLine = lines[j];
          
          // Hard stop: another SY- product, Installation, or terminal markers
          if (j > i && (
            (syRefPattern.test(currentLine) && !/SY-RKS02/i.test(currentLine)) ||
            isInstallationStartLine(currentLine) ||
            isFraisLivraisonLine(currentLine) ||
            stopRe.test(currentLine) ||
            /HAT5320/i.test(currentLine) // Next product in this PDF
          )) {
            break;
          }
          
          // Try to extract amount (format: "QTE AMOUNT €")
          const amountMatch = currentLine.match(/([\d\s,.]+)\s*€/);
          if (amountMatch && recoveredTotal === 0) {
            const total = parseNumber(amountMatch[1]) || 0;
            // Kit Rails should be ~200€ (accept 50-500)
            if (total >= 50 && total <= 500) {
              // Look for qty before amount
              const qtyMatch = currentLine.match(/\b(\d{1,2})\s+[\d\s,.]+\s*€/);
              if (qtyMatch) {
                recoveredQty = parseInt(qtyMatch[1], 10) || 1;
              }
              recoveredTotal = total;
            }
          }
          
          // Collect designation parts (not the SY- line itself, not amount-only lines)
          if (!/^SY-RKS02/i.test(currentLine) && !/^\s*\d{1,2}\s+[\d\s,.]+\s*€\s*$/i.test(currentLine)) {
            const clean = currentLine
              .replace(/\bSY-RKS02\b/gi, '')
              .replace(/Garantie:\s*\d+\s*ans?/gi, '') // Strip "Garantie: X ans" suffix
              .trim();
            
            // Only add if it looks like RKS designation content
            if (clean && (
              /profondeur|rack|compatible|CMA/i.test(clean) ||
              /Kit\s+Rails/i.test(clean) ||
              /RKS-02/i.test(clean)
            )) {
              designationParts.push(clean);
            }
          }
        }
        
        if (recoveredTotal > 0) {
          const designation = designationParts
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim() || 'Synology Kit Rails coulissants RKS-02';
          
          console.log('[Cybertek Parser] Recovery: RKS-02 extracted', {
            qty: recoveredQty,
            total: recoveredTotal,
            designation: designation.substring(0, 100),
          });
          
          result.lignes!.push({
            reference: 'RKS-02',
            designation,
            quantite: recoveredQty,
            totalHT: recoveredTotal,
            prixUnitaire: recoveredQty > 0 ? Math.round((recoveredTotal / recoveredQty) * 100) / 100 : null,
          });
          
          break; // Only add once
        }
      }
    }
  }
  
  // NOTE: "Frais de livraison" is intentionally NOT recovered - not needed in Invest
  
  console.log('[Cybertek Parser] Final extracted lines:', result.lignes!.map(l => ({
    ref: l.reference,
    qty: l.quantite,
    total: l.totalHT,
  })));

  // Totals extraction - Strategy 1: Look for amounts after "Loyer mensuel" marker
  // Cybertek PDFs show totals (HT, TVA, TTC) as 3 consecutive amounts without labels
  const loyerIdx = lines.findIndex((l) => /Loyer\s+mensuel/i.test(l));
  
  if (loyerIdx !== -1) {
    const afterLoyer = lines.slice(loyerIdx + 1);
    const moneyPattern = new RegExp(`${money}\\s*€`, 'gi');
    const amounts: number[] = [];
    
    for (const line of afterLoyer) {
      const matches = [...line.matchAll(moneyPattern)];
      for (const m of matches) {
        const v = parseNumber(m[1]);
        // Filter: > 100€ to exclude small fees, but include TVA amounts
        if (v !== null && v >= 100) amounts.push(v);
      }
    }
    
    // Take the first 3 significant amounts as HT, TVA, TTC
    if (amounts.length >= 3) {
      const [ht, tva, ttc] = amounts.slice(0, 3);
      
      // Validation: TTC should be close to HT + TVA (5% tolerance)
      const expectedTTC = ht + tva;
      if (Math.abs(ttc - expectedTTC) / expectedTTC < 0.05) {
        result.totaux!.totalHT = ht;
        result.totaux!.tva = tva;
        result.totaux!.totalTTC = ttc;
        console.log('Cybertek totals extracted (after Loyer mensuel):', result.totaux);
      }
    }
  }

  // Strategy 2: Fallback - look in the tail section after table
  if (result.totaux!.totalHT === null) {
    const tailStartIdx = lines.findIndex((l) => stopRe.test(l));
    const tail = tailStartIdx !== -1 ? lines.slice(tailStartIdx) : lines.slice(-60);

    const moneyPattern = new RegExp(`${money}(?:\\s*€|\\s*EUR)?`, 'gi');
    const allAmounts: number[] = [];

    for (const line of tail) {
      const matches = [...line.matchAll(moneyPattern)];
      for (const m of matches) {
        const v = parseNumber(m[1]);
        if (v !== null) allAmounts.push(v);
      }
    }

    // Keep amounts >= 100 (lowered from 1000 to catch smaller TVA)
    const significantAmounts = allAmounts.filter((n) => n >= 100);

    // Try to find a valid triplet with TTC > HT and TTC > TVA validation
    if (significantAmounts.length >= 3) {
      const last3 = significantAmounts.slice(-3);
      const [potentialHT, potentialTVA, potentialTTC] = last3;
      
      // Validate: TTC should be close to HT + TVA
      const expectedTTC = potentialHT + potentialTVA;
      if (Math.abs(potentialTTC - expectedTTC) / expectedTTC < 0.05) {
        result.totaux!.totalHT = potentialHT;
        result.totaux!.tva = potentialTVA;
        result.totaux!.totalTTC = potentialTTC;
      } else if (potentialTTC > potentialHT && potentialTTC > potentialTVA) {
        // Fallback: just check TTC is largest
        result.totaux!.totalHT = potentialHT;
        result.totaux!.tva = potentialTVA;
        result.totaux!.totalTTC = potentialTTC;
      }
    }
  }

  // Strategy 3: Fallback - try explicit label patterns
  if (result.totaux!.totalHT === null) {
    const totalHTMatch = [...text.matchAll(
      new RegExp(`(?:Prix\\s+)?Total(?:\\s+de\\s+vente)?\\s*HT[\\s\\S]{0,80}?${money}\\s*€`, 'gi')
    )].at(-1);
    if (totalHTMatch) {
      const v = parseNumber(totalHTMatch[1]);
      if (v !== null && v >= 100) result.totaux!.totalHT = v;
    }
  }

  if (result.totaux!.tva === null) {
    const tvaMatch = [...text.matchAll(
      new RegExp(`TVA\\s*(?:20\\s*%|20,?00\\s*%)?\\s*:?\\s*${money}\\s*€`, 'gi')
    )].at(-1);
    if (tvaMatch) {
      const v = parseNumber(tvaMatch[1]);
      if (v !== null && v >= 100) result.totaux!.tva = v;
    }
  }

  if (result.totaux!.totalTTC === null) {
    const totalTTCMatch = [...text.matchAll(
      new RegExp(`Total(?:\\s+de\\s+vente)?\\s*TTC[\\s\\S]{0,80}?${money}\\s*€`, 'gi')
    )].at(-1);
    if (totalTTCMatch) {
      const v = parseNumber(totalTTCMatch[1]);
      if (v !== null && v >= 100) result.totaux!.totalTTC = v;
    }
  }

  // Strategy 4: Calculate totals from line items if still not found
  // Per constraint: only use this as last resort when extraction fails
  if (result.totaux!.totalHT === null && result.lignes!.length > 0) {
    const calculatedTotalHT = result.lignes!.reduce(
      (sum, line) => sum + (line.totalHT || 0),
      0
    );
    
    if (calculatedTotalHT > 0) {
      result.totaux!.totalHT = Math.round(calculatedTotalHT * 100) / 100;
      result.totaux!.tva = Math.round(calculatedTotalHT * 0.20 * 100) / 100;
      result.totaux!.totalTTC = Math.round(calculatedTotalHT * 1.20 * 100) / 100;
      console.log('Cybertek - Totals calculated from line items:', result.totaux);
    }
  }

  return result;
}

function parseGrosbillText(text: string): Partial<PDFParseResult> {
  const result: Partial<PDFParseResult> = {
    source: 'grosbill',
    lignes: [],
    client: { prenom: null, nom: null, adresse: null, codePostal: null, ville: null, telephone: null, email: null },
    devis: { reference: null, date: null, validite: null, numeroClient: null },
    commercial: { nom: null, email: null },
    location: { duree: null, loyerMensuel: null, montantTotal: null },
    totaux: { totalHT: null, tva: null, totalTTC: null },
  };

  // Extract devis number (handles "DEVIS N°6380967" and variants)
  const devisMatch = text.match(/DEVIS\s*N[°o]\s*[:#]?\s*(\d{6,})/i);
  if (devisMatch) {
    result.devis!.reference = devisMatch[1];
  }

  // Extract date
  const dateMatch = text.match(/(\d{2}\/\d{2}\/\d{4})\s+\d{2}:\d{2}/);
  if (dateMatch) {
    result.devis!.date = dateMatch[1];
  }

  // Extract client number (handles cases where spaces/newlines are weird)
  const clientNumMatch = text.match(/N°\s*CLIENT\s*:?\s*(\d{6,10})/i);
  if (clientNumMatch) {
    result.devis!.numeroClient = clientNumMatch[1];
  }

  // Prefer "Adresse de facturation" block for client identity (requested mapping)
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const factIdx = lines.findIndex((l) => /ADRESSE\s+DE\s+FACTURATION/i.test(l));
  if (factIdx !== -1) {
    const l1 = lines[factIdx + 1] ?? null; // nom / raison sociale
    const l2 = lines[factIdx + 2] ?? null; // adresse OU cp+ville
    const l3 = lines[factIdx + 3] ?? null; // cp+ville si l2 était adresse

    if (l1) result.client!.nom = l1;

    // Detect if l2 starts with a 5-digit postal code
    const cpMatch2 = l2?.match(/^(\d{5})\s+(.+)/);
    if (cpMatch2) {
      // l2 = "00000 ST MEDARD EN JALLES FR"
      result.client!.codePostal = cpMatch2[1];
      result.client!.ville = cleanCityName(cpMatch2[2]);
    } else {
      // l2 is a street address
      if (l2) result.client!.adresse = l2;
      // Look for CP+ville on l3
      const cpMatch3 = l3?.match(/^(\d{5})\s+(.+)/);
      if (cpMatch3) {
        result.client!.codePostal = cpMatch3[1];
        result.client!.ville = cleanCityName(cpMatch3[2]);
      }
    }
  }

  // Fallback: delivery block (name + address + CP + city)
  const deliveryMatch = text.match(
    /ADRESSE\s+DE\s+LIVRAISON\s+([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ][A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s'\-]{3,})\s+(\d+\s+RUE\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s'\-]+)\s+(\d{5})\s+([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s'\-]+)/i
  );
  if (deliveryMatch) {
    if (!result.client!.nom) result.client!.nom = deliveryMatch[1].trim();
    result.client!.adresse = result.client!.adresse || deliveryMatch[2].trim();
    result.client!.codePostal = result.client!.codePostal || deliveryMatch[3];
    // Only set city if we didn't already map the "Ville" field from facturation.
    if (!result.client!.ville) result.client!.ville = cleanCityName(deliveryMatch[4]);
  }

  // Fallback: extract address + CP/city even if name block isn't reconstructed
  if (!result.client!.adresse) {
    const adresseMatch = text.match(/(\d+\s+RUE\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s'\-]+)/i);
    if (adresseMatch) {
      const addr = adresseMatch[1].trim();
      // Exclude corporate HQ / footer addresses
      const addrLine = lines.find((l) => l.includes(addr)) ?? '';
      const isFooter = /si[eè]ge\s*social|SAS\s+GROUPE/i.test(addrLine) ||
        lines.some((l, i) => /si[eè]ge\s*social|SAS\s+GROUPE/i.test(l) && lines.indexOf(addrLine) > i);
      if (!isFooter) result.client!.adresse = addr;
    }
  }
  if (!result.client!.codePostal || !result.client!.ville) {
    // Use word boundary to avoid capturing partial numbers (e.g. "23014" from "6423014")
    for (const line of lines) {
      if (/DEVIS|PAGE|N°/i.test(line)) continue;
      if (/si[eè]ge\s*social|SAS\s+GROUPE/i.test(line)) continue;
      const cpVilleMatch = line.match(/\b(\d{5})\s+([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ][A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s'\-]{2,})/i);
      if (cpVilleMatch) {
        result.client!.codePostal = result.client!.codePostal || cpVilleMatch[1];
        result.client!.ville = result.client!.ville || cleanCityName(cpVilleMatch[2]);
        break;
      }
    }
  }

  // Extract phone (10 digits)
  const telMatch = text.match(/\b(0\d{9})\b/);
  if (telMatch) {
    result.client!.telephone = telMatch[1];
  }

  // Extract email
  const emailMatch = text.match(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
  if (emailMatch) {
    result.client!.email = emailMatch[1];
  }

  // Totals - Grosbill often renders the labels on one line and the values on the next.
  // We avoid any calculation: values must come from the PDF.
  const money = '(\\d+(?:[\\s\\.]\\d{3})*(?:[,.]\\d{2})?)';

  let totalsFound = false;

  // Preferred: locate the "TOTAL HT ... TVA 20% ... TOTAL TTC" header (last occurrence),
  // then read the first 3 *significant* monetary amounts that follow.
  const headerMatches = [...text.matchAll(
    new RegExp(`TOTAL\\s*HT[\\s\\S]{0,160}?TVA\\s*20\\s*%?[\\s\\S]{0,160}?TOTAL\\s*TTC`, 'gi')
  )];

  if (headerMatches.length) {
    const header = headerMatches.at(-1)!;
    const start = header.index ?? 0;
    const slice = text.slice(start, Math.min(text.length, start + 2000));

    const rawVals = [...slice.matchAll(new RegExp(`${money}\\s*€`, 'g'))].map((m) => m[1]);
    const parsedVals = rawVals
      .map((v) => parseNumber(v))
      // Filter out tiny amounts like eco-taxes that can appear near the totals block
      .filter((n): n is number => n !== null && Math.abs(n) >= 100);

    if (parsedVals.length >= 3) {
      result.totaux!.totalHT = parsedVals[0];
      result.totaux!.tva = parsedVals[1];
      result.totaux!.totalTTC = parsedVals[2];
      totalsFound = true;
    }
  }

  // Fallback: explicit label → amount patterns (older layouts / different line breaks)
  if (!totalsFound) {
    const totalHTMatches = [...text.matchAll(new RegExp(`TOTAL\\s+HT[\\s\\S]{0,80}?${money}\\s*€`, 'gi'))];
    if (totalHTMatches.length) {
      const v = parseNumber(totalHTMatches.at(-1)![1]);
      if (v !== null && Math.abs(v) >= 100) result.totaux!.totalHT = v;
    }

    const tvaMatches = [...text.matchAll(new RegExp(`TVA\\s*20\\s*%[\\s\\S]{0,80}?${money}\\s*€`, 'gi'))];
    if (tvaMatches.length) {
      const v = parseNumber(tvaMatches.at(-1)![1]);
      if (v !== null && Math.abs(v) >= 100) result.totaux!.tva = v;
    }

    const totalTTCMatches = [...text.matchAll(new RegExp(`TOTAL\\s+TTC[\\s\\S]{0,80}?${money}\\s*€`, 'gi'))];
    if (totalTTCMatches.length) {
      const v = parseNumber(totalTTCMatches.at(-1)![1]);
      if (v !== null && Math.abs(v) >= 100) result.totaux!.totalTTC = v;
    }

    // Mark as found only if we got all three totals from the PDF.
    totalsFound =
      result.totaux!.totalHT !== null &&
      result.totaux!.tva !== null &&
      result.totaux!.totalTTC !== null;
  }


  // Parse product lines - accept codes with 5+ digits (some products like 18829, 98802 have short codes)
  const lineRegex = new RegExp(`^(\\d{5,})\\s+(.+?)\\s+${money}\\s*€\\s+(\\d+)\\s+${money}\\s*€$`, 'i');
  for (const line of text.split(/\r?\n/)) {
    const m = line.trim().match(lineRegex);
    if (!m) continue;
    if (/eco-?taxe/i.test(m[2])) continue;

    result.lignes!.push({
      reference: m[1],
      designation: m[2].trim(),
      prixUnitaire: parseNumber(m[3]),
      quantite: parseInt(m[4], 10) || 1,
      totalHT: parseNumber(m[5]) || 0,
    });
  }

  return result;
}

// ========== TEXT ITEM WITH COORDINATES (for column-based parsing) ==========
interface TextItemWithCoords {
  str: string;
  x: number;
  y: number;
}

interface ExtractedTextResult {
  text: string;
  items: TextItemWithCoords[];
}

// ========== DENTAL COLUMN-BASED PRODUCT EXTRACTION ==========
// Dental PDFs have distinct columns that get fragmented during text extraction.
// We use X coordinates to assign text items to the correct columns.

function extractDentalProducts(items: TextItemWithCoords[]): PDFProductLine[] {
  const products: PDFProductLine[] = [];
  const Y_TOLERANCE = 8;
  
  // 1. Group items by Y coordinate (into rows)
  const rowMap = new Map<number, TextItemWithCoords[]>();
  
  for (const item of items) {
    if (!item.str.trim()) continue;
    const normalizedY = Math.round(item.y / Y_TOLERANCE) * Y_TOLERANCE;
    if (!rowMap.has(normalizedY)) rowMap.set(normalizedY, []);
    rowMap.get(normalizedY)!.push(item);
  }
  
  // 2. Sort rows by Y (top to bottom = Y descending)
  const sortedRows = Array.from(rowMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([_, rowItems]) => rowItems.sort((a, b) => a.x - b.x));
  
  console.log('[Dental Column Parser] Rows detected:', sortedRows.length);
  
  // 3. Process each row, using "Unité(s)" as dynamic column boundary
  for (const row of sortedRows) {
    const rowText = row.map(i => i.str).join(' ');
    
    // Skip headers, totals, section labels
    if (/^(Description|Sous-total|Subtotal|Montant\s+hors|Untaxed|Taxes|Total|Quantit[eé]|Quantity|Prix|Unit\s*Price|Amount|Informatique|Livraison|Formation)/i.test(rowText)) continue;
    if (/Incluse|Inclus/i.test(rowText) && /0[,.]00/i.test(rowText)) continue;
    
    // Must contain quantity pattern "X,XXX Unité(s)"
    if (!/\d+[,.]?\d*\s*Unit[eé]?\(?s?\)?/i.test(rowText)) continue;
    
    // 4. Find the "Unité(s)" item to use as column boundary
    const uniteIndex = row.findIndex(item => /unit[eé]?\(?s?\)?/i.test(item.str));
    if (uniteIndex === -1) continue;
    
    console.log('[Dental Row]', row.map(i => `[${Math.round(i.x)}] "${i.str}"`).join(' | '));
    
    // 5. Extract data based on position relative to "Unité(s)"
    let descriptionParts: string[] = [];
    let reference: string | null = null;
    let quantite = 1;
    
    // Items BEFORE "Unité(s)" index are description
    for (let i = 0; i < uniteIndex; i++) {
      const item = row[i];
      const text = item.str.trim();
      
      // Exclude standalone quantity numbers (e.g., "1,000" just before Unité(s))
      if (/^\d+[,.]?\d*$/.test(text)) {
        const qtyMatch = text.match(/^(\d+)/);
        if (qtyMatch) quantite = parseInt(qtyMatch[1], 10) || 1;
        continue;
      }
      
      // Check for reference pattern [XXX-YYY]
      const refMatch = text.match(/^\[([A-Z0-9\-]+)\]\s*/i);
      if (refMatch) {
        reference = refMatch[1];
        const remainder = text.substring(refMatch[0].length).trim();
        if (remainder) descriptionParts.push(remainder);
      } else {
        descriptionParts.push(text);
      }
    }
    
    // 6. Collect ALL € amounts from the row (after Unité(s))
    // Dental format: [Prix unitaire, Taxes %, Montant HT, Montant TTC]
    // We want Montant HT = second-to-last large amount
    const euroAmounts: number[] = [];
    
    for (const item of row) {
      // Look for € amounts or large numbers
      if (/€/.test(item.str)) {
        const parsed = parseNumber(item.str);
        // Filter out tiny amounts and tax rates
        if (parsed !== null && parsed > 50) {
          euroAmounts.push(parsed);
        }
      } else {
        // Also check for amounts without € symbol (some PDFs)
        const numMatch = item.str.match(/^[\d\s]+[,.][\d]{2,3}$/);
        if (numMatch) {
          const parsed = parseNumber(item.str);
          if (parsed !== null && parsed > 50) {
            euroAmounts.push(parsed);
          }
        }
      }
    }
    
    // In Dental format: [Prix unitaire, Montant HT, Montant TTC]
    // We want Montant HT (second-to-last or first if only one)
    let montantHT = 0;
    if (euroAmounts.length >= 2) {
      montantHT = euroAmounts[euroAmounts.length - 2]; // Second to last = HT
    } else if (euroAmounts.length === 1) {
      montantHT = euroAmounts[0];
    }
    
    // 7. Clean up designation
    const designation = descriptionParts
      .join(' ')
      .replace(/\s+/g, ' ')
      .replace(/\d+[,.]?\d*\s*$/, '') // Remove trailing quantity numbers
      .trim();
    
    // Only add if we have valid data
    if (designation && montantHT > 0) {
      products.push({
        reference,
        designation,
        quantite,
        prixUnitaire: quantite > 0 ? Math.round((montantHT / quantite) * 100) / 100 : null,
        totalHT: montantHT,
      });
      
      console.log('[Dental Product]', { reference, designation, quantite, totalHT: montantHT, euroAmounts });
    }
  }
  
  return products;
}

// ========== DENTAL MULTI-LINE PRODUCT EXTRACTION ==========
// Dental PDFs have multi-line descriptions that continue AFTER the main product line
// until we hit a stop marker (Sous-total, new section, new product, footer)

function parseDentalProductsWithMultilineDescriptions(text: string): PDFProductLine[] {
  const products: PDFProductLine[] = [];
  const lines = text.split(/\r?\n/).map(l => l.trim());
  
  // Stop markers that end a product description
  const stopMarkers = /^(Sous-total|Subtotal|Informatique|Livraison|Formation|Compte\s+bancaire|Page\s+\d+|Montant\s+hors\s+taxes|Untaxed\s+Amount|Amount\s+Excl|Amount\s+Incl|Taxes|Total\s+[\d])/i;
  const productLinePattern = /(\d+[,.]?\d*)\s*Unit[eé]?\(?s?\)?/i;
  const euroAmountPattern = /([\d\s]+[,.][\d]{2,3})\s*€/g;
  
  console.log('[Dental Multi-line Parser] Processing', lines.length, 'lines');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip headers, totals, empty lines
    if (/^(Description|Quantit[eé]|Prix|Sous-total|Subtotal|Montant|Taxes|Total|Amount|Quantity|Unit\s*Price|3D\s*DENTAL)/i.test(line)) continue;
    if (!line || line.length < 5) continue;
    
    // Check if this is a product line (has quantity pattern "X,XXX Unité(s)")
    const qtyMatch = line.match(productLinePattern);
    if (!qtyMatch) continue;
    
    // Extract amounts from the line
    const amounts = [...line.matchAll(euroAmountPattern)].map(m => parseNumber(m[1]));
    const validAmounts = amounts.filter(a => a !== null && a > 0) as number[];
    
    if (validAmounts.length < 1) continue;
    
    // Extract quantity
    const qty = Math.round(parseFloat(qtyMatch[1].replace(',', '.'))) || 1;
    
    // Montant HT is typically second-to-last (before TTC)
    const totalHT = validAmounts.length >= 2 
      ? validAmounts[validAmounts.length - 2] 
      : validAmounts[0];
    
    // Extract initial description (before quantity marker)
    const qtyIndex = line.indexOf(qtyMatch[0]);
    let descriptionLine = line.substring(0, qtyIndex).trim();
    
    // Check for reference pattern at start: [REF-XXX] or [xxx yyy zzz]
    let reference: string | null = null;
    const refMatch = descriptionLine.match(/^\[([^\]]+)\]\s*/);
    if (refMatch) {
      reference = refMatch[1];
      descriptionLine = descriptionLine.substring(refMatch[0].length).trim();
    }
    
    // Collect multi-line description
    // Scan backwards for title lines preceding this product
    const titleLines: string[] = [];
    for (let k = i - 1; k >= 0; k--) {
      const prevLine = lines[k];
      if (!prevLine || prevLine.length < 3) break;
      if (stopMarkers.test(prevLine)) break;
      if (productLinePattern.test(prevLine)) break;
      if (/^(Description|Quantit[eé]|Prix|Amount|Quantity|Unit\s*Price|Taxes|3D\s*DENTAL|Sous-total|Subtotal)/i.test(prevLine)) break;
      // Skip column header fragments
      if (/^(Montant|HT|TTC|Rem\.?%?|Prix\s*unitaire|Excl|Incl|Tax)/i.test(prevLine)) break;
      // Stop if line is mostly amounts (multiple euro values)
      const amountMatches = prevLine.match(euroAmountPattern);
      if (amountMatches && amountMatches.length > 1) break;
      // Skip if this title is already contained in the main description line (dedup)
      if (descriptionLine.toLowerCase().includes(prevLine.toLowerCase())) continue;
      titleLines.unshift(prevLine);
    }

    // Deduplicate: if first title entry is substring of second, remove it
    if (titleLines.length > 0 && descriptionLine.toLowerCase().includes(titleLines[titleLines.length - 1].toLowerCase())) {
      titleLines.pop();
    }
    const descriptionParts = [...titleLines, descriptionLine];
    
    // Scan following lines until stop marker
    let emptyLineCount = 0;
    for (let j = i + 1; j < lines.length; j++) {
      const nextLine = lines[j];
      
      // Handle empty lines - allow a few but stop at consecutive empties
      if (!nextLine || nextLine.length < 2) {
        emptyLineCount++;
        if (emptyLineCount >= 2) break;
        continue;
      }
      emptyLineCount = 0;
      
      // Stop conditions
      if (stopMarkers.test(nextLine)) break;
      if (productLinePattern.test(nextLine)) break; // New product
      if (/^\[.*?\].*Unit[eé]?/i.test(nextLine)) break; // New product with ref
      
      // Skip metadata/footer lines
      if (/^(SASU|IBAN|BIC|TVA|TEL|Capital|SIRET|RCS|Code\s*APE)/i.test(nextLine)) break;
      
      // Stop on boilerplate notes, warranty text, service details
      if (/^(Un ordinateur|Mises à jour|Merci de|Service support|MERCI DE|support@)/i.test(nextLine)) break;
      // Stop on seller address block
      if (/^(3D\s*DENTAL\s*STORE|75\s*route|76000|France$)/i.test(nextLine)) break;
      // Stop on bullet point service details
      if (/^•/.test(nextLine)) break;
      
      // Add to description
      descriptionParts.push(nextLine);
    }
    
    // Build final designation with reference prefix
    const fullDescription = descriptionParts.join('\n').trim();
    const designation = reference 
      ? `[${reference}] ${fullDescription}` 
      : fullDescription;
    
    console.log('[Dental Parser] Product:', designation.substring(0, 80), '| Qty:', qty, '| HT:', totalHT);
    
    if (designation && totalHT > 0) {
      products.push({
        reference,
        designation,
        quantite: qty,
        prixUnitaire: qty > 0 ? Math.round((totalHT / qty) * 100) / 100 : null,
        totalHT,
      });
    }
  }
  
  return products;
}

// ========== DENTAL (3D DENTAL STORE) PARSER ==========
function parseDentalText(text: string, items?: TextItemWithCoords[]): Partial<PDFParseResult> {
  const result: Partial<PDFParseResult> = {
    source: 'dental',
    lignes: [],
    client: { prenom: null, nom: null, adresse: null, codePostal: null, ville: null, telephone: null, email: null },
    devis: { reference: null, date: null, validite: null, numeroClient: null },
    commercial: { nom: null, email: null },
    location: { duree: null, loyerMensuel: null, montantTotal: null },
    totaux: { totalHT: null, tva: null, totalTTC: null },
  };

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  // === USE TEXT-BASED MULTI-LINE EXTRACTION (more reliable for descriptions) ===
  console.log('[Dental Parser] Using multi-line text extraction');
  result.lignes = parseDentalProductsWithMultilineDescriptions(text);
  
  // Fallback to column-based if text extraction didn't find products
  if (result.lignes!.length === 0 && items && items.length > 0) {
    console.log('[Dental Parser] Multi-line extraction found no products, trying column-based fallback');
    result.lignes = extractDentalProducts(items);
  }

  // === MÉTADONNÉES DEVIS ===
  
  // Référence devis : "Devis # SO74920" or "SO74920"
  const refMatch = text.match(/(?:Devis\s*#?\s*)?(SO\d+)/i);
  if (refMatch) result.devis!.reference = refMatch[1];
  
  // Date : "Date du devis : 10/12/2025" or English "Quotation Date 02/25/2026"
  const dateMatch = text.match(/Date\s+du\s+devis\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i)
    || text.match(/Quotation\s+Date\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (dateMatch) result.devis!.date = dateMatch[1];
  
  // Échéance : "Echéance : 19/12/2025" or English "Expiration 03/27/2026"
  const echeanceMatch = text.match(/[EÉ]ch[eé]ance\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i)
    || text.match(/Expiration\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (echeanceMatch) result.devis!.validite = echeanceMatch[1];
  
  // Référence client : "Référence Client : 6500" or English "Reference : 55177"
  const clientNumMatch = text.match(/R[eé]f[eé]rence\s+Client\s*:?\s*(\d+)/i)
    || text.match(/Customer\s+Reference\s*:?\s*(\d+)/i)
    || text.match(/Reference\s*:\s*(\d+)/i);
  if (clientNumMatch) result.devis!.numeroClient = clientNumMatch[1];
  
  // Commercial : "Vendeur : Ambre-Lise SAVOÏA" or English "Salesperson Ambre-Lise SAVOÏA"
  const vendeurMatch = text.match(/Vendeur\s*:?\s*([A-Za-zÀ-ÿ\s\-']+?)(?=\s*(?:Référence|Date|Devis|$|\n))/i)
    || text.match(/Salesperson\s*:?\s*([A-Za-zÀ-ÿ\s\-']+?)(?=\s*(?:Reference|Quotation|Expiration|Customer|$|\n))/i);
  if (vendeurMatch) result.commercial!.nom = vendeurMatch[1].trim();

  // === INFORMATIONS CLIENT ===
  
  // Look for client name block - typically "CABINET DENTAIRE DR..." or company name in uppercase
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip 3D DENTAL STORE header and metadata lines
    if (/3D\s*DENTAL\s*STORE|Devis\s*#|Date\s+du\s+devis|Vendeur|Description|Quantité|Montant|Quotation\s+Date|Salesperson|Customer|Expiration|Untaxed/i.test(line)) continue;
    
    // Client name pattern: all uppercase, contains typical client keywords
    if (!result.client!.nom && /^(CABINET|DR\b|DOCTEUR|CLINIQUE|CENTRE|SELARL|SCP|SCM)/i.test(line)) {
      result.client!.nom = line.trim();
      
      // Look for address in following lines
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j];
        
        // Address line (starts with number or contains street keywords)
        if (!result.client!.adresse && /^\d+\s+|rue|avenue|boulevard|place|chemin|cours/i.test(nextLine)) {
          result.client!.adresse = nextLine.trim();
          continue;
        }
        
        // Postal code + City
        const cpMatch = nextLine.match(/^(\d{5})\s+(.+?)(?:\s+France)?$/i);
        if (cpMatch) {
          result.client!.codePostal = cpMatch[1];
          result.client!.ville = cleanCityName(cpMatch[2]);
          break;
        }
      }
      break;
    }
  }

  // Fallback: client name not found with CABINET pattern — look for a name block
  // typically between the 3D DENTAL STORE address block and "Customer"/"Reference" lines
  if (!result.client!.nom) {
    let skipUntilFrance = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect seller header — skip its entire address block
      if (/3D\s*DENTAL\s*STORE/i.test(line)) {
        skipUntilFrance = true;
        continue;
      }
      if (skipUntilFrance) {
        if (/^France$/i.test(line.trim())) {
          skipUntilFrance = false;
        }
        continue;
      }

      // Skip known headers, metadata, product lines, amounts
      if (/3D\s*DENTAL|Devis|Date|Vendeur|Salesperson|Customer\s+Reference|Your\s+Reference|Reference|Description|Quantit[eé]|Quantity|Unit\s*Price|Montant|Amount|Taxes|Total|Untaxed|Expiration|Quotation|Unit[eé]?|^\d+[,.]?\d*\s*€|^\[/i.test(line)) continue;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(line)) continue; // date-only lines
      if (/^\d+$/.test(line)) continue; // number-only lines
      if (line.length < 3 || line.length > 80) continue;
      
      // Candidate: a name-like line (contains letters, not all digits) followed by an address
      const nextIdx = i + 1;
      if (nextIdx < lines.length && /^\d+\s+|rue|avenue|boulevard|place|chemin|cours/i.test(lines[nextIdx])) {
        result.client!.nom = line.trim();
        result.client!.adresse = lines[nextIdx].trim();
        
        // Look for postal code + city after address
        for (let j = nextIdx + 1; j < Math.min(nextIdx + 4, lines.length); j++) {
          const cpMatch = lines[j].match(/^(\d{5})\s+(.+?)(?:\s+France)?$/i);
          if (cpMatch) {
            result.client!.codePostal = cpMatch[1];
            result.client!.ville = cleanCityName(cpMatch[2]);
            break;
          }
        }
        break;
      }
    }
  }

  // === TOTAUX ===
  
  // Look for total amounts at the end of the document
  // "Montant hors taxes 12 666,00 €"
  // "Taxes 2 533,20 €"
  // "Total 15 199,20 €"
  
  const totalHTMatch = text.match(/Montant\s+hors\s+taxes[\s\n]*([\d\s]+[,.][\d]{2})\s*€/i)
    || text.match(/Untaxed\s+Amount[\s\n]*([\d\s]+[,.][\d]{2})\s*€/i);
  if (totalHTMatch) {
    result.totaux!.totalHT = parseNumber(totalHTMatch[1]);
  }
  
  // Taxes (TVA)
  const taxesMatch = text.match(/^Taxes[\s\n]*([\d\s]+[,.][\d]{2})\s*€/im);
  if (taxesMatch) {
    result.totaux!.tva = parseNumber(taxesMatch[1]);
  }
  
  // Total TTC - careful not to match "Montant TTC" column headers
  // Look for standalone "Total" followed by amount
  const totalTTCMatch = text.match(/^Total[\s\n]+([\d\s]+[,.][\d]{2})\s*€/im);
  if (totalTTCMatch) {
    result.totaux!.totalTTC = parseNumber(totalTTCMatch[1]);
  }
  
  // Fallback: Calculate from extracted lines if totals not found
  if (result.totaux!.totalHT === null && result.lignes!.length > 0) {
    const sumHT = result.lignes!.reduce((s, l) => s + (l.totalHT || 0), 0);
    result.totaux!.totalHT = Math.round(sumHT * 100) / 100;
    result.totaux!.tva = Math.round(sumHT * 0.20 * 100) / 100;
    result.totaux!.totalTTC = Math.round(sumHT * 1.20 * 100) / 100;
  }

  console.log('[Dental Parser] Extracted:', {
    devis: result.devis,
    client: result.client,
    commercial: result.commercial,
    lignesCount: result.lignes?.length,
    totaux: result.totaux,
  });

  return result;
}

// Extract text using pdfjs-dist legacy build (v3.x - no top-level await)
async function extractTextWithPdfJs(file: File): Promise<ExtractedTextResult> {
  const emptyResult: ExtractedTextResult = { text: '', items: [] };
  
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');

    // Worker
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/legacy/build/pdf.worker.min.js',
      import.meta.url
    ).toString();

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const lines: string[] = [];
    const allItems: TextItemWithCoords[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      const items = (textContent.items as unknown[])
        .map((it) => {
          const item = it as { str?: string; transform?: number[] };
          const str = item.str ?? '';
          const x = item.transform?.[4] ?? 0;
          const y = item.transform?.[5] ?? 0;
          return { str, x, y };
        })
        .filter((it) => it.str.trim().length > 0);
      
      // Store raw items with coordinates for column-based parsing
      allItems.push(...items);
      
      // Sort for line-based extraction
      const sortedItems = [...items].sort((a, b) => (b.y - a.y) || (a.x - b.x));

      // group into lines by y proximity
      let currentY: number | null = null;
      let currentLine: string[] = [];

      const flush = () => {
        const joined = currentLine.join(' ').replace(/\s+/g, ' ').trim();
        if (joined) lines.push(joined);
        currentLine = [];
      };

      for (const it of sortedItems) {
        if (currentY === null) {
          currentY = it.y;
          currentLine.push(it.str);
          continue;
        }

        if (Math.abs(it.y - currentY) > 2) {
          flush();
          currentY = it.y;
        }

        currentLine.push(it.str);
      }

      flush();
    }

    return { text: lines.join('\n'), items: allItems };
  } catch (error) {
    console.error('PDF.js extraction failed:', error);
    return emptyResult;
  }
}

export async function parsePDF(file: File): Promise<PDFParseResult> {
  // Detect source from filename first
  let source = detectSourceFromFilename(file.name);
  
  // Extract text and raw items using pdfjs-dist
  const { text: rawText, items } = await extractTextWithPdfJs(file);
  
  // If source unknown from filename, try from text content
  if (source === 'unknown' && rawText.length > 20) {
    source = detectSourceFromText(rawText);
  }
  
  // Create base result
  const baseResult: PDFParseResult = {
    source,
    client: { prenom: null, nom: null, adresse: null, codePostal: null, ville: null, telephone: null, email: null },
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
    } else if (source === 'dental') {
      // Pass items for column-based extraction
      parsedData = parseDentalText(rawText, items);
    }
    
    console.log('PDF Parser - Parsed data:', parsedData);
    
    // Split client name into prenom/nom if not already done
    if (parsedData.client && parsedData.client.nom && !parsedData.client.prenom) {
      const { prenom, nom } = splitClientName(parsedData.client.nom);
      parsedData.client.prenom = prenom;
      parsedData.client.nom = nom;
    }
    
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

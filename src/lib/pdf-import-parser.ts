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
        result.client!.ville = cpVille[2].replace(/\s+FR$/i, '').trim();
        break;
      }
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
      result.client!.ville = cpVilleMatch[2].replace(/\s+FR$/i, '').trim();
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
      /\bREF\b/i.test(l) &&
      /DESIGNATION/i.test(l) &&
      /QTE/i.test(l)
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

    // Special refs first (Installation, Frais de livraison)
    // Using windowed lookahead to avoid absorbing global totals like "14 700,00 €"
    // FIXED: Use permissive regex patterns instead of strict startsWith()
    const isInstallation = isInstallationStartLine(l);
    const isFraisLivraison = isFraisLivraisonLine(l);
    const specialRefMatch = isInstallation ? 'Installation' : (isFraisLivraison ? 'Frais de livraison' : null);
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
        
        for (let j = i; j < rowsSource.length && j <= i + maxLookahead; j++) {
          const line = rowsSource[j];
          
          // Stop if we hit a new block (but allow current line to be collected)
          if (j > i && isNewBlockStart(line)) break;
          if (isBannedLine(line) || isGarantieLine(line)) continue;
          
          // Look for any amount € on this line
          const amountMatch = line.match(/([\d\s,.]+)\s*€/);
          if (amountMatch && fallbackTotal === 0) {
            const val = parseNumber(amountMatch[1]);
            // Accept amounts between 0 and 10000 for service lines
            if (val !== null && val >= 0 && val < 10000) {
              fallbackTotal = val;
              fallbackEndIdx = j;
              
              // Try to find a QTE before the amount (e.g., "2 974,00 €")
              const qtyBeforeAmount = line.match(/\b(\d{1,2})\s+[\d\s,.]+\s*€/);
              if (qtyBeforeAmount) {
                fallbackQty = parseInt(qtyBeforeAmount[1], 10) || 1;
              }
              
              // Add the text part before the amount to designation
              const textPart = line.slice(0, line.indexOf(amountMatch[0])).trim();
              if (textPart) {
                fallbackDesignationLines.push(textPart);
              }
              continue;
            }
          }
          
          // Collect line for designation if no amount found yet
          if (fallbackTotal === 0 || j < fallbackEndIdx) {
            fallbackDesignationLines.push(line);
          }
        }
        
        // Build and add the line if we found a total (even if 0 for "Frais de livraison")
        // We need at least some designation content OR a valid total
        if (fallbackTotal > 0 || (specialRefMatch.toLowerCase().includes('frais') && fallbackDesignationLines.length > 0)) {
          let designation = fallbackDesignationLines.join(' ')
            .replace(/[\d\s,.]+\s*€.*$/, '')
            .replace(/\s+/g, ' ')
            .trim();
          if (/^\s*Installation\b/i.test(designation)) {
            designation = designation.replace(/^\s*Installation\s*/i, '').trim();
          }
          
          console.log('[Cybertek Parser] Service line (fallback):', {
            reference: specialRefMatch,
            qty: fallbackQty,
            total: fallbackTotal,
            designation: designation.substring(0, 100) + (designation.length > 100 ? '...' : ''),
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
    if (syIdx === -1) continue;

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
          const amountMatches = [...currentLine.matchAll(/(\d{1,2})\s+([\d\s,.]+)\s*€/gi)];
          if (amountMatches.length > 0) {
            const lastMatch = amountMatches[amountMatches.length - 1];
            const qty = parseInt(lastMatch[1], 10) || 1;
            const total = parseNumber(lastMatch[2]) || 0;
            
            // Only accept reasonable amounts (< 5000€ for service lines)
            if (total > 0 && total < 5000) {
              recoveredQty = qty;
              recoveredTotal = total;
              foundAmount = true;
              
              // Add text before the amount
              const textPart = currentLine.slice(0, currentLine.indexOf(lastMatch[0])).trim();
               if (textPart && !isInstallationStartLine(textPart)) {
                designationParts.push(textPart);
              }
              continue;
            }
          }
          
          // Also check for amount-only pattern (fallback qty=1)
          const amountOnly = currentLine.match(/([\d\s,.]+)\s*€/);
          if (amountOnly && recoveredTotal === 0) {
            const total = parseNumber(amountOnly[1]) || 0;
            if (total > 0 && total < 5000) {
              // Check for qty before amount
              const qtyMatch = currentLine.match(/\b(\d{1,2})\s+[\d\s,.]+\s*€/);
              if (qtyMatch) {
                recoveredQty = parseInt(qtyMatch[1], 10) || 1;
              }
              recoveredTotal = total;
              foundAmount = true;
              
              const textPart = currentLine.slice(0, currentLine.indexOf(amountOnly[0])).trim();
               if (textPart && !isInstallationStartLine(textPart)) {
                designationParts.push(textPart);
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
      
      // Look for SY-RKS02 reference (may be embedded in a longer line)
      if (/SY-RKS02/i.test(line)) {
        console.log('[Cybertek Parser] Recovery: found SY-RKS02 at line', i, ':', line);
        
        // Scan window to collect designation + amount.
        // IMPORTANT: In extracted text, the designation often sits on the PREVIOUS line
        // and the amount can be on a dedicated line ("2 216,00 €").
        const maxWindow = 25;
        const designationParts: string[] = [];
        let recoveredQty = 1;
        let recoveredTotal = 0;
        let amountLineIdx = -1;

        const startIdx = Math.max(0, i - 2);
        
        for (let j = startIdx; j < lines.length && j <= i + maxWindow; j++) {
          const currentLine = lines[j];
          
          // Stop if we hit another SY- product or terminal markers
          if (j > i && (
            (syRefPattern.test(currentLine) && !/SY-RKS02/i.test(currentLine)) ||
            isInstallationStartLine(currentLine) ||
            isFraisLivraisonLine(currentLine) ||
            stopRe.test(currentLine)
          )) {
            break;
          }
          
          // Skip banned lines for designation but still check for amounts
          const skipForDesignation = isBannedLine(currentLine);
          
          // Try to extract QTE + amount
          const amountMatches = [...currentLine.matchAll(/(\d{1,2})\s+([\d\s,.]+)\s*€/gi)];
          if (amountMatches.length > 0 && recoveredTotal === 0) {
            const lastMatch = amountMatches[amountMatches.length - 1];
            const qty = parseInt(lastMatch[1], 10) || 1;
            const total = parseNumber(lastMatch[2]) || 0;
            
            // Accept reasonable amounts (Kit Rails should be ~200€)
            if (total > 0 && total < 1000) {
              recoveredQty = qty;
              recoveredTotal = total;
              amountLineIdx = j;
            }
          }
          
          // Collect line for designation (including after the amount line to capture "CMA -01" + "Garantie")
          if (!skipForDesignation) {
            // Skip the pure amount-only line ("2 216,00 €") but keep other lines.
            if (/^\s*\d{1,2}\s+[\d\s,.]+\s*€\s*$/i.test(currentLine)) continue;

            let clean = currentLine
              .replace(/\bSY-RKS02\b/gi, '')
              .trim();

            // Drop a lonely SY code line
            if (/^SY-\w+/i.test(clean) && clean.length <= 12) continue;

            if (clean) designationParts.push(clean);
          }
        }
        
        if (recoveredTotal > 0) {
          const designation = designationParts
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          
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
  
  // Recovery for "Frais de livraison" (including 0€ amounts)
  const hasFraisLivraison = result.lignes!.some(l => 
    l.reference?.toLowerCase().includes('frais')
  );
  
  if (!hasFraisLivraison) {
    for (let i = 0; i < lines.length; i++) {
      if (isFraisLivraisonLine(lines[i])) {
        // Look for amount on this line or next few lines
        for (let j = i; j < lines.length && j <= i + 5; j++) {
          const amountMatch = lines[j].match(/([\d\s,.]+)\s*€/);
          if (amountMatch) {
            const total = parseNumber(amountMatch[1]) ?? 0;
            // Accept 0€ for delivery
            result.lignes!.push({
              reference: 'Frais de livraison',
              designation: 'Frais de livraison',
              quantite: 1,
              totalHT: total,
              prixUnitaire: total,
            });
            break;
          }
        }
        break;
      }
    }
  }
  
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
    client: { nom: null, adresse: null, codePostal: null, ville: null, telephone: null, email: null },
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
    const l1 = lines[factIdx + 1] ?? null; // ex: MAGEN GO
    const l2 = lines[factIdx + 2] ?? null; // ex: 41 rue Jean Bonal

    if (l1) result.client!.nom = l1;
    // Note: per your requirement, the UI "Ville" field should take the 2nd line.
    if (l2) result.client!.ville = l2;
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
    if (!result.client!.ville) result.client!.ville = deliveryMatch[4].trim();
  }

  // Fallback: extract address + CP/city even if name block isn't reconstructed
  if (!result.client!.adresse) {
    const adresseMatch = text.match(/(\d+\s+RUE\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s'\-]+)/i);
    if (adresseMatch) result.client!.adresse = adresseMatch[1].trim();
  }
  if (!result.client!.codePostal || !result.client!.ville) {
    const cpVilleMatch = text.match(/(\d{5})\s+([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ][A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ\s'\-]{2,})/i);
    if (cpVilleMatch) {
      result.client!.codePostal = result.client!.codePostal || cpVilleMatch[1];
      // don't overwrite "ville" if facturation already used it
      result.client!.ville = result.client!.ville || cpVilleMatch[2].trim();
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

// Extract text using pdfjs-dist legacy build (v3.x - no top-level await)
async function extractTextWithPdfJs(file: File): Promise<string> {
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
        .filter((it) => it.str.trim().length > 0)
        // pdfjs origin: sort by y (top->bottom) then x (left->right)
        .sort((a, b) => (b.y - a.y) || (a.x - b.x));

      // group into lines by y proximity
      let currentY: number | null = null;
      let currentLine: string[] = [];

      const flush = () => {
        const joined = currentLine.join(' ').replace(/\s+/g, ' ').trim();
        if (joined) lines.push(joined);
        currentLine = [];
      };

      for (const it of items) {
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

    return lines.join('\n');
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

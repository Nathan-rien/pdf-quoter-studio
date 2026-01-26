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

  const stopRe = /^(Offre\s+Locative|TOTAL\s*HT|Total\s*HT|TVA\s*20|Total\s*TTC|CONDITIONS)/i;
  const rowsSource = tableStartIdx !== -1 ? lines.slice(tableStartIdx + 1) : lines;

  // Pattern for the end of a product row: QTE followed by Total HT amount
  const rowEndRegex = new RegExp(`(\\d+)\\s+${money}\\s*€\\s*$`, 'i');
  
  // Pattern for SY- prefix refs (start of a new product block)
  const syRefPattern = /^SY-[A-Z0-9-]+$/i;
  
  // Pattern for the short ref (2nd line, without SY- prefix)
  const shortRefPattern = /^[A-Z0-9]+-[A-Z0-9-]+$|^[A-Z0-9]{4,}$/i;
  
  // Special refs without dash
  // Special refs without dash - including service/prestation lines
  const specialRefs = ['Installation', 'Frais de livraison', 'Prestation'];

  const isBannedLine = (line: string) =>
    /(ADRESSE\s+DE\s+LIVRAISON|ADRESSE\s+DE\s+FACTURATION|SIEGE\s+SOCIAL|AU\s+CAPITAL|GROUPE\s+KEDGE|N°\s*client)/i.test(line);

  const isGarantieLine = (line: string) => /^Garantie\s*:/i.test(line);

  const findSyRefIndexBackwards = (fromIdx: number) => {
    for (let j = fromIdx; j >= 0 && j >= fromIdx - 8; j--) {
      const v = rowsSource[j];
      if (syRefPattern.test(v)) return j;
      if (stopRe.test(v)) break;
    }
    return -1;
  };

  const findShortRefForward = (fromIdx: number) => {
    for (let k = fromIdx + 1; k < rowsSource.length && k <= fromIdx + 6; k++) {
      const v = rowsSource[k];
      if (stopRe.test(v) || syRefPattern.test(v)) break;
      if (isBannedLine(v) || isGarantieLine(v)) continue;
      if (shortRefPattern.test(v) && !/^SY-/i.test(v)) return v;
    }
    return null;
  };

  // Cybertek: we parse rows by detecting the *end* of a product line ("QTE + Total HT")
  // then we look around it to recover:
  // - REF: the short ref line (without SY-) that often comes AFTER the end line
  // - DESIGNATION: lines around the SY- ref and the end line
  for (let i = 0; i < rowsSource.length; i++) {
    const l = rowsSource[i];

    if (stopRe.test(l)) break;
    if (/Dont\s+eco-?taxe/i.test(l)) continue;
    if (isBannedLine(l) || isGarantieLine(l)) continue;

    // Special refs first (Installation, Frais de livraison, Prestation)
    const specialRefMatch = specialRefs.find((sr) => l.toLowerCase().startsWith(sr.toLowerCase()));
    if (specialRefMatch) {
      let buffer = l;
      let j = i;
      
      // Improved pattern: strictly match "QTE (1-2 digits) + Amount + €" at the END
      // This avoids capturing numbers like "16Go", "2x", "12 disques" within the description
      // \b ensures we match a word boundary (not part of "16Go")
      // (\d{1,2}) limits quantity to 1-2 digits
      const prestationEndRegex = /(?:^|\s)(\d{1,2})\s+([\d\s,.]+)\s*€\s*$/;
      
      while (j < rowsSource.length - 1) {
        const endMatch = buffer.match(prestationEndRegex);
        if (endMatch) {
          const quantite = parseInt(endMatch[1], 10) || 1;
          const totalHT = parseNumber(endMatch[2]) || 0;
          const leftPart = buffer.slice(0, buffer.lastIndexOf(endMatch[0])).trim();
          const designation = leftPart.replace(new RegExp(`^${specialRefMatch}`, 'i'), '').trim();

          result.lignes!.push({
            reference: specialRefMatch,
            designation,
            quantite,
            totalHT,
            prixUnitaire: quantite > 0 ? Math.round((totalHT / quantite) * 100) / 100 : null,
          });

          i = j;
          break;
        }
        j++;
        if (stopRe.test(rowsSource[j])) break;
        buffer = buffer + ' ' + rowsSource[j];
      }
      continue;
    }

    // Standard products: detect end of row
    const endMatch = l.match(rowEndRegex);
    if (!endMatch) continue;

    const syIdx = findSyRefIndexBackwards(i);
    if (syIdx === -1) continue;

    const quantite = parseInt(endMatch[1], 10) || 1;
    const totalHT = parseNumber(endMatch[2]) || 0;

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
        const leftPart = v.slice(0, v.lastIndexOf(endMatch[0])).trim();
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

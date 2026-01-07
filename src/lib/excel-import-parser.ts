import * as XLSX from 'xlsx';
import { 
  InvestRow, 
  DevisRow, 
  BaseTauxRow, 
  OptionsServiceRow,
  REQUIRED_EXCEL_SHEETS,
  RequiredExcelSheet
} from '@/types/quote';
import { FicheContratData, MatriceRow } from '@/stores/dataEditorStore';

// === NOMS D'ONGLETS CONTRACTUELS (avec espaces finaux) ===
const SHEET_NAME_MAP: Record<string, string> = {
  'Matrice': 'matrice',
  'Fiche Contrat': 'ficheContrat',
  'invest ': 'invest',           // ESPACE FINAL
  'Devis': 'devis',
  'Options services ': 'optionsServices', // ESPACE FINAL
  'Base Taux': 'baseTaux',
};

// === RÉSULTAT DU PARSING ===
export interface ParsedExcelData {
  matrice: MatriceRow[];
  ficheContrat: Partial<FicheContratData>;
  invest: InvestRow[];
  devis: DevisRow[];
  optionsServices: OptionsServiceRow[];
  baseTaux: BaseTauxRow[];
}

export interface ExcelParseError {
  sheet: string;
  message: string;
  row?: number;
  column?: string;
}

export interface ExcelParseResult {
  success: boolean;
  data: ParsedExcelData | null;
  errors: ExcelParseError[];
  warnings: ExcelParseError[];
  parsedSheets: string[];
  missingSheets: string[];
  fileName: string;
}

// === HELPERS ===
function extractString(cell: XLSX.CellObject | undefined): string | null {
  if (!cell) return null;
  if (cell.t === 's') return cell.v as string;
  if (cell.t === 'n') return String(cell.v);
  if (cell.w) return cell.w;
  return cell.v ? String(cell.v) : null;
}

function extractNumber(cell: XLSX.CellObject | undefined): number | null {
  if (!cell) return null;
  if (cell.t === 'n') return cell.v as number;
  if (cell.t === 's') {
    const parsed = parseFloat((cell.v as string).replace(',', '.').replace(/\s/g, ''));
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

function getCell(sheet: XLSX.WorkSheet, col: string, row: number): XLSX.CellObject | undefined {
  return sheet[`${col}${row}`];
}

// === PARSERS PAR ONGLET ===

function parseInvestSheet(sheet: XLSX.WorkSheet): { rows: InvestRow[]; errors: ExcelParseError[] } {
  const rows: InvestRow[] = [];
  const errors: ExcelParseError[] = [];
  
  // Chercher la ligne d'en-tête "Matériel 2025" dans la colonne B
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  let headerRow = -1;
  
  for (let r = range.s.r; r <= range.e.r; r++) {
    const cellValue = extractString(getCell(sheet, 'B', r + 1));
    if (cellValue && cellValue.includes('Matériel')) {
      headerRow = r + 1;
      break;
    }
  }
  
  if (headerRow === -1) {
    errors.push({
      sheet: 'invest ',
      message: 'En-tête "Matériel 2025" non trouvée dans la colonne B',
    });
    return { rows, errors };
  }
  
  // Parser les données à partir de headerRow + 1
  for (let r = headerRow + 1; r <= range.e.r + 1; r++) {
    const designation = extractString(getCell(sheet, 'B', r));
    const nb = extractNumber(getCell(sheet, 'C', r));
    const vun = extractNumber(getCell(sheet, 'D', r));
    const vtn = extractNumber(getCell(sheet, 'E', r));
    
    // Ignorer les lignes complètement vides
    if (!designation && nb === null && vun === null && vtn === null) {
      continue;
    }
    
    rows.push({
      designation,
      nb,
      vun,
      vtn,
      rawRowIndex: r,
    });
  }
  
  return { rows, errors };
}

function parseDevisSheet(sheet: XLSX.WorkSheet): { rows: DevisRow[]; errors: ExcelParseError[] } {
  const rows: DevisRow[] = [];
  const errors: ExcelParseError[] = [];
  
  // L'en-tête est à la ligne 22 (contractuel)
  const HEADER_ROW = 22;
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  
  // Parser à partir de la ligne 23
  for (let r = HEADER_ROW + 1; r <= range.e.r + 1; r++) {
    const ref = extractString(getCell(sheet, 'B', r));
    const designation = extractString(getCell(sheet, 'C', r));
    
    // Ignorer les lignes sans ref et sans designation
    if (!ref && !designation) continue;
    
    rows.push({
      ref,
      designation,
      prixUnitaireVenteHT: extractNumber(getCell(sheet, 'H', r)),
      qte: extractNumber(getCell(sheet, 'I', r)),
      prixTotalVenteHT: extractNumber(getCell(sheet, 'J', r)),
      pxAchat: extractNumber(getCell(sheet, 'K', r)),
      grossiste: extractString(getCell(sheet, 'L', r)),
      prixVente: extractNumber(getCell(sheet, 'M', r)),
      marge: extractNumber(getCell(sheet, 'N', r)),
      refFournisseur: extractString(getCell(sheet, 'O', r)),
    });
  }
  
  return { rows, errors };
}

function parseBaseTauxSheet(sheet: XLSX.WorkSheet): { rows: BaseTauxRow[]; errors: ExcelParseError[] } {
  const rows: BaseTauxRow[] = [];
  const errors: ExcelParseError[] = [];
  
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  
  // Chercher l'en-tête avec "Partenaire"
  let headerRow = -1;
  for (let r = range.s.r; r <= Math.min(range.e.r, 10); r++) {
    const cellValue = extractString(getCell(sheet, 'A', r + 1));
    if (cellValue && cellValue.toLowerCase().includes('partenaire')) {
      headerRow = r + 1;
      break;
    }
  }
  
  if (headerRow === -1) {
    // Essayer de parser depuis la ligne 1 si pas d'en-tête
    headerRow = 1;
  }
  
  // Parser les données
  for (let r = headerRow + 1; r <= range.e.r + 1; r++) {
    const partenaire = extractString(getCell(sheet, 'A', r));
    
    // Ignorer les lignes sans partenaire
    if (!partenaire || partenaire.trim() === '') continue;
    
    rows.push({
      partenaire: partenaire.trim(),
      montantMin: extractNumber(getCell(sheet, 'B', r)) ?? 0,
      montantMax: extractNumber(getCell(sheet, 'C', r)),
      dureeLocation: extractNumber(getCell(sheet, 'D', r)) ?? 0,
      taux: extractNumber(getCell(sheet, 'E', r)) ?? 0,
    });
  }
  
  return { rows, errors };
}

function parseOptionsServicesSheet(sheet: XLSX.WorkSheet): { rows: OptionsServiceRow[]; errors: ExcelParseError[] } {
  const rows: OptionsServiceRow[] = [];
  const errors: ExcelParseError[] = [];
  
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  
  // Parser toutes les lignes avec données
  for (let r = range.s.r + 1; r <= range.e.r + 1; r++) {
    const name = extractString(getCell(sheet, 'A', r));
    
    if (!name || name.trim() === '') continue;
    
    rows.push({
      id: `opt-${r}`,
      name: name.trim(),
      description: extractString(getCell(sheet, 'B', r)),
      selected: false,
      category: extractString(getCell(sheet, 'C', r)),
      price: extractNumber(getCell(sheet, 'D', r)) ?? undefined,
    });
  }
  
  return { rows, errors };
}

function parseFicheContratSheet(sheet: XLSX.WorkSheet): { data: Partial<FicheContratData>; errors: ExcelParseError[] } {
  const data: Partial<FicheContratData> = {};
  const errors: ExcelParseError[] = [];
  
  // Mapping basé sur les positions habituelles de Fiche Contrat
  // Ces positions peuvent varier selon le fichier source
  data.client = extractString(getCell(sheet, 'B', 3)) || extractString(getCell(sheet, 'C', 3));
  data.adresse = extractString(getCell(sheet, 'B', 4)) || extractString(getCell(sheet, 'C', 4));
  data.codePostal = extractString(getCell(sheet, 'B', 5)) || extractString(getCell(sheet, 'C', 5));
  data.ville = extractString(getCell(sheet, 'B', 6)) || extractString(getCell(sheet, 'C', 6));
  data.contact = extractString(getCell(sheet, 'B', 8)) || extractString(getCell(sheet, 'C', 8));
  data.telephone = extractString(getCell(sheet, 'B', 9)) || extractString(getCell(sheet, 'C', 9));
  data.email = extractString(getCell(sheet, 'B', 10)) || extractString(getCell(sheet, 'C', 10));
  data.siret = extractString(getCell(sheet, 'B', 7)) || extractString(getCell(sheet, 'C', 7));
  data.referenceDevis = extractString(getCell(sheet, 'B', 12)) || extractString(getCell(sheet, 'C', 12));
  
  const duree = extractNumber(getCell(sheet, 'B', 14)) || extractNumber(getCell(sheet, 'C', 14));
  if (duree) data.dureeLocation = duree;
  
  data.partenaire = extractString(getCell(sheet, 'B', 15)) || extractString(getCell(sheet, 'C', 15));
  
  return { data, errors };
}

function parseMatriceSheet(sheet: XLSX.WorkSheet): { 
  rows: MatriceRow[]; 
  clientData: Partial<FicheContratData>; 
  errors: ExcelParseError[] 
} {
  const rows: MatriceRow[] = [];
  const errors: ExcelParseError[] = [];
  const clientData: Partial<FicheContratData> = {};
  
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  
  // Parcourir toutes les lignes pour trouver les labels et leurs valeurs
  for (let r = range.s.r; r <= range.e.r; r++) {
    const rowNum = r + 1;
    
    // Chercher dans les colonnes A, B, C, D pour les labels
    for (let c = 0; c <= 3; c++) {
      const colLetter = XLSX.utils.encode_col(c);
      const cellValue = extractString(getCell(sheet, colLetter, rowNum));
      
      if (cellValue) {
        const lowerValue = cellValue.toLowerCase().trim();
        
        // Chercher la valeur dans les colonnes suivantes (première cellule non-vide après le label)
        let value: string | null = null;
        let valueCell: XLSX.CellObject | undefined;
        for (let valCol = c + 1; valCol <= 4; valCol++) {
          const testColLetter = XLSX.utils.encode_col(valCol);
          const testCell = getCell(sheet, testColLetter, rowNum);
          const testValue = extractString(testCell);
          if (testValue && testValue.trim() !== '') {
            value = testValue;
            valueCell = testCell;
            break;
          }
        }
        
        if (lowerValue.includes('nom du client') || lowerValue === 'client') {
          if (value) clientData.client = value;
        } else if (lowerValue === 'commercial' || (lowerValue.includes('commercial') && !lowerValue.includes('gestionnaire'))) {
          if (value) clientData.contact = value; // contact = IC (Commercial)
        } else if (lowerValue === 'adv' || lowerValue.includes('adv')) {
          if (value) clientData.gc = value; // gc = ADV
        } else if (lowerValue.includes('durée') || lowerValue.includes('duree')) {
          const numValue = extractNumber(valueCell);
          if (numValue) clientData.dureeLocation = numValue;
        } else if (lowerValue.includes('refi') || lowerValue.includes('partenaire')) {
          if (value) clientData.partenaire = value;
        }
      }
    }
    
    // Conserver le parsing générique pour les autres lignes
    const rowData: MatriceRow = {
      id: `matrice-${r}`,
      rawRowIndex: rowNum,
    };
    
    // Extraire toutes les cellules de la ligne
    for (let c = range.s.c; c <= range.e.c; c++) {
      const colLetter = XLSX.utils.encode_col(c);
      const cell = sheet[`${colLetter}${rowNum}`];
      if (cell) {
        rowData[`col_${colLetter}`] = cell.v;
      }
    }
    
    // Ajouter seulement si la ligne a des données
    if (Object.keys(rowData).length > 2) {
      rows.push(rowData);
    }
  }
  
  return { rows, clientData, errors };
}

// === FONCTION PRINCIPALE DE PARSING ===
export async function parseExcelFile(file: File): Promise<ExcelParseResult> {
  const errors: ExcelParseError[] = [];
  const warnings: ExcelParseError[] = [];
  const parsedSheets: string[] = [];
  const missingSheets: string[] = [];
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Vérifier les noms d'onglets
    const detectedSheets = workbook.SheetNames;
    
    REQUIRED_EXCEL_SHEETS.forEach(requiredSheet => {
      if (!detectedSheets.includes(requiredSheet)) {
        // Chercher une correspondance proche (sans espace final)
        const trimmed = requiredSheet.trim();
        const almostMatch = detectedSheets.find(s => s.trim() === trimmed);
        
        if (almostMatch && almostMatch !== requiredSheet) {
          warnings.push({
            sheet: requiredSheet,
            message: `Onglet "${almostMatch}" trouvé mais devrait être "${requiredSheet}" (espace final manquant)`,
          });
          // Utiliser quand même l'onglet trouvé
          parsedSheets.push(almostMatch);
        } else {
          missingSheets.push(requiredSheet);
          errors.push({
            sheet: requiredSheet,
            message: `Onglet "${requiredSheet}" non trouvé`,
          });
        }
      } else {
        parsedSheets.push(requiredSheet);
      }
    });
    
    // Parser chaque onglet trouvé
    const data: ParsedExcelData = {
      matrice: [],
      ficheContrat: {},
      invest: [],
      devis: [],
      optionsServices: [],
      baseTaux: [],
    };
    
    // Helper pour trouver l'onglet (avec ou sans espace final)
    const findSheet = (name: string): XLSX.WorkSheet | null => {
      if (workbook.Sheets[name]) return workbook.Sheets[name];
      const trimmed = name.trim();
      const match = detectedSheets.find(s => s.trim() === trimmed);
      return match ? workbook.Sheets[match] : null;
    };
    
    // Parser Matrice (avec extraction des données client)
    const matriceSheet = findSheet('Matrice');
    if (matriceSheet) {
      const result = parseMatriceSheet(matriceSheet);
      data.matrice = result.rows;
      // Fusionner les données client de Matrice vers ficheContrat
      data.ficheContrat = { ...data.ficheContrat, ...result.clientData };
      errors.push(...result.errors);
    }
    
  // Parser Fiche Contrat
  const ficheContratSheet = findSheet('Fiche Contrat');
  if (ficheContratSheet) {
    const result = parseFicheContratSheet(ficheContratSheet);
    // Fusionner au lieu d'écraser - priorité aux données Matrice (client, contact, gc)
    data.ficheContrat = { 
      ...result.data,           // Données de Fiche Contrat en base
      ...data.ficheContrat,     // Données de Matrice prioritaires
    };
    errors.push(...result.errors);
  }
    
    // Parser invest
    const investSheet = findSheet('invest ');
    if (investSheet) {
      const result = parseInvestSheet(investSheet);
      data.invest = result.rows;
      errors.push(...result.errors);
    }
    
    // Parser Devis
    const devisSheet = findSheet('Devis');
    if (devisSheet) {
      const result = parseDevisSheet(devisSheet);
      data.devis = result.rows;
      errors.push(...result.errors);
    }
    
    // Parser Options services
    const optionsSheet = findSheet('Options services ');
    if (optionsSheet) {
      const result = parseOptionsServicesSheet(optionsSheet);
      data.optionsServices = result.rows;
      errors.push(...result.errors);
    }
    
    // Parser Base Taux
    const baseTauxSheet = findSheet('Base Taux');
    if (baseTauxSheet) {
      const result = parseBaseTauxSheet(baseTauxSheet);
      data.baseTaux = result.rows;
      errors.push(...result.errors);
    }
    
    return {
      success: errors.length === 0,
      data,
      errors,
      warnings,
      parsedSheets,
      missingSheets,
      fileName: file.name,
    };
    
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: [{
        sheet: 'global',
        message: `Erreur de lecture du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      }],
      warnings: [],
      parsedSheets: [],
      missingSheets: REQUIRED_EXCEL_SHEETS as unknown as string[],
      fileName: file.name,
    };
  }
}

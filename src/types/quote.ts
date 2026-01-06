// Types for the quote generation system - Contractual Data Sources

// === ONGLETS EXCEL REQUIS (noms EXACTS avec espaces) ===
export const REQUIRED_EXCEL_SHEETS = [
  'Matrice',
  'Fiche Contrat',
  'invest ',           // ESPACE FINAL OBLIGATOIRE
  'Devis',
  'Options services ', // ESPACE FINAL OBLIGATOIRE
  'Base Taux'
] as const;

export type RequiredExcelSheet = typeof REQUIRED_EXCEL_SHEETS[number];

// === Quote Status (machine à états) ===
export type QuoteStatus = 
  | 'brouillon'
  | 'pret_apercu'
  | 'pret_export'
  | 'exporte';

// === Workflow Steps ===
export type WorkflowStep = 
  | 'template'
  | 'excel-import'
  | 'invest-validation'
  | 'csv-import'
  | 'options-selection'
  | 'preview'
  | 'export';

export type StepStatus = 'pending' | 'active' | 'complete' | 'error' | 'blocked';

// === CSV Import Mode ===
export type CSVImportMode = 'lecture_seule' | 'application';

export interface WorkflowStepConfig {
  id: WorkflowStep;
  label: string;
  description: string;
  icon: string;
  status: StepStatus;
  isBlocking: boolean;
}

// === Structure "invest " (colonnes B-E contractuelles) ===
export interface InvestRow {
  designation: string | null;     // Colonne B - "Matériel 2025"
  nb: number | null;              // Colonne C - "Nb"
  vun: number | null;             // Colonne D - "VUN" (valeur unitaire)
  vtn: number | null;             // Colonne E - "VTN" (valeur totale)
  rawRowIndex: number;            // Index ligne originale (traçabilité)
}

export type InvestValidationStatus = 
  | 'non_importe'
  | 'importe_non_valide'
  | 'valide_pret_injection'
  | 'rejete_a_corriger';

export interface ValidationError {
  rowIndex: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface InvestData {
  rows: InvestRow[];
  headerRowIndex: number;
  sourceSheet: string;            // Nom exact de l'onglet source
  isValidated: boolean;
  validationStatus: InvestValidationStatus;
  validationErrors: ValidationError[];
}

// === Structure "Base Taux" ===
export interface BaseTauxRow {
  partenaire: string;             // Non null requis
  montantMin: number;             // Non null requis
  montantMax: number | null;      // Nullable (si pas de max)
  dureeLocation: number;          // Entier, non null
  taux: number;                   // Décimal, non null
}

// === Structure "Devis" (ligne 22+) ===
export interface DevisRow {
  ref: string | null;                    // Colonne B
  designation: string | null;            // Colonne C
  prixUnitaireVenteHT: number | null;    // Colonne H
  qte: number | null;                    // Colonne I
  prixTotalVenteHT: number | null;       // Colonne J
  pxAchat: number | null;                // Colonne K (avec espace final potentiel)
  grossiste: string | null;              // Colonne L
  prixVente: number | null;              // Colonne M
  marge: number | null;                  // Colonne N
  refFournisseur: string | null;         // Colonne O
}

// === Structure "Options services " ===
export interface OptionsServiceRow {
  id: string;
  name: string;
  description: string | null;
  selected: boolean;
  category: string | null;
  price?: number;
}

export interface OptionsServicesData {
  isEmpty: boolean;
  rows: OptionsServiceRow[];
  structureError: string | null;  // Si colonnes non définies
}

// === Excel Sheet Detection ===
export interface ExcelSheet {
  name: string;
  required: boolean;
  found: boolean;
  rowCount?: number;
  hasTrailingSpace?: boolean;     // Pour détecter les espaces finaux
}

export interface SheetValidationResult {
  isValid: boolean;
  missingSheets: string[];
  extraSheets: string[];
  almostMatches: { detected: string; expected: string }[];
  errors: string[];
}

export interface ExcelImportResult {
  fileName: string;
  importDate: Date;
  sheets: ExcelSheet[];
  isValid: boolean;
  errors: string[];
  sheetValidation: SheetValidationResult | null;
}

// === Import CSV Tarifs - Contrat strict ===
export type CSVEncoding = 'utf-8' | 'iso-8859-1' | 'windows-1252';
export type CSVSeparator = ',' | ';' | '\t';

export interface CSVImportConfig {
  encoding: CSVEncoding;
  separator: CSVSeparator;
  requiredColumns: string[];       // Noms contractuels exacts
  keyColumn: string;               // Colonne de correspondance (ex: REF)
  columnTypes: Record<string, 'string' | 'number' | 'date'>;
}

export interface CSVImportError {
  type: 'missing_column' | 'invalid_type' | 'unmatched_key' | 'parse_error' | 'config_missing';
  column?: string;
  row?: number;
  message: string;
}

export interface CSVImportResult {
  fileName: string;
  importDate: Date;
  rowCount: number;
  isValid: boolean;
  errors: CSVImportError[];
  config: CSVImportConfig | null;
  importedRows?: number;
  matchedKeys?: number;
}

// === Quote Template ===
export interface QuoteTemplate {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  lastModified: Date;
  previewUrl?: string;
}

// === Audit Log ===
export type AuditLogType = 
  | 'excel-import' 
  | 'csv-import' 
  | 'validation' 
  | 'export' 
  | 'error' 
  | 'sheet-detection'
  | 'invest-status-change';

export type AuditLogStatus = 'success' | 'warning' | 'error' | 'blocked' | 'info';

export interface AuditLog {
  id: string;
  type: AuditLogType;
  message: string;
  timestamp: Date;
  status: AuditLogStatus;
  details?: string;
  metadata?: Record<string, unknown>;
}

// === Service Option (legacy compatibility) ===
export interface ServiceOption {
  id: string;
  name: string;
  description: string;
  price?: number;
  selected: boolean;
  category: string;
}

// === Quote State ===
export interface QuoteState {
  currentStep: WorkflowStep;
  quoteStatus: QuoteStatus;
  template: QuoteTemplate | null;
  excelImport: ExcelImportResult | null;
  investData: InvestData | null;
  optionsData: OptionsServicesData | null;
  csvImport: CSVImportResult | null;
  csvConfig: CSVImportConfig | null;
  csvImportMode: CSVImportMode;
  selectedOptions: ServiceOption[];
  auditLogs: AuditLog[];
  previewGenerated: boolean;
  optionsValidated: boolean;
}

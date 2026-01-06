// Types for the quote generation system

export type WorkflowStep = 
  | 'template'
  | 'excel-import'
  | 'invest-validation'
  | 'csv-import'
  | 'options-selection'
  | 'preview'
  | 'export';

export type StepStatus = 'pending' | 'active' | 'complete' | 'error' | 'blocked';

export interface WorkflowStepConfig {
  id: WorkflowStep;
  label: string;
  description: string;
  icon: string;
  status: StepStatus;
  isBlocking: boolean;
}

export interface ExcelSheet {
  name: string;
  required: boolean;
  found: boolean;
  rowCount?: number;
}

export interface ExcelImportResult {
  fileName: string;
  importDate: Date;
  sheets: ExcelSheet[];
  isValid: boolean;
  errors: string[];
}

export interface InvestData {
  rows: Record<string, string | number>[];
  columns: string[];
  isValidated: boolean;
  validationErrors: string[];
}

export interface CSVImportResult {
  fileName: string;
  importDate: Date;
  rowCount: number;
  isValid: boolean;
  errors: string[];
}

export interface ServiceOption {
  id: string;
  name: string;
  description: string;
  price?: number;
  selected: boolean;
  category: string;
}

export interface QuoteTemplate {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  lastModified: Date;
  previewUrl?: string;
}

export interface AuditLog {
  id: string;
  type: 'excel-import' | 'csv-import' | 'validation' | 'export' | 'error';
  message: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error';
  details?: string;
}

export interface QuoteState {
  currentStep: WorkflowStep;
  template: QuoteTemplate | null;
  excelImport: ExcelImportResult | null;
  investData: InvestData | null;
  csvImport: CSVImportResult | null;
  selectedOptions: ServiceOption[];
  auditLogs: AuditLog[];
}

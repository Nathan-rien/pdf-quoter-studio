import { create } from 'zustand';
import { 
  QuoteState, 
  WorkflowStep, 
  QuoteTemplate, 
  ExcelImportResult, 
  InvestData, 
  CSVImportResult, 
  ServiceOption, 
  AuditLog 
} from '@/types/quote';

interface QuoteStore extends QuoteState {
  // Navigation
  setCurrentStep: (step: WorkflowStep) => void;
  canProceedToStep: (step: WorkflowStep) => boolean;
  
  // Template
  setTemplate: (template: QuoteTemplate) => void;
  
  // Excel Import
  setExcelImport: (result: ExcelImportResult) => void;
  clearExcelImport: () => void;
  
  // Invest Validation
  setInvestData: (data: InvestData) => void;
  validateInvestData: () => void;
  
  // CSV Import
  setCSVImport: (result: CSVImportResult) => void;
  clearCSVImport: () => void;
  
  // Options
  setSelectedOptions: (options: ServiceOption[]) => void;
  toggleOption: (optionId: string) => void;
  
  // Audit
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  
  // Reset
  resetQuote: () => void;
}

const initialState: QuoteState = {
  currentStep: 'template',
  template: null,
  excelImport: null,
  investData: null,
  csvImport: null,
  selectedOptions: [],
  auditLogs: [],
};

export const useQuoteStore = create<QuoteStore>((set, get) => ({
  ...initialState,

  setCurrentStep: (step) => set({ currentStep: step }),

  canProceedToStep: (step) => {
    const state = get();
    const stepOrder: WorkflowStep[] = [
      'template',
      'excel-import',
      'invest-validation',
      'csv-import',
      'options-selection',
      'preview',
      'export'
    ];
    
    const targetIndex = stepOrder.indexOf(step);
    
    // Can always go to template
    if (step === 'template') return true;
    
    // Check prerequisites
    if (targetIndex >= 1 && !state.template) return false;
    if (targetIndex >= 2 && (!state.excelImport || !state.excelImport.isValid)) return false;
    if (targetIndex >= 3 && (!state.investData || !state.investData.isValidated)) return false;
    if (targetIndex >= 5 && (!state.csvImport || !state.csvImport.isValid)) return false;
    
    return true;
  },

  setTemplate: (template) => {
    set({ template });
    get().addAuditLog({
      type: 'validation',
      message: `Template "${template.name}" sélectionné`,
      status: 'success',
    });
  },

  setExcelImport: (result) => {
    set({ excelImport: result });
    get().addAuditLog({
      type: 'excel-import',
      message: `Fichier Excel "${result.fileName}" importé`,
      status: result.isValid ? 'success' : 'error',
      details: result.isValid 
        ? `${result.sheets.length} onglets détectés` 
        : result.errors.join(', '),
    });
  },

  clearExcelImport: () => set({ excelImport: null, investData: null }),

  setInvestData: (data) => set({ investData: data }),

  validateInvestData: () => {
    const { investData } = get();
    if (!investData) return;
    
    set({ 
      investData: { 
        ...investData, 
        isValidated: true, 
        validationErrors: [] 
      } 
    });
    
    get().addAuditLog({
      type: 'validation',
      message: 'Données Invest validées',
      status: 'success',
      details: `${investData.rows.length} lignes prêtes à injecter`,
    });
  },

  setCSVImport: (result) => {
    set({ csvImport: result });
    get().addAuditLog({
      type: 'csv-import',
      message: `Fichier CSV "${result.fileName}" importé`,
      status: result.isValid ? 'success' : 'error',
      details: result.isValid 
        ? `${result.rowCount} tarifs mis à jour` 
        : result.errors.join(', '),
    });
  },

  clearCSVImport: () => set({ csvImport: null }),

  setSelectedOptions: (options) => set({ selectedOptions: options }),

  toggleOption: (optionId) => {
    const { selectedOptions } = get();
    const updated = selectedOptions.map(opt => 
      opt.id === optionId ? { ...opt, selected: !opt.selected } : opt
    );
    set({ selectedOptions: updated });
  },

  addAuditLog: (log) => {
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    set(state => ({ auditLogs: [newLog, ...state.auditLogs] }));
  },

  resetQuote: () => {
    set(initialState);
    get().addAuditLog({
      type: 'validation',
      message: 'Nouveau devis initialisé',
      status: 'success',
    });
  },
}));

import { create } from 'zustand';
import { 
  QuoteState, 
  WorkflowStep, 
  QuoteTemplate, 
  ExcelImportResult, 
  InvestData, 
  CSVImportResult, 
  CSVImportConfig,
  ServiceOption, 
  AuditLog,
  OptionsServicesData,
  InvestValidationStatus
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
  setInvestValidationStatus: (status: InvestValidationStatus) => void;
  validateInvestData: () => void;
  
  // Options
  setOptionsData: (data: OptionsServicesData) => void;
  
  // CSV Import
  setCSVImport: (result: CSVImportResult) => void;
  setCSVConfig: (config: CSVImportConfig) => void;
  clearCSVImport: () => void;
  
  // Service Options (legacy)
  setSelectedOptions: (options: ServiceOption[]) => void;
  toggleOption: (optionId: string) => void;
  
  // Audit
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  
  // Export validation
  canExportPDF: () => boolean;
  
  // Reset
  resetQuote: () => void;
}

const initialState: QuoteState = {
  currentStep: 'template',
  template: null,
  excelImport: null,
  investData: null,
  optionsData: null,
  csvImport: null,
  csvConfig: null,
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
    if (targetIndex >= 3 && (!state.investData || state.investData.validationStatus !== 'valide_pret_injection')) return false;
    // CSV is optional but if present must be valid
    if (targetIndex >= 5 && state.csvImport && !state.csvImport.isValid) return false;
    
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

  clearExcelImport: () => set({ 
    excelImport: null, 
    investData: null,
    optionsData: null 
  }),

  setInvestData: (data) => {
    set({ investData: data });
    get().addAuditLog({
      type: 'invest-status-change',
      message: `Données Invest importées`,
      status: data.validationStatus === 'rejete_a_corriger' ? 'error' : 'info',
      details: `${data.rows.length} lignes, statut: ${data.validationStatus}`,
    });
  },

  setInvestValidationStatus: (status) => {
    const { investData } = get();
    if (!investData) return;

    set({
      investData: {
        ...investData,
        validationStatus: status,
        isValidated: status === 'valide_pret_injection'
      }
    });

    get().addAuditLog({
      type: 'invest-status-change',
      message: `Statut Invest : ${status}`,
      status: status === 'valide_pret_injection' ? 'success' : 
              status === 'rejete_a_corriger' ? 'error' : 'warning'
    });
  },

  validateInvestData: () => {
    const { investData } = get();
    if (!investData) return;
    
    // Check for blocking errors
    const hasErrors = investData.validationErrors.some(e => e.severity === 'error');
    
    if (hasErrors) {
      set({ 
        investData: { 
          ...investData, 
          validationStatus: 'rejete_a_corriger',
          isValidated: false
        } 
      });
      
      get().addAuditLog({
        type: 'validation',
        message: 'Validation Invest échouée',
        status: 'error',
        details: `${investData.validationErrors.length} erreur(s) détectée(s)`,
      });
      return;
    }
    
    set({ 
      investData: { 
        ...investData, 
        isValidated: true, 
        validationStatus: 'valide_pret_injection',
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

  setOptionsData: (data) => set({ optionsData: data }),

  setCSVImport: (result) => {
    set({ csvImport: result });
    get().addAuditLog({
      type: 'csv-import',
      message: `Fichier CSV "${result.fileName}" importé`,
      status: result.isValid ? 'success' : 'error',
      details: result.isValid 
        ? `${result.rowCount} tarifs mis à jour` 
        : result.errors.map(e => e.message).join(', '),
    });
  },

  setCSVConfig: (config) => set({ csvConfig: config }),

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

  canExportPDF: () => {
    const { investData, template } = get();
    return template !== null && 
           investData?.validationStatus === 'valide_pret_injection';
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

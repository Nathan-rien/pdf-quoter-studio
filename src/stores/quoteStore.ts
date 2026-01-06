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
  InvestValidationStatus,
  QuoteStatus,
  CSVImportMode
} from '@/types/quote';
import { validateInvestRows } from '@/lib/invest-validation';
import { isValidCSVConfig } from '@/lib/csv-parser';

interface QuoteStore extends QuoteState {
  // Navigation
  setCurrentStep: (step: WorkflowStep) => void;
  canProceedToStep: (step: WorkflowStep) => boolean;
  
  // Quote Status
  getQuoteStatus: () => QuoteStatus;
  checkTransitionToPreview: () => { allowed: boolean; blockers: string[] };
  checkTransitionToExport: () => { allowed: boolean; blockers: string[] };
  setQuoteExported: () => void;
  
  // Template
  setTemplate: (template: QuoteTemplate) => void;
  
  // Excel Import
  setExcelImport: (result: ExcelImportResult) => void;
  clearExcelImport: () => void;
  
  // Invest Validation
  setInvestData: (data: InvestData) => void;
  setInvestValidationStatus: (status: InvestValidationStatus) => void;
  validateInvestData: () => void;
  rejectInvestData: () => void;
  
  // Options
  setOptionsData: (data: OptionsServicesData) => void;
  setOptionsValidated: (validated: boolean) => void;
  
  // CSV Import
  setCSVImport: (result: CSVImportResult) => void;
  setCSVConfig: (config: CSVImportConfig) => void;
  clearCSVImport: () => void;
  getCSVImportMode: () => CSVImportMode;
  
  // Service Options (legacy)
  setSelectedOptions: (options: ServiceOption[]) => void;
  toggleOption: (optionId: string) => void;
  
  // Preview
  setPreviewGenerated: (generated: boolean) => void;
  
  // Audit
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  
  // Export validation
  canExportPDF: () => boolean;
  
  // Reset
  resetQuote: () => void;
}

const initialState: QuoteState = {
  currentStep: 'template',
  quoteStatus: 'brouillon',
  template: null,
  excelImport: null,
  investData: null,
  optionsData: null,
  csvImport: null,
  csvConfig: null,
  csvImportMode: 'lecture_seule',
  selectedOptions: [],
  auditLogs: [],
  previewGenerated: false,
  optionsValidated: false,
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

  // === Quote Status Machine ===
  getQuoteStatus: () => {
    const state = get();
    
    // Check if exported
    if (state.quoteStatus === 'exporte') return 'exporte';
    
    // Check pret_export conditions
    const exportCheck = get().checkTransitionToExport();
    if (exportCheck.allowed) return 'pret_export';
    
    // Check pret_apercu conditions
    const previewCheck = get().checkTransitionToPreview();
    if (previewCheck.allowed) return 'pret_apercu';
    
    return 'brouillon';
  },

  checkTransitionToPreview: () => {
    const state = get();
    const blockers: string[] = [];

    // Un template PDF actif doit être sélectionné
    if (!state.template) {
      blockers.push('Template PDF non sélectionné');
    } else if (!state.template.isActive) {
      blockers.push('Template PDF inactif');
    }

    // Un fichier Excel doit être importé avec tous les onglets attendus
    if (!state.excelImport) {
      blockers.push('Fichier Excel non importé');
    } else if (!state.excelImport.isValid) {
      blockers.push('Fichier Excel invalide (onglets manquants)');
    }

    // L'entité InvestValidation doit être à l'état validé_prêt_injection
    if (!state.investData) {
      blockers.push('Données Invest non importées');
    } else if (state.investData.validationStatus !== 'valide_pret_injection') {
      blockers.push(`Statut Invest "${state.investData.validationStatus}" - "valide_pret_injection" requis`);
    }

    return {
      allowed: blockers.length === 0,
      blockers
    };
  },

  checkTransitionToExport: () => {
    const state = get();
    const blockers: string[] = [];

    // D'abord vérifier les conditions de pret_apercu
    const previewCheck = get().checkTransitionToPreview();
    if (!previewCheck.allowed) {
      blockers.push(...previewCheck.blockers);
    }

    // L'aperçu doit avoir été généré sans erreur bloquante
    if (!state.previewGenerated) {
      blockers.push('Aperçu non généré');
    }

    // Les options sélectionnées doivent être validées (si disponibles)
    // Si onglet vide, pas de validation requise
    if (state.optionsData && !state.optionsData.isEmpty && !state.optionsValidated) {
      blockers.push('Options services non validées');
    }

    return {
      allowed: blockers.length === 0,
      blockers
    };
  },

  setQuoteExported: () => {
    const exportCheck = get().checkTransitionToExport();
    if (!exportCheck.allowed) {
      get().addAuditLog({
        type: 'error',
        message: 'Export bloqué',
        status: 'blocked',
        details: exportCheck.blockers.join(', ')
      });
      return;
    }

    set({ quoteStatus: 'exporte' });
    get().addAuditLog({
      type: 'export',
      message: 'Devis exporté avec succès',
      status: 'success'
    });
  },

  setTemplate: (template) => {
    set({ template, quoteStatus: 'brouillon' });
    get().addAuditLog({
      type: 'validation',
      message: `Template "${template.name}" sélectionné`,
      status: 'success',
    });
  },

  setExcelImport: (result) => {
    set({ excelImport: result, quoteStatus: 'brouillon' });
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
    optionsData: null,
    quoteStatus: 'brouillon',
    previewGenerated: false,
    optionsValidated: false
  }),

  setInvestData: (data) => {
    // Appliquer les règles de validation
    const validationResult = validateInvestRows(data.rows);
    const updatedData: InvestData = {
      ...data,
      validationErrors: validationResult.errors,
      validationStatus: validationResult.isValid ? 'importe_non_valide' : 'rejete_a_corriger'
    };

    set({ investData: updatedData, quoteStatus: 'brouillon' });
    get().addAuditLog({
      type: 'invest-status-change',
      message: `Données Invest importées`,
      status: updatedData.validationStatus === 'rejete_a_corriger' ? 'error' : 'info',
      details: `${data.rows.length} lignes, statut: ${updatedData.validationStatus}`,
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
      },
      quoteStatus: 'brouillon',
      previewGenerated: false
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
    
    // Vérifier les erreurs bloquantes
    const validationResult = validateInvestRows(investData.rows);
    
    if (!validationResult.canValidate) {
      set({ 
        investData: { 
          ...investData, 
          validationStatus: 'rejete_a_corriger',
          validationErrors: validationResult.errors,
          isValidated: false
        },
        quoteStatus: 'brouillon'
      });
      
      get().addAuditLog({
        type: 'validation',
        message: 'Validation Invest échouée',
        status: 'error',
        details: `${validationResult.errors.length} erreur(s) bloquante(s)`,
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
      message: 'Données Invest validées - Prêtes à injecter',
      status: 'success',
      details: `${investData.rows.length} lignes validées`,
    });
  },

  rejectInvestData: () => {
    const { investData } = get();
    if (!investData) return;

    set({
      investData: {
        ...investData,
        validationStatus: 'rejete_a_corriger',
        isValidated: false
      },
      quoteStatus: 'brouillon',
      previewGenerated: false
    });

    get().addAuditLog({
      type: 'validation',
      message: 'Données Invest rejetées par l\'utilisateur',
      status: 'warning',
      details: 'Correction requise - réimportez le fichier Excel'
    });
  },

  setOptionsData: (data) => set({ optionsData: data }),

  setOptionsValidated: (validated) => set({ optionsValidated: validated }),

  setCSVImport: (result) => {
    const mode = get().getCSVImportMode();
    set({ csvImport: result });
    get().addAuditLog({
      type: 'csv-import',
      message: `Fichier CSV "${result.fileName}" importé`,
      status: result.isValid ? 'success' : 'error',
      details: mode === 'lecture_seule'
        ? `MODE LECTURE SEULE - ${result.rowCount} lignes lues (aucune mise à jour appliquée)`
        : result.isValid 
          ? `${result.rowCount} tarifs mis à jour` 
          : result.errors.map(e => e.message).join(', '),
    });
  },

  setCSVConfig: (config) => {
    const mode: CSVImportMode = isValidCSVConfig(config) ? 'application' : 'lecture_seule';
    set({ csvConfig: config, csvImportMode: mode });
  },

  clearCSVImport: () => set({ csvImport: null }),

  getCSVImportMode: () => {
    const { csvConfig } = get();
    return isValidCSVConfig(csvConfig) ? 'application' : 'lecture_seule';
  },

  setSelectedOptions: (options) => set({ selectedOptions: options }),

  toggleOption: (optionId) => {
    const { selectedOptions } = get();
    const updated = selectedOptions.map(opt => 
      opt.id === optionId ? { ...opt, selected: !opt.selected } : opt
    );
    set({ selectedOptions: updated, optionsValidated: false });
  },

  setPreviewGenerated: (generated) => set({ previewGenerated: generated }),

  addAuditLog: (log) => {
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    set(state => ({ auditLogs: [newLog, ...state.auditLogs] }));
  },

  canExportPDF: () => {
    const exportCheck = get().checkTransitionToExport();
    return exportCheck.allowed;
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

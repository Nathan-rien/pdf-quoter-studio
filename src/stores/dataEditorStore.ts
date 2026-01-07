import { create } from 'zustand';
import { 
  InvestRow, 
  DevisRow, 
  BaseTauxRow, 
  OptionsServiceRow,
  ValidationError 
} from '@/types/quote';
import { ParsedExcelData } from '@/lib/excel-import-parser';

// === Structure Matrice ===
export interface MatriceRow {
  id: string;
  rawRowIndex: number;
  [key: string]: unknown;
}

// === Structure Fiche Contrat ===
export interface FicheContratData {
  client: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  contact: string | null;  // IC (Ingénieur Commercial)
  gc: string | null;       // GC (Gestionnaire Commercial / ADV)
  telephone: string | null;
  email: string | null;
  siret: string | null;
  dateDevis: Date | null;
  referenceDevis: string | null;
  dureeLocation: number | null;
  partenaire: string | null;
  // Paramètres financiers (depuis Excel)
  investissements: number | null;
  echeancesMensuelles: number | null;
  echeancesTrimestrielles: number | null;
  marge: number | null;
  margeInvestissements: number | null;
  facturationRefi: number | null;
  facturationLoyerIntermediaire: number | null;
}

export type SheetName = 'matrice' | 'ficheContrat' | 'invest' | 'devis' | 'optionsServices' | 'baseTaux';

// === Import Status ===
export interface ImportStatus {
  isImported: boolean;
  fileName: string | null;
  importDate: Date | null;
  parsedSheets: string[];
  errors: string[];
}

interface DataEditorState {
  // Data for each sheet
  matriceData: MatriceRow[];
  ficheContratData: FicheContratData;
  investData: InvestRow[];
  devisData: DevisRow[];
  optionsServicesData: OptionsServiceRow[];
  baseTauxData: BaseTauxRow[];
  
  // Editor state
  activeSheet: SheetName;
  hasUnsavedChanges: boolean;
  validationErrors: Record<SheetName, ValidationError[]>;
  
  // Track which sheets have been modified
  modifiedSheets: Set<SheetName>;
  
  // Import status
  importStatus: ImportStatus;
}

interface DataEditorActions {
  // Sheet navigation
  setActiveSheet: (sheet: SheetName) => void;
  
  // Cell updates
  updateInvestCell: (rowIndex: number, column: keyof InvestRow, value: unknown) => void;
  updateDevisCell: (rowIndex: number, column: keyof DevisRow, value: unknown) => void;
  updateBaseTauxCell: (rowIndex: number, column: keyof BaseTauxRow, value: unknown) => void;
  updateOptionsServiceCell: (rowIndex: number, column: keyof OptionsServiceRow, value: unknown) => void;
  updateFicheContratField: (field: keyof FicheContratData, value: unknown) => void;
  
  // Row operations
  addInvestRow: () => void;
  deleteInvestRow: (rowIndex: number) => void;
  addDevisRow: () => void;
  deleteDevisRow: (rowIndex: number) => void;
  addBaseTauxRow: () => void;
  deleteBaseTauxRow: (rowIndex: number) => void;
  addOptionsServiceRow: () => void;
  deleteOptionsServiceRow: (rowIndex: number) => void;
  addOptionsServiceFromAdmin: (title: string, services: string[], price?: number) => void;
  
  // Validation
  validateSheet: (sheet: SheetName) => ValidationError[];
  validateAllSheets: () => boolean;
  getSheetErrors: (sheet: SheetName) => ValidationError[];
  
  // Data state
  isSheetValid: (sheet: SheetName) => boolean;
  hasData: (sheet: SheetName) => boolean;
  markAsSaved: () => void;
  
  // Reset
  resetSheet: (sheet: SheetName) => void;
  resetAllData: () => void;
  
  // Excel Import
  importFromExcel: (data: ParsedExcelData, fileName: string) => void;
  getImportStatus: () => ImportStatus;
}

const initialFicheContrat: FicheContratData = {
  client: null,
  adresse: null,
  codePostal: null,
  ville: null,
  contact: null,
  gc: null,
  telephone: null,
  email: null,
  siret: null,
  dateDevis: null,
  referenceDevis: null,
  dureeLocation: null,
  partenaire: null,
  investissements: null,
  echeancesMensuelles: null,
  echeancesTrimestrielles: null,
  marge: null,
  margeInvestissements: null,
  facturationRefi: null,
  facturationLoyerIntermediaire: null,
};

const initialImportStatus: ImportStatus = {
  isImported: false,
  fileName: null,
  importDate: null,
  parsedSheets: [],
  errors: [],
};

const initialState: DataEditorState = {
  matriceData: [],
  ficheContratData: initialFicheContrat,
  investData: [],
  devisData: [],
  optionsServicesData: [],
  baseTauxData: [],
  activeSheet: 'invest',
  hasUnsavedChanges: false,
  validationErrors: {
    matrice: [],
    ficheContrat: [],
    invest: [],
    devis: [],
    optionsServices: [],
    baseTaux: [],
  },
  modifiedSheets: new Set(),
  importStatus: initialImportStatus,
};

export const useDataEditorStore = create<DataEditorState & DataEditorActions>((set, get) => ({
  ...initialState,

  setActiveSheet: (sheet) => set({ activeSheet: sheet }),

  // === INVEST SHEET OPERATIONS ===
  updateInvestCell: (rowIndex, column, value) => {
    const { investData, modifiedSheets } = get();
    const newData = [...investData];
    
    if (newData[rowIndex]) {
      newData[rowIndex] = { ...newData[rowIndex], [column]: value };
      
      // Auto-calculate VTN if Nb or VUN changes (EXPLICIT RULE)
      if (column === 'nb' || column === 'vun') {
        const nb = column === 'nb' ? (value as number) : newData[rowIndex].nb;
        const vun = column === 'vun' ? (value as number) : newData[rowIndex].vun;
        if (nb !== null && vun !== null) {
          newData[rowIndex].vtn = nb * vun;
        }
      }
      
      modifiedSheets.add('invest');
      set({ investData: newData, hasUnsavedChanges: true, modifiedSheets: new Set(modifiedSheets) });
    }
  },

  addInvestRow: () => {
    const { investData, modifiedSheets } = get();
    const newRow: InvestRow = {
      designation: '',
      nb: null,
      vun: null,
      vtn: null,
      rawRowIndex: investData.length + 1,
    };
    modifiedSheets.add('invest');
    set({ 
      investData: [...investData, newRow], 
      hasUnsavedChanges: true,
      modifiedSheets: new Set(modifiedSheets)
    });
  },

  deleteInvestRow: (rowIndex) => {
    const { investData, modifiedSheets } = get();
    const newData = investData.filter((_, idx) => idx !== rowIndex);
    modifiedSheets.add('invest');
    set({ 
      investData: newData, 
      hasUnsavedChanges: true,
      modifiedSheets: new Set(modifiedSheets)
    });
  },

  // === DEVIS SHEET OPERATIONS ===
  updateDevisCell: (rowIndex, column, value) => {
    const { devisData, modifiedSheets } = get();
    const newData = [...devisData];
    
    if (newData[rowIndex]) {
      newData[rowIndex] = { ...newData[rowIndex], [column]: value };
      modifiedSheets.add('devis');
      set({ devisData: newData, hasUnsavedChanges: true, modifiedSheets: new Set(modifiedSheets) });
    }
  },

  addDevisRow: () => {
    const { devisData, modifiedSheets } = get();
    const newRow: DevisRow = {
      ref: '',
      designation: '',
      prixUnitaireVenteHT: null,
      qte: null,
      prixTotalVenteHT: null,
      pxAchat: null,
      grossiste: null,
      prixVente: null,
      marge: null,
      refFournisseur: null,
    };
    modifiedSheets.add('devis');
    set({ 
      devisData: [...devisData, newRow], 
      hasUnsavedChanges: true,
      modifiedSheets: new Set(modifiedSheets)
    });
  },

  deleteDevisRow: (rowIndex) => {
    const { devisData, modifiedSheets } = get();
    const newData = devisData.filter((_, idx) => idx !== rowIndex);
    modifiedSheets.add('devis');
    set({ 
      devisData: newData, 
      hasUnsavedChanges: true,
      modifiedSheets: new Set(modifiedSheets)
    });
  },

  // === BASE TAUX SHEET OPERATIONS ===
  updateBaseTauxCell: (rowIndex, column, value) => {
    const { baseTauxData, modifiedSheets } = get();
    const newData = [...baseTauxData];
    
    if (newData[rowIndex]) {
      newData[rowIndex] = { ...newData[rowIndex], [column]: value };
      modifiedSheets.add('baseTaux');
      set({ baseTauxData: newData, hasUnsavedChanges: true, modifiedSheets: new Set(modifiedSheets) });
    }
  },

  addBaseTauxRow: () => {
    const { baseTauxData, modifiedSheets } = get();
    const newRow: BaseTauxRow = {
      partenaire: '',
      montantMin: 0,
      montantMax: null,
      dureeLocation: 0,
      taux: 0,
    };
    modifiedSheets.add('baseTaux');
    set({ 
      baseTauxData: [...baseTauxData, newRow], 
      hasUnsavedChanges: true,
      modifiedSheets: new Set(modifiedSheets)
    });
  },

  deleteBaseTauxRow: (rowIndex) => {
    const { baseTauxData, modifiedSheets } = get();
    const newData = baseTauxData.filter((_, idx) => idx !== rowIndex);
    modifiedSheets.add('baseTaux');
    set({ 
      baseTauxData: newData, 
      hasUnsavedChanges: true,
      modifiedSheets: new Set(modifiedSheets)
    });
  },

  // === OPTIONS SERVICES SHEET OPERATIONS ===
  updateOptionsServiceCell: (rowIndex, column, value) => {
    const { optionsServicesData, modifiedSheets } = get();
    const newData = [...optionsServicesData];
    
    if (newData[rowIndex]) {
      newData[rowIndex] = { ...newData[rowIndex], [column]: value };
      modifiedSheets.add('optionsServices');
      set({ optionsServicesData: newData, hasUnsavedChanges: true, modifiedSheets: new Set(modifiedSheets) });
    }
  },

  addOptionsServiceRow: () => {
    const { optionsServicesData, modifiedSheets } = get();
    const newRow: OptionsServiceRow = {
      id: `opt-${Date.now()}`,
      name: '',
      description: null,
      selected: false,
      category: null,
    };
    modifiedSheets.add('optionsServices');
    set({ 
      optionsServicesData: [...optionsServicesData, newRow], 
      hasUnsavedChanges: true,
      modifiedSheets: new Set(modifiedSheets)
    });
  },

  deleteOptionsServiceRow: (rowIndex) => {
    const { optionsServicesData, modifiedSheets } = get();
    const newData = optionsServicesData.filter((_, idx) => idx !== rowIndex);
    modifiedSheets.add('optionsServices');
    set({ 
      optionsServicesData: newData, 
      hasUnsavedChanges: true,
      modifiedSheets: new Set(modifiedSheets)
    });
  },

  addOptionsServiceFromAdmin: (title, services, price) => {
    const { optionsServicesData, modifiedSheets } = get();
    const newRow: OptionsServiceRow = {
      id: `opt-admin-${Date.now()}`,
      name: title,
      description: services.join(' | '),
      selected: false,
      category: null,
      price: price ?? null,
    };
    modifiedSheets.add('optionsServices');
    set({ 
      optionsServicesData: [...optionsServicesData, newRow], 
      hasUnsavedChanges: true,
      modifiedSheets: new Set(modifiedSheets)
    });
  },

  // === FICHE CONTRAT OPERATIONS ===
  updateFicheContratField: (field, value) => {
    const { ficheContratData, modifiedSheets } = get();
    modifiedSheets.add('ficheContrat');
    set({ 
      ficheContratData: { ...ficheContratData, [field]: value },
      hasUnsavedChanges: true,
      modifiedSheets: new Set(modifiedSheets)
    });
  },

  // === VALIDATION ===
  validateSheet: (sheet) => {
    const state = get();
    const errors: ValidationError[] = [];

    switch (sheet) {
      case 'invest':
        state.investData.forEach((row, idx) => {
          if (row.nb !== null && !Number.isInteger(row.nb)) {
            errors.push({
              rowIndex: idx,
              column: 'Nb',
              message: 'Nb doit être un entier',
              severity: 'error',
            });
          }
          if (row.vun !== null && typeof row.vun !== 'number') {
            errors.push({
              rowIndex: idx,
              column: 'VUN',
              message: 'VUN doit être numérique',
              severity: 'error',
            });
          }
        });
        break;

      case 'baseTaux':
        state.baseTauxData.forEach((row, idx) => {
          if (!row.partenaire || row.partenaire.trim() === '') {
            errors.push({
              rowIndex: idx,
              column: 'Partenaire',
              message: 'Partenaire est obligatoire',
              severity: 'error',
            });
          }
          if (row.dureeLocation <= 0) {
            errors.push({
              rowIndex: idx,
              column: 'Durée Location',
              message: 'Durée doit être positive',
              severity: 'error',
            });
          }
        });
        break;

      case 'ficheContrat':
        if (!state.ficheContratData.client) {
          errors.push({
            rowIndex: 0,
            column: 'Client',
            message: 'Client est obligatoire',
            severity: 'error',
          });
        }
        break;
    }

    set(prev => ({
      validationErrors: {
        ...prev.validationErrors,
        [sheet]: errors,
      },
    }));

    return errors;
  },

  validateAllSheets: () => {
    const sheets: SheetName[] = ['matrice', 'ficheContrat', 'invest', 'devis', 'optionsServices', 'baseTaux'];
    let allValid = true;

    sheets.forEach(sheet => {
      const errors = get().validateSheet(sheet);
      if (errors.length > 0) {
        allValid = false;
      }
    });

    return allValid;
  },

  getSheetErrors: (sheet) => {
    return get().validationErrors[sheet] || [];
  },

  isSheetValid: (sheet) => {
    const errors = get().validationErrors[sheet];
    return !errors || errors.length === 0;
  },

  hasData: (sheet) => {
    const state = get();
    switch (sheet) {
      case 'invest':
        return state.investData.length > 0;
      case 'devis':
        return state.devisData.length > 0;
      case 'baseTaux':
        return state.baseTauxData.length > 0;
      case 'optionsServices':
        return state.optionsServicesData.length > 0;
      case 'ficheContrat':
        return state.ficheContratData.client !== null;
      case 'matrice':
        return state.matriceData.length > 0;
      default:
        return false;
    }
  },

  markAsSaved: () => {
    set({ hasUnsavedChanges: false, modifiedSheets: new Set() });
  },

  resetSheet: (sheet) => {
    switch (sheet) {
      case 'invest':
        set({ investData: [] });
        break;
      case 'devis':
        set({ devisData: [] });
        break;
      case 'baseTaux':
        set({ baseTauxData: [] });
        break;
      case 'optionsServices':
        set({ optionsServicesData: [] });
        break;
      case 'ficheContrat':
        set({ ficheContratData: initialFicheContrat });
        break;
      case 'matrice':
        set({ matriceData: [] });
        break;
    }
    set({ hasUnsavedChanges: true });
  },

  resetAllData: () => {
    set(initialState);
  },

  // === EXCEL IMPORT ===
  importFromExcel: (data, fileName) => {
    set({
      matriceData: data.matrice,
      ficheContratData: {
        ...initialFicheContrat,
        ...data.ficheContrat,
      },
      investData: data.invest,
      devisData: data.devis,
      optionsServicesData: data.optionsServices,
      baseTauxData: data.baseTaux,
      hasUnsavedChanges: true,
      modifiedSheets: new Set(['matrice', 'ficheContrat', 'invest', 'devis', 'optionsServices', 'baseTaux']),
      importStatus: {
        isImported: true,
        fileName,
        importDate: new Date(),
        parsedSheets: Object.keys(data).filter(k => {
          const val = data[k as keyof typeof data];
          return Array.isArray(val) ? val.length > 0 : Object.keys(val).length > 0;
        }),
        errors: [],
      },
    });
  },

  getImportStatus: () => get().importStatus,
}));

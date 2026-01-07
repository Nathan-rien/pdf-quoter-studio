import { create } from 'zustand';
import { PDFParseResult, PDFProductLine } from '@/lib/pdf-import-parser';

export type RentalWorkflowStep = 'import' | 'data' | 'preview' | 'export';

interface ClientData {
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  email: string;
}

interface DevisData {
  reference: string;
  date: string;
  validite: string;
  numeroClient: string;
}

interface CommercialData {
  nom: string;
  email: string;
}

interface LocationData {
  duree: number | null;
  loyerMensuel: number | null;
  montantTotal: number | null;
}

interface TotauxData {
  totalHT: number | null;
  tva: number | null;
  totalTTC: number | null;
}

interface PDFImportStatus {
  isImported: boolean;
  fileName: string | null;
  source: 'cybertek' | 'grosbill' | 'unknown' | null;
  importDate: Date | null;
}

interface RentalProposalState {
  // Import status
  pdfImportStatus: PDFImportStatus;
  
  // Extracted data
  clientData: ClientData;
  devisData: DevisData;
  commercialData: CommercialData;
  lignesData: PDFProductLine[];
  locationData: LocationData;
  totauxData: TotauxData;
  
  // Workflow
  currentStep: RentalWorkflowStep;
  hasUnsavedChanges: boolean;
  isActive: boolean;
}

interface RentalProposalActions {
  // Import
  importFromPDF: (result: PDFParseResult, fileName: string) => void;
  
  // Update data
  updateClientField: (field: keyof ClientData, value: string) => void;
  updateDevisField: (field: keyof DevisData, value: string) => void;
  updateCommercialField: (field: keyof CommercialData, value: string) => void;
  updateLocationField: (field: keyof LocationData, value: number | null) => void;
  updateLigne: (index: number, updates: Partial<PDFProductLine>) => void;
  addLigne: () => void;
  deleteLigne: (index: number) => void;
  
  // Workflow
  setCurrentStep: (step: RentalWorkflowStep) => void;
  canNavigateToStep: (step: RentalWorkflowStep) => boolean;
  markAsSaved: () => void;
  
  // Reset
  resetAll: () => void;
  startNewProposal: () => void;
}

const initialClientData: ClientData = {
  nom: '',
  adresse: '',
  codePostal: '',
  ville: '',
  telephone: '',
  email: '',
};

const initialDevisData: DevisData = {
  reference: '',
  date: '',
  validite: '',
  numeroClient: '',
};

const initialCommercialData: CommercialData = {
  nom: '',
  email: '',
};

const initialLocationData: LocationData = {
  duree: null,
  loyerMensuel: null,
  montantTotal: null,
};

const initialTotauxData: TotauxData = {
  totalHT: null,
  tva: null,
  totalTTC: null,
};

const initialPDFImportStatus: PDFImportStatus = {
  isImported: false,
  fileName: null,
  source: null,
  importDate: null,
};

const initialState: RentalProposalState = {
  pdfImportStatus: initialPDFImportStatus,
  clientData: initialClientData,
  devisData: initialDevisData,
  commercialData: initialCommercialData,
  lignesData: [],
  locationData: initialLocationData,
  totauxData: initialTotauxData,
  currentStep: 'import',
  hasUnsavedChanges: false,
  isActive: false,
};

export const useRentalProposalStore = create<RentalProposalState & RentalProposalActions>((set, get) => ({
  ...initialState,

  importFromPDF: (result, fileName) => {
    set({
      pdfImportStatus: {
        isImported: true,
        fileName,
        source: result.source,
        importDate: new Date(),
      },
      clientData: {
        nom: result.client.nom || '',
        adresse: result.client.adresse || '',
        codePostal: result.client.codePostal || '',
        ville: result.client.ville || '',
        telephone: result.client.telephone || '',
        email: result.client.email || '',
      },
      devisData: {
        reference: result.devis.reference || '',
        date: result.devis.date || '',
        validite: result.devis.validite || '',
        numeroClient: result.devis.numeroClient || '',
      },
      commercialData: {
        nom: result.commercial.nom || '',
        email: result.commercial.email || '',
      },
      lignesData: result.lignes,
      locationData: {
        duree: result.location.duree,
        loyerMensuel: result.location.loyerMensuel,
        montantTotal: result.location.montantTotal,
      },
      totauxData: {
        totalHT: result.totaux.totalHT,
        tva: result.totaux.tva,
        totalTTC: result.totaux.totalTTC,
      },
      currentStep: 'data',
      hasUnsavedChanges: true,
      isActive: true,
    });
  },

  updateClientField: (field, value) => {
    set(state => ({
      clientData: { ...state.clientData, [field]: value },
      hasUnsavedChanges: true,
    }));
  },

  updateDevisField: (field, value) => {
    set(state => ({
      devisData: { ...state.devisData, [field]: value },
      hasUnsavedChanges: true,
    }));
  },

  updateCommercialField: (field, value) => {
    set(state => ({
      commercialData: { ...state.commercialData, [field]: value },
      hasUnsavedChanges: true,
    }));
  },

  updateLocationField: (field, value) => {
    set(state => ({
      locationData: { ...state.locationData, [field]: value },
      hasUnsavedChanges: true,
    }));
  },

  updateLigne: (index, updates) => {
    set(state => {
      const newLignes = [...state.lignesData];
      if (newLignes[index]) {
        newLignes[index] = { ...newLignes[index], ...updates };
        // Recalculate totalHT if quantity or unit price changed
        if (updates.quantite !== undefined || updates.prixUnitaire !== undefined) {
          const ligne = newLignes[index];
          if (ligne.prixUnitaire !== null) {
            ligne.totalHT = Math.round(ligne.prixUnitaire * ligne.quantite * 100) / 100;
          }
        }
      }
      return { lignesData: newLignes, hasUnsavedChanges: true };
    });
  },

  addLigne: () => {
    set(state => ({
      lignesData: [
        ...state.lignesData,
        { reference: null, designation: '', prixUnitaire: null, quantite: 1, totalHT: 0 },
      ],
      hasUnsavedChanges: true,
    }));
  },

  deleteLigne: (index) => {
    set(state => ({
      lignesData: state.lignesData.filter((_, i) => i !== index),
      hasUnsavedChanges: true,
    }));
  },

  setCurrentStep: (step) => {
    const state = get();
    if (state.canNavigateToStep(step)) {
      set({ currentStep: step });
    }
  },

  canNavigateToStep: (step) => {
    const state = get();
    const stepOrder: RentalWorkflowStep[] = ['import', 'data', 'preview', 'export'];
    const currentIndex = stepOrder.indexOf(state.currentStep);
    const targetIndex = stepOrder.indexOf(step);

    // Can always go back
    if (targetIndex < currentIndex) return true;

    // Cannot skip steps
    if (targetIndex > currentIndex + 1) return false;

    // Specific conditions
    switch (step) {
      case 'data':
        return state.pdfImportStatus.isImported;
      case 'preview':
        return state.pdfImportStatus.isImported && state.lignesData.length > 0;
      case 'export':
        return state.pdfImportStatus.isImported && state.lignesData.length > 0;
      default:
        return true;
    }
  },

  markAsSaved: () => {
    set({ hasUnsavedChanges: false });
  },

  resetAll: () => {
    set(initialState);
  },

  startNewProposal: () => {
    set({
      ...initialState,
      isActive: true,
    });
  },
}));

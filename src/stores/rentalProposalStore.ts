import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PDFParseResult, PDFProductLine } from '@/lib/pdf-import-parser';
import { calculateAllMatriceValues } from '@/lib/rental-calculations';
import { PARTENAIRES, Partenaire } from '@/data/base-taux';
import { CommercialEntity, Commercial, COMMERCIAUX, getCommercialById } from '@/data/commerciaux';

export type RentalWorkflowStep = 'import' | 'data' | 'template' | 'preview' | 'export';

// Commercial data
interface CommercialData {
  entity: CommercialEntity | null;
  commercialId: string | null;
}

const initialCommercialData: CommercialData = {
  entity: null,
  commercialId: null,
};

interface ClientData {
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  email: string;
}

interface MatriceData {
  // Encart Saisie - Champs modifiables
  duree: number | null;                    // Modifiable directement (mois)
  montantInvestissement: number | null;    // = Total HT du PDF OU saisi manuellement
  
  // Encart Données - Champs modifiables
  refinanceur: Partenaire | null;          // Sélection parmi liste fixe
  margeAppliquee: number;                  // Modifiable (défaut 6%)
  
  // Toggle affichage
  showCoutLocatifAnnuel: boolean;
}

// Options service pour le calcul des services inclus
interface OptionService {
  id: string;
  name: string;
  description: string;
  price: number | null;
  selected: boolean;
}

interface PDFImportStatus {
  isImported: boolean;
  fileName: string | null;
  source: 'cybertek' | 'grosbill' | 'unknown' | null;
  importDate: string | null; // Changed to string for JSON serialization
}

interface RentalProposalState {
  // Import status
  pdfImportStatus: PDFImportStatus;
  
  // Client data
  clientData: ClientData;
  
  // Commercial data
  commercialData: CommercialData;
  
  // Matrice data (replaces devis, location, etc.)
  matriceData: MatriceData;
  
  // Lignes produits (Invest tab)
  lignesData: PDFProductLine[];
  
  // Options services
  optionsServices: OptionService[];
  
  // Workflow
  currentStep: RentalWorkflowStep;
  hasUnsavedChanges: boolean;
  isActive: boolean;
}

interface RentalProposalActions {
  // Import
  importFromPDF: (result: PDFParseResult, fileName: string) => void;
  
  // Client data
  updateClientField: (field: keyof ClientData, value: string) => void;
  
  // Matrice data
  updateMatriceField: <K extends keyof MatriceData>(field: K, value: MatriceData[K]) => void;
  
  // Lignes produits
  updateLigne: (index: number, updates: Partial<PDFProductLine>) => void;
  addLigne: () => void;
  deleteLigne: (index: number) => void;
  
  // Options services
  addOptionService: (name: string, description: string, price: number | null) => void;
  updateOptionService: (id: string, updates: Partial<Omit<OptionService, 'id'>>) => void;
  deleteOptionService: (id: string) => void;
  toggleOptionService: (id: string) => void;
  
  // Commercial
  updateCommercialEntity: (entity: CommercialEntity | null) => void;
  selectCommercial: (commercialId: string | null) => void;
  getSelectedCommercial: () => Commercial | null;
  
  // Computed values (getters)
  getCalculatedValues: () => ReturnType<typeof calculateAllMatriceValues>;
  getSelectedOptionsPrices: () => (number | null)[];
  
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

const initialMatriceData: MatriceData = {
  duree: 36,
  montantInvestissement: null,
  refinanceur: 'Lixxbail 1',
  margeAppliquee: 6,
  showCoutLocatifAnnuel: true,
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
  commercialData: initialCommercialData,
  matriceData: initialMatriceData,
  lignesData: [],
  optionsServices: [],
  currentStep: 'import',
  hasUnsavedChanges: false,
  isActive: false,
};

export const useRentalProposalStore = create<RentalProposalState & RentalProposalActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      importFromPDF: (result, fileName) => {
        // Calculer le montant investissement depuis Total HT du PDF
        const montantInvestissement = result.totaux.totalHT;
        
        set({
          pdfImportStatus: {
            isImported: true,
            fileName,
            source: result.source,
            importDate: new Date().toISOString(),
          },
          clientData: {
            nom: result.client.nom || '',
            adresse: result.client.adresse || '',
            codePostal: result.client.codePostal || '',
            ville: result.client.ville || '',
            telephone: result.client.telephone || '',
            email: result.client.email || '',
          },
          matriceData: {
            ...initialMatriceData,
            montantInvestissement,
            // Extraire la durée du PDF si disponible
            duree: result.location.duree ?? 36,
          },
          lignesData: result.lignes,
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

      updateMatriceField: (field, value) => {
        set(state => ({
          matriceData: { ...state.matriceData, [field]: value },
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

      addOptionService: (name, description, price) => {
        const id = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        set(state => ({
          optionsServices: [
            ...state.optionsServices,
            { id, name, description, price, selected: true },
          ],
          hasUnsavedChanges: true,
        }));
      },

      updateOptionService: (id, updates) => {
        set(state => ({
          optionsServices: state.optionsServices.map(opt =>
            opt.id === id ? { ...opt, ...updates } : opt
          ),
          hasUnsavedChanges: true,
        }));
      },

      deleteOptionService: (id) => {
        set(state => ({
          optionsServices: state.optionsServices.filter(opt => opt.id !== id),
          hasUnsavedChanges: true,
        }));
      },

      toggleOptionService: (id) => {
        set(state => ({
          optionsServices: state.optionsServices.map(opt =>
            opt.id === id ? { ...opt, selected: !opt.selected } : opt
          ),
          hasUnsavedChanges: true,
        }));
      },

      // Commercial actions
      updateCommercialEntity: (entity) => {
        set({ 
          commercialData: { entity, commercialId: null },
          hasUnsavedChanges: true 
        });
      },

      selectCommercial: (commercialId) => {
        set(state => ({ 
          commercialData: { ...state.commercialData, commercialId },
          hasUnsavedChanges: true 
        }));
      },

      getSelectedCommercial: () => {
        const { commercialData } = get();
        if (!commercialData.commercialId) return null;
        return getCommercialById(commercialData.commercialId);
      },

      getSelectedOptionsPrices: () => {
        const state = get();
        return state.optionsServices
          .filter(opt => opt.selected)
          .map(opt => opt.price);
      },

      getCalculatedValues: () => {
        const state = get();
        const optionsPrices = state.optionsServices
          .filter(opt => opt.selected)
          .map(opt => opt.price);
        
        return calculateAllMatriceValues(
          state.matriceData.montantInvestissement,
          state.matriceData.duree,
          state.matriceData.refinanceur,
          state.matriceData.margeAppliquee,
          optionsPrices
        );
      },

      setCurrentStep: (step) => {
        const state = get();
        if (state.canNavigateToStep(step)) {
          set({ currentStep: step });
        }
      },

      canNavigateToStep: (step) => {
        const state = get();
        const stepOrder: RentalWorkflowStep[] = ['import', 'data', 'template', 'preview', 'export'];
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
          case 'template':
            return state.pdfImportStatus.isImported && state.lignesData.length > 0;
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
    }),
    {
      name: 'rental-proposal-storage',
      partialize: (state) => ({
        pdfImportStatus: state.pdfImportStatus,
        clientData: state.clientData,
        commercialData: state.commercialData,
        matriceData: state.matriceData,
        lignesData: state.lignesData,
        optionsServices: state.optionsServices,
        currentStep: state.currentStep,
        isActive: state.isActive,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Error rehydrating rental proposal store:', error);
          try {
            localStorage.removeItem('rental-proposal-storage');
          } catch (e) {
            console.error('Failed to clear corrupted storage:', e);
          }
          return;
        }
        
        // Validate rehydrated state with try-catch
        try {
          if (state) {
            // Validate clientData
            if (!state.clientData || typeof state.clientData !== 'object') {
              state.clientData = initialClientData;
            } else {
              // Ensure all clientData fields are strings
              for (const key of Object.keys(initialClientData) as (keyof typeof initialClientData)[]) {
                if (typeof state.clientData[key] !== 'string') {
                  state.clientData[key] = '';
                }
              }
            }
            
            // Validate matriceData
            if (!state.matriceData || typeof state.matriceData !== 'object') {
              state.matriceData = initialMatriceData;
            }
            
            // Validate commercialData
            if (!state.commercialData || typeof state.commercialData !== 'object') {
              state.commercialData = initialCommercialData;
            }
            
            // Validate pdfImportStatus
            if (!state.pdfImportStatus || typeof state.pdfImportStatus !== 'object') {
              state.pdfImportStatus = initialPDFImportStatus;
            }
            
            // Validate arrays
            if (!Array.isArray(state.lignesData)) {
              state.lignesData = [];
            }
            if (!Array.isArray(state.optionsServices)) {
              state.optionsServices = [];
            }
          }
        } catch (validationError) {
          console.error('State validation failed, resetting store:', validationError);
          try {
            localStorage.removeItem('rental-proposal-storage');
          } catch (e) {
            console.error('Failed to clear storage after validation error:', e);
          }
        }
      },
    }
  )
);

// Export partenaires for use in components
export { PARTENAIRES };
export type { Partenaire };

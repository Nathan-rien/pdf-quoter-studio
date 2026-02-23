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
  logoUrl: string;
}

// NEW: Individual proposal type for multi-proposal support
export interface MatriceProposal {
  id: string;
  montantInvestissement: number | null;
  duree: number | null;
  refinanceur: Partenaire | null;
  margeAppliquee: number;
  coefficientOverride: number | null; // null = utiliser la valeur auto
}

interface MatriceData {
  // Global field shared across all proposals
  montantInvestissement: number | null;
  // Toggle affichage
  showCoutLocatifAnnuel: boolean;
  // Toggle affichage des prix dans le tableau Invest
  investShowPrices: boolean;
  // Toggle affichage du bloc "Votre offre"
  investShowOffer: boolean;
  // Commentaire libre affiché sous Avantages/Conditions sur la page 4
  commentaire: string;
  
  // Legacy fields (kept for backward compatibility, will be migrated to proposals[0])
  duree: number | null;
  refinanceur: Partenaire | null;
  margeAppliquee: number;
}

// Options service pour le calcul des services inclus
export interface OptionService {
  id: string;
  name: string;
  description: string;
  price: number | null;           // montant "au mois"
  priceTotal: number | null;      // montant "au total"
  showPriceMode: 'mensuel' | 'total'; // quel montant afficher
  selected: boolean;
}

interface PDFImportStatus {
  isImported: boolean;
  fileName: string | null;
  source: 'cybertek' | 'grosbill' | 'dental' | 'unknown' | null;
  importDate: string | null; // Changed to string for JSON serialization
}

// Services inclus (bloc permanent)
interface ServicesInclus {
  description: string;
}

// Override pour la position/taille du logo client (mode Modifier)
export interface ClientLogoOverride {
  top: number;    // % du canvas
  left: number;   // % du canvas
  width: number;  // px
  height: number; // px
}

interface RentalProposalState {
  // Import status
  pdfImportStatus: PDFImportStatus;
  
  // Client data
  clientData: ClientData;
  
  // Commercial data
  commercialData: CommercialData;
  
  // Matrice data (global fields)
  matriceData: MatriceData;
  
  // NEW: Array of proposals (max 4 recommended)
  proposals: MatriceProposal[];
  
  // Lignes produits (Invest tab)
  lignesData: PDFProductLine[];
  
  // Services inclus (bloc permanent - toujours affiché en haut de page 5)
  servicesInclus: ServicesInclus;
  
  // Options services additionnelles (page 5 - ancien système, conservé pour rétrocompatibilité)
  optionsServices: OptionService[];
  
  // Nos Options (nouvel onglet - alimente page 6)
  nosOptions: OptionService[];
  
  // Nom personnalisé de la proposition
  proposalName: string;
  
  // Template sélectionné pour la proposition
  selectedTemplateId: string | null;
  
  // Override position/taille du logo client
  clientLogoOverride: ClientLogoOverride | null;
  
  // Offsets de position des blocs dynamiques par page (session uniquement)
  dynamicContentOffsets: Record<number, { x: number; y: number }>;
  
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
  
  // Proposal name
  updateProposalName: (name: string) => void;
  
  // Template selection
  selectTemplateForProposal: (templateId: string) => void;
  
  // Matrice data (global fields)
  updateMatriceField: <K extends keyof MatriceData>(field: K, value: MatriceData[K]) => void;
  
  // NEW: Proposals CRUD
  addProposal: () => void;
  duplicateProposal: (id: string) => void;
  updateProposal: (id: string, updates: Partial<MatriceProposal>) => void;
  deleteProposal: (id: string) => void;
  getProposalCalculations: (id: string) => ReturnType<typeof calculateAllMatriceValues> | null;
  getAllProposalsCalculations: () => Array<{ proposal: MatriceProposal; calculations: ReturnType<typeof calculateAllMatriceValues> }>;
  
  // Lignes produits
  updateLigne: (index: number, updates: Partial<PDFProductLine>) => void;
  addLigne: () => void;
  addSeparatorLigne: (atIndex?: number) => void;
  reorderLigne: (fromIndex: number, toIndex: number) => void;
  deleteLigne: (index: number) => void;
  
  // Services inclus (bloc permanent)
  updateServicesInclus: (description: string) => void;
  
  // Options services additionnelles (page 5)
  addOptionService: (name: string, description: string, price: number | null) => void;
  updateOptionService: (id: string, updates: Partial<Omit<OptionService, 'id'>>) => void;
  deleteOptionService: (id: string) => void;
  toggleOptionService: (id: string) => void;
  
  // Nos Options (page 6)
  addNosOption: (name: string, description: string, price: number | null) => void;
  updateNosOption: (id: string, updates: Partial<Omit<OptionService, 'id'>>) => void;
  deleteNosOption: (id: string) => void;
  toggleNosOption: (id: string) => void;
  
  // Commercial
  updateCommercialEntity: (entity: CommercialEntity | null) => void;
  selectCommercial: (commercialId: string | null) => void;
  getSelectedCommercial: () => Commercial | null;
  
  // Computed values (getters) - uses first proposal for backward compatibility
  getCalculatedValues: () => ReturnType<typeof calculateAllMatriceValues>;
  getSelectedOptionsPrices: () => (number | null)[];
  
  // Workflow
  setCurrentStep: (step: RentalWorkflowStep) => void;
  canNavigateToStep: (step: RentalWorkflowStep) => boolean;
  markAsSaved: () => void;
  
  // Dynamic content offsets
  updateDynamicContentOffset: (pageNumber: number, offset: { x: number; y: number }) => void;
  resetDynamicContentOffsets: () => void;
  
  // Client logo override
  updateClientLogoOverride: (override: ClientLogoOverride) => void;
  resetClientLogoOverride: () => void;
  
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
  logoUrl: '',
};

const initialMatriceData: MatriceData = {
  montantInvestissement: null,
  showCoutLocatifAnnuel: true,
  investShowPrices: true,
  investShowOffer: true,
  commentaire: '',
  // Legacy fields
  duree: 36,
  refinanceur: 'Lixxbail 1',
  margeAppliquee: 6,
};

// Helper to generate unique proposal ID
const generateProposalId = () => `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Default initial proposal
const createDefaultProposal = (): MatriceProposal => ({
  id: generateProposalId(),
  montantInvestissement: null,
  duree: 36,
  refinanceur: 'Lixxbail 1',
  margeAppliquee: 6,
  coefficientOverride: null,
});

const initialPDFImportStatus: PDFImportStatus = {
  isImported: false,
  fileName: null,
  source: null,
  importDate: null,
};

// Services inclus par défaut (bloc permanent)
const initialServicesInclus: ServicesInclus = {
  description: 'Contrat de location et gestion administrative\nOptimisation des coûts et gestion budgétaire\nGestion des évolutions (ajout / retrait de matériels en cours de contrat)\nAccès privilégié aux matériels de seconde vie\nGarantie de recyclage / valorisation du matériel en fin de vie (DEEE)\nMise à disposition du matériel informatique (location possible au-delà de la durée du contrat)',
};

const initialState: RentalProposalState = {
  pdfImportStatus: initialPDFImportStatus,
  clientData: initialClientData,
  commercialData: initialCommercialData,
  matriceData: initialMatriceData,
  proposals: [createDefaultProposal()],
  lignesData: [],
  servicesInclus: initialServicesInclus,
  optionsServices: [],
  nosOptions: [],
  proposalName: '',
  selectedTemplateId: null,
  clientLogoOverride: null,
  dynamicContentOffsets: {},
  currentStep: 'import',
  hasUnsavedChanges: false,
  isActive: false,
};

export const useRentalProposalStore = create<RentalProposalState & RentalProposalActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      importFromPDF: (result, fileName) => {
        // Calculer le montant investissement depuis la somme des lignes Invest (plus fiable que totalHT du PDF)
        const lignesTotal = result.lignes.length > 0
          ? Math.round(result.lignes.reduce((sum, ligne) => sum + (ligne.totalHT || 0), 0) * 100) / 100
          : null;
        const montantInvestissement = lignesTotal ?? result.totaux.totalHT;
        
        // Générer un nom de proposition par défaut basé sur le client et la date
        const clientName = result.client.nom || 'Client';
        const now = new Date();
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        const defaultProposalName = `Proposition ${clientName} - ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
        
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
            logoUrl: '',
          },
          matriceData: {
            ...initialMatriceData,
            montantInvestissement,
            // Legacy fields - also update for backward compatibility
            duree: result.location.duree ?? 36,
          },
          // Initialize proposals with PDF duration and montant
          proposals: [{
            id: generateProposalId(),
            montantInvestissement,
            duree: result.location.duree ?? 36,
            refinanceur: 'Lixxbail 1',
            margeAppliquee: 6,
            coefficientOverride: null,
          }],
          lignesData: result.lignes,
          proposalName: defaultProposalName,
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

      updateProposalName: (name) => {
        set({ proposalName: name, hasUnsavedChanges: true });
      },

      selectTemplateForProposal: (templateId) => {
        set({ selectedTemplateId: templateId, hasUnsavedChanges: true });
      },

      updateMatriceField: (field, value) => {
        set(state => ({
          matriceData: { ...state.matriceData, [field]: value },
          hasUnsavedChanges: true,
        }));
      },

      // NEW: Proposals CRUD actions
      addProposal: () => {
        set(state => {
          if (state.proposals.length >= 4) return state; // Max 4 proposals
          return {
            proposals: [...state.proposals, createDefaultProposal()],
            hasUnsavedChanges: true,
          };
        });
      },

      duplicateProposal: (id) => {
        set(state => {
          if (state.proposals.length >= 4) return state; // Max 4 proposals
          const original = state.proposals.find(p => p.id === id);
          if (!original) return state;
          
          const duplicate: MatriceProposal = {
            ...original,
            id: generateProposalId(),
          };
          
          // Insert duplicate right after the original
          const index = state.proposals.findIndex(p => p.id === id);
          const newProposals = [...state.proposals];
          newProposals.splice(index + 1, 0, duplicate);
          
          return {
            proposals: newProposals,
            hasUnsavedChanges: true,
          };
        });
      },

      updateProposal: (id, updates) => {
        set(state => ({
          proposals: state.proposals.map(p =>
            p.id === id ? { ...p, ...updates } : p
          ),
          hasUnsavedChanges: true,
        }));
      },

      deleteProposal: (id) => {
        set(state => {
          if (state.proposals.length <= 1) return state; // Keep at least one
          return {
            proposals: state.proposals.filter(p => p.id !== id),
            hasUnsavedChanges: true,
          };
        });
      },

      getProposalCalculations: (id) => {
        const state = get();
        const proposal = state.proposals.find(p => p.id === id);
        if (!proposal) return null;
        
        const optionsPrices = state.optionsServices
          .filter(opt => opt.selected)
          .map(opt => opt.price);
        
        return calculateAllMatriceValues(
          proposal.montantInvestissement,
          proposal.duree,
          proposal.refinanceur,
          proposal.margeAppliquee,
          optionsPrices
        );
      },

      getAllProposalsCalculations: () => {
        const state = get();
        const optionsPrices = state.optionsServices
          .filter(opt => opt.selected)
          .map(opt => opt.price);
        
        return state.proposals.map(proposal => ({
          proposal,
          calculations: calculateAllMatriceValues(
            proposal.montantInvestissement,
            proposal.duree,
            proposal.refinanceur,
            proposal.margeAppliquee,
            optionsPrices
          ),
        }));
      },

      updateLigne: (index, updates) => {
        set(state => {
          const newLignes = [...state.lignesData];
          if (newLignes[index]) {
            newLignes[index] = { ...newLignes[index], ...updates };
            // Recalculate totalHT if quantity or unit price changed (skip separators)
            if (!newLignes[index].isSeparator && (updates.quantite !== undefined || updates.prixUnitaire !== undefined)) {
              const ligne = newLignes[index];
              if (ligne.prixUnitaire !== null) {
                ligne.totalHT = Math.round(ligne.prixUnitaire * ligne.quantite * 100) / 100;
              }
            }
          }
          // Recalculer le montant investissement total (exclure les séparateurs)
          const newMontantInvestissement = Math.round(
            newLignes.filter(l => !l.isSeparator).reduce((sum, ligne) => sum + (ligne.totalHT || 0), 0) * 100
          ) / 100;
          return { 
            lignesData: newLignes, 
            matriceData: { ...state.matriceData, montantInvestissement: newMontantInvestissement },
            proposals: state.proposals.map(p => ({ ...p, montantInvestissement: newMontantInvestissement })),
            hasUnsavedChanges: true 
          };
        });
      },

      addLigne: () => {
        set(state => {
          const newLignes = [
            ...state.lignesData,
            { reference: null, designation: '', prixUnitaire: null, quantite: 1, totalHT: 0 },
          ];
          const newMontantInvestissement = Math.round(
            newLignes.filter(l => !l.isSeparator).reduce((sum, ligne) => sum + (ligne.totalHT || 0), 0) * 100
          ) / 100;
          return {
            lignesData: newLignes,
            matriceData: { ...state.matriceData, montantInvestissement: newMontantInvestissement },
            proposals: state.proposals.map(p => ({ ...p, montantInvestissement: newMontantInvestissement })),
            hasUnsavedChanges: true,
          };
        });
      },

      addSeparatorLigne: (atIndex?: number) => {
        set(state => {
          const newSeparator = { reference: null, designation: '', prixUnitaire: null, quantite: 0, totalHT: 0, isSeparator: true };
          const newLignes = [...state.lignesData];
          if (atIndex !== undefined && atIndex >= 0 && atIndex <= newLignes.length) {
            newLignes.splice(atIndex, 0, newSeparator);
          } else {
            newLignes.push(newSeparator);
          }
          return { lignesData: newLignes, hasUnsavedChanges: true };
        });
      },

      reorderLigne: (fromIndex, toIndex) => {
        set(state => {
          const newLignes = [...state.lignesData];
          const [moved] = newLignes.splice(fromIndex, 1);
          newLignes.splice(toIndex, 0, moved);
          return { lignesData: newLignes, hasUnsavedChanges: true };
        });
      },

      deleteLigne: (index) => {
        set(state => {
          const newLignes = state.lignesData.filter((_, i) => i !== index);
          const newMontantInvestissement = Math.round(
            newLignes.filter(l => !l.isSeparator).reduce((sum, ligne) => sum + (ligne.totalHT || 0), 0) * 100
          ) / 100;
          return {
            lignesData: newLignes,
            matriceData: { ...state.matriceData, montantInvestissement: newMontantInvestissement },
            proposals: state.proposals.map(p => ({ ...p, montantInvestissement: newMontantInvestissement })),
            hasUnsavedChanges: true,
          };
        });
      },

      updateServicesInclus: (description) => {
        set(state => ({
          servicesInclus: { ...state.servicesInclus, description },
          hasUnsavedChanges: true,
        }));
      },

      addOptionService: (name, description, price) => {
        const id = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        set(state => ({
          optionsServices: [
            ...state.optionsServices,
            { id, name, description, price, priceTotal: null, showPriceMode: 'mensuel' as const, selected: true },
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

      // Nos Options actions (page 6)
      addNosOption: (name, description, price) => {
        const id = `nosopt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        set(state => ({
          nosOptions: [
            ...state.nosOptions,
            { id, name, description, price, priceTotal: null, showPriceMode: 'mensuel', selected: true },
          ],
          hasUnsavedChanges: true,
        }));
      },

      updateNosOption: (id, updates) => {
        set(state => ({
          nosOptions: state.nosOptions.map(opt =>
            opt.id === id ? { ...opt, ...updates } : opt
          ),
          hasUnsavedChanges: true,
        }));
      },

      deleteNosOption: (id) => {
        set(state => ({
          nosOptions: state.nosOptions.filter(opt => opt.id !== id),
          hasUnsavedChanges: true,
        }));
      },

      toggleNosOption: (id) => {
        set(state => ({
          nosOptions: state.nosOptions.map(opt =>
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
        
        // Use first proposal for backward compatibility
        const firstProposal = state.proposals[0];
        
        return calculateAllMatriceValues(
          firstProposal?.montantInvestissement ?? state.matriceData.montantInvestissement,
          firstProposal?.duree ?? state.matriceData.duree,
          firstProposal?.refinanceur ?? state.matriceData.refinanceur,
          firstProposal?.margeAppliquee ?? state.matriceData.margeAppliquee,
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
            return state.pdfImportStatus.isImported && state.lignesData.length > 0 && state.selectedTemplateId !== null;
          case 'export':
            return state.pdfImportStatus.isImported && state.lignesData.length > 0 && state.selectedTemplateId !== null;
          default:
            return true;
        }
      },

      updateDynamicContentOffset: (pageNumber, offset) => {
        set(state => ({
          dynamicContentOffsets: {
            ...state.dynamicContentOffsets,
            [pageNumber]: offset,
          },
        }));
      },

      resetDynamicContentOffsets: () => {
        set({ dynamicContentOffsets: {} });
      },

      updateClientLogoOverride: (override) => {
        set({ clientLogoOverride: override, hasUnsavedChanges: true });
      },

      resetClientLogoOverride: () => {
        set({ clientLogoOverride: null, hasUnsavedChanges: true });
      },

      markAsSaved: () => {
        set({ hasUnsavedChanges: false });
      },

      resetAll: () => {
        const currentServicesInclus = get().servicesInclus;
        set({
          ...initialState,
          servicesInclus: currentServicesInclus,
        });
      },

      startNewProposal: () => {
        const currentServicesInclus = get().servicesInclus;
        set({
          ...initialState,
          servicesInclus: currentServicesInclus,
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
        proposals: state.proposals,
        lignesData: state.lignesData,
        servicesInclus: state.servicesInclus,
        optionsServices: state.optionsServices,
        nosOptions: state.nosOptions,
        proposalName: state.proposalName,
        selectedTemplateId: state.selectedTemplateId,
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
            
            // Validate servicesInclus
            if (!state.servicesInclus || typeof state.servicesInclus.description !== 'string') {
              state.servicesInclus = initialServicesInclus;
            }

            // Validate arrays
            if (!Array.isArray(state.lignesData)) {
              state.lignesData = [];
            }
            if (!Array.isArray(state.optionsServices)) {
              state.optionsServices = [];
            }
            if (!Array.isArray(state.nosOptions)) {
              state.nosOptions = [];
            }
            
            // Migrate proposals: if proposals array is missing/empty, create from legacy matriceData
            if (!Array.isArray(state.proposals) || state.proposals.length === 0) {
              state.proposals = [{
                id: generateProposalId(),
                montantInvestissement: state.matriceData?.montantInvestissement ?? null,
                coefficientOverride: null,
                duree: state.matriceData?.duree ?? 36,
                refinanceur: state.matriceData?.refinanceur ?? 'Lixxbail 1',
                margeAppliquee: state.matriceData?.margeAppliquee ?? 6,
              }];
            } else {
              // Migrate existing proposals that don't have montantInvestissement
              state.proposals = state.proposals.map(p => ({
                ...p,
                montantInvestissement: p.montantInvestissement ?? state.matriceData?.montantInvestissement ?? null,
              }));
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

/**
 * Store Zustand pour l'éditeur de template PDF
 * Gère l'état de l'éditeur et les actions autorisées
 */

import { create } from 'zustand';
import type { 
  TemplateVersion, 
  EditableElement, 
  TemplateEditorState,
  TextContent,
  TemplatePageContent,
  PublishValidationResult
} from '@/types/template-editor';
import type { PDFPageNumber, DynamicZone } from '@/types/pdf-template';
import { PDF_TEMPLATE_CONTRACT } from '@/lib/pdf-template-contract';
import { validateTemplateForPublication } from '@/lib/template-validation';
import { blockDynamicZoneEdit, getDynamicZonesForPage } from '@/lib/template-protection';

interface TemplateEditorStore extends TemplateEditorState {
  // Actions de navigation
  setSelectedPage: (pageNumber: PDFPageNumber) => void;
  selectElement: (elementId: string | null) => void;
  setEditorMode: (mode: 'view' | 'edit') => void;

  // Actions d'édition (éléments NON dynamiques uniquement)
  updateTextContent: (elementId: string, content: Partial<TextContent>) => boolean;
  updateElementPosition: (elementId: string, position: { x: number; y: number }) => boolean;
  updateElementSize: (elementId: string, size: { width: number; height: number }) => boolean;

  // Protection des zones dynamiques
  isElementEditable: (elementId: string) => boolean;
  attemptEditDynamicZone: (zoneId: string) => { blocked: true; error: ReturnType<typeof blockDynamicZoneEdit> };

  // Versioning
  loadVersion: (version: TemplateVersion) => void;
  createNewVersion: () => TemplateVersion | null;
  saveCurrentVersion: () => void;
  publishVersion: () => PublishValidationResult;
  archiveVersion: (versionId: string) => void;

  // Validation
  validateDynamicZonesIntegrity: () => PublishValidationResult;

  // Utilitaires
  getCurrentPageContent: () => TemplatePageContent | null;
  getPublishedVersions: () => TemplateVersion[];
  discardChanges: () => void;
}

// Créer une version initiale basée sur le contrat
function createInitialVersion(): TemplateVersion {
  const pages: TemplatePageContent[] = PDF_TEMPLATE_CONTRACT.pages.map(pageConfig => ({
    pageNumber: pageConfig.pageNumber,
    elements: [],
    dynamicZones: pageConfig.dynamicZones as DynamicZone[]
  }));

  return {
    id: `version-${Date.now()}`,
    templateId: PDF_TEMPLATE_CONTRACT.id,
    versionNumber: 1,
    status: 'brouillon',
    createdAt: new Date(),
    createdBy: 'system',
    publishedAt: null,
    pages,
    dynamicZonesIntact: true
  };
}

// Version publiée de démo
function createPublishedDemoVersion(): TemplateVersion {
  const version = createInitialVersion();
  return {
    ...version,
    id: 'version-published-v1',
    versionNumber: 1,
    status: 'publie',
    publishedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  };
}

const initialState: TemplateEditorState = {
  currentVersion: null,
  allVersions: [createPublishedDemoVersion()],
  selectedElement: null,
  selectedPageNumber: 1,
  editorMode: 'view',
  hasUnsavedChanges: false
};

export const useTemplateEditorStore = create<TemplateEditorStore>((set, get) => ({
  ...initialState,

  // Navigation
  setSelectedPage: (pageNumber) => {
    set({ selectedPageNumber: pageNumber, selectedElement: null });
  },

  selectElement: (elementId) => {
    if (!elementId) {
      set({ selectedElement: null });
      return;
    }

    const pageContent = get().getCurrentPageContent();
    if (!pageContent) return;

    const element = pageContent.elements.find(e => e.id === elementId);
    if (element && !element.isDynamic) {
      set({ selectedElement: element });
    }
  },

  setEditorMode: (mode) => {
    set({ editorMode: mode });
  },

  // Édition (protégée)
  updateTextContent: (elementId, content) => {
    const { currentVersion, selectedPageNumber } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') return false;

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) return false;

    const elementIndex = currentVersion.pages[pageIndex].elements.findIndex(e => e.id === elementId);
    if (elementIndex === -1) return false;

    const element = currentVersion.pages[pageIndex].elements[elementIndex];
    if (element.isDynamic) return false; // Protection zone dynamique

    const updatedPages = [...currentVersion.pages];
    const updatedElements = [...updatedPages[pageIndex].elements];
    updatedElements[elementIndex] = {
      ...element,
      content: { ...element.content as TextContent, ...content }
    };
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true
    });
    return true;
  },

  updateElementPosition: (elementId, position) => {
    const { currentVersion, selectedPageNumber } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') return false;

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) return false;

    const elementIndex = currentVersion.pages[pageIndex].elements.findIndex(e => e.id === elementId);
    if (elementIndex === -1) return false;

    const element = currentVersion.pages[pageIndex].elements[elementIndex];
    if (element.isDynamic) return false;

    const updatedPages = [...currentVersion.pages];
    const updatedElements = [...updatedPages[pageIndex].elements];
    updatedElements[elementIndex] = { ...element, position };
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true
    });
    return true;
  },

  updateElementSize: (elementId, size) => {
    const { currentVersion, selectedPageNumber } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') return false;

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) return false;

    const elementIndex = currentVersion.pages[pageIndex].elements.findIndex(e => e.id === elementId);
    if (elementIndex === -1) return false;

    const element = currentVersion.pages[pageIndex].elements[elementIndex];
    if (element.isDynamic) return false;

    const updatedPages = [...currentVersion.pages];
    const updatedElements = [...updatedPages[pageIndex].elements];
    updatedElements[elementIndex] = { ...element, size };
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true
    });
    return true;
  },

  // Protection
  isElementEditable: (elementId) => {
    const pageContent = get().getCurrentPageContent();
    if (!pageContent) return false;

    const element = pageContent.elements.find(e => e.id === elementId);
    return element ? !element.isDynamic : false;
  },

  attemptEditDynamicZone: (zoneId) => {
    return {
      blocked: true,
      error: blockDynamicZoneEdit(zoneId)
    };
  },

  // Versioning
  loadVersion: (version) => {
    set({ 
      currentVersion: version, 
      hasUnsavedChanges: false,
      selectedElement: null,
      selectedPageNumber: 1,
      editorMode: version.status === 'brouillon' ? 'edit' : 'view'
    });
  },

  createNewVersion: () => {
    const { allVersions } = get();
    const maxVersion = Math.max(...allVersions.map(v => v.versionNumber), 0);
    
    const newVersion: TemplateVersion = {
      ...createInitialVersion(),
      id: `version-${Date.now()}`,
      versionNumber: maxVersion + 1,
      createdAt: new Date(),
      createdBy: 'user' // En production, utiliser l'ID utilisateur réel
    };

    set({
      allVersions: [...allVersions, newVersion],
      currentVersion: newVersion,
      hasUnsavedChanges: false,
      editorMode: 'edit'
    });

    return newVersion;
  },

  saveCurrentVersion: () => {
    const { currentVersion, allVersions } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') return;

    const updatedVersions = allVersions.map(v =>
      v.id === currentVersion.id ? currentVersion : v
    );

    set({
      allVersions: updatedVersions,
      hasUnsavedChanges: false
    });
  },

  publishVersion: () => {
    const { currentVersion, allVersions } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') {
      return { canPublish: false, errors: [{ type: 'page_count', message: 'Version non modifiable' }], warnings: [] };
    }

    // Validation obligatoire avant publication
    const validationResult = validateTemplateForPublication(currentVersion);
    
    if (!validationResult.canPublish) {
      return validationResult;
    }

    // Publier la version
    const publishedVersion: TemplateVersion = {
      ...currentVersion,
      status: 'publie',
      publishedAt: new Date(),
      dynamicZonesIntact: true
    };

    const updatedVersions = allVersions.map(v =>
      v.id === currentVersion.id ? publishedVersion : v
    );

    set({
      allVersions: updatedVersions,
      currentVersion: publishedVersion,
      hasUnsavedChanges: false,
      editorMode: 'view'
    });

    return validationResult;
  },

  archiveVersion: (versionId) => {
    const { allVersions, currentVersion } = get();
    
    const updatedVersions = allVersions.map(v =>
      v.id === versionId && v.status === 'publie'
        ? { ...v, status: 'archive' as const }
        : v
    );

    set({ 
      allVersions: updatedVersions,
      currentVersion: currentVersion?.id === versionId 
        ? { ...currentVersion, status: 'archive' }
        : currentVersion
    });
  },

  // Validation
  validateDynamicZonesIntegrity: () => {
    const { currentVersion } = get();
    if (!currentVersion) {
      return { canPublish: false, errors: [{ type: 'page_count', message: 'Aucune version chargée' }], warnings: [] };
    }
    return validateTemplateForPublication(currentVersion);
  },

  // Utilitaires
  getCurrentPageContent: () => {
    const { currentVersion, selectedPageNumber } = get();
    if (!currentVersion) return null;
    return currentVersion.pages.find(p => p.pageNumber === selectedPageNumber) || null;
  },

  getPublishedVersions: () => {
    return get().allVersions.filter(v => v.status === 'publie');
  },

  discardChanges: () => {
    const { currentVersion, allVersions } = get();
    if (!currentVersion) return;

    // Recharger la version originale depuis allVersions
    const originalVersion = allVersions.find(v => v.id === currentVersion.id);
    if (originalVersion) {
      set({
        currentVersion: originalVersion,
        hasUnsavedChanges: false
      });
    }
  }
}));

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
  ImageContent,
  TemplatePageContent,
  PublishValidationResult
} from '@/types/template-editor';
import type { PDFPageNumber, DynamicZone } from '@/types/pdf-template';
import { PDF_TEMPLATE_CONTRACT } from '@/lib/pdf-template-contract';
import { validateTemplateForPublication } from '@/lib/template-validation';
import { blockDynamicZoneEdit, getDynamicZonesForPage } from '@/lib/template-protection';
import { PDF_TEMPLATE_ELEMENTS } from '@/lib/pdf-template-elements';

interface TemplateEditorStore extends TemplateEditorState {
  // Actions de navigation
  setSelectedPage: (pageNumber: PDFPageNumber) => void;
  selectElement: (elementId: string | null) => void;
  setEditorMode: (mode: 'view' | 'edit') => void;

  // Getter pour l'élément sélectionné (dynamique)
  getSelectedElement: () => EditableElement | null;

  // Actions d'édition (éléments NON dynamiques uniquement)
  updateTextContent: (elementId: string, content: Partial<TextContent>) => boolean;
  updateImageContent: (elementId: string, content: Partial<ImageContent>) => boolean;
  updateElementPosition: (elementId: string, position: { x: number; y: number }) => boolean;
  updateElementSize: (elementId: string, size: { width: number; height: number }) => boolean;

  // Ajout d'éléments
  addElementMode: 'none' | 'text' | 'image';
  setAddElementMode: (mode: 'none' | 'text' | 'image') => void;
  addElement: (type: 'text' | 'image', position: { x: number; y: number }) => EditableElement;
  deleteElement: (elementId: string) => boolean;

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

// Créer une version initiale basée sur le contrat avec les éléments réels du PDF
function createInitialVersion(): TemplateVersion {
  const pages: TemplatePageContent[] = PDF_TEMPLATE_CONTRACT.pages.map(pageConfig => ({
    pageNumber: pageConfig.pageNumber,
    elements: PDF_TEMPLATE_ELEMENTS[pageConfig.pageNumber as PDFPageNumber] || [],
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
  selectedElementId: null,
  selectedPageNumber: 1,
  editorMode: 'view',
  hasUnsavedChanges: false,
  addElementMode: 'none'
};

export const useTemplateEditorStore = create<TemplateEditorStore>((set, get) => ({
  ...initialState,

  // Getter dynamique pour l'élément sélectionné
  getSelectedElement: () => {
    const { selectedElementId, currentVersion, selectedPageNumber } = get();
    if (!selectedElementId || !currentVersion) return null;
    
    const page = currentVersion.pages.find(p => p.pageNumber === selectedPageNumber);
    return page?.elements.find(e => e.id === selectedElementId) || null;
  },

  // Navigation
  setSelectedPage: (pageNumber) => {
    set({ selectedPageNumber: pageNumber, selectedElementId: null });
  },

  selectElement: (elementId) => {
    if (!elementId) {
      set({ selectedElementId: null });
      return;
    }

    const pageContent = get().getCurrentPageContent();
    if (!pageContent) return;

    const element = pageContent.elements.find(e => e.id === elementId);
    if (element && !element.isDynamic) {
      set({ selectedElementId: elementId });
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

  // Modification d'image
  updateImageContent: (elementId, content) => {
    const { currentVersion, selectedPageNumber } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') return false;

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) return false;

    const elementIndex = currentVersion.pages[pageIndex].elements.findIndex(e => e.id === elementId);
    if (elementIndex === -1) return false;

    const element = currentVersion.pages[pageIndex].elements[elementIndex];
    if (element.isDynamic || element.type !== 'image') return false;

    const updatedPages = [...currentVersion.pages];
    const updatedElements = [...updatedPages[pageIndex].elements];
    updatedElements[elementIndex] = {
      ...element,
      content: { ...(element.content as ImageContent), ...content }
    };
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true
    });
    return true;
  },

  // Mode ajout d'éléments
  setAddElementMode: (mode) => {
    set({ addElementMode: mode });
  },

  // Ajout d'un nouvel élément
  addElement: (type, position) => {
    const { currentVersion, selectedPageNumber } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') {
      throw new Error('Cannot add element to non-draft version');
    }

    const newElement: EditableElement = {
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      pageNumber: selectedPageNumber,
      isDynamic: false,
      position,
      size: type === 'text' ? { width: 150, height: 30 } : { width: 100, height: 80 },
      content: type === 'text' 
        ? { text: 'Nouveau texte', fontFamily: 'DM Sans', fontSize: 12, color: '#1f2937', bold: false, italic: false, underline: false }
        : { imageUrl: '', alt: 'Nouvelle image' }
    };

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) {
      throw new Error('Page not found');
    }

    const updatedPages = [...currentVersion.pages];
    const updatedElements = [...updatedPages[pageIndex].elements, newElement];
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true,
      selectedElementId: newElement.id,
      addElementMode: 'none'
    });

    return newElement;
  },

  // Suppression d'un élément
  deleteElement: (elementId) => {
    const { currentVersion, selectedPageNumber, selectedElementId } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') return false;

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) return false;

    const element = currentVersion.pages[pageIndex].elements.find(e => e.id === elementId);
    if (!element || element.isDynamic) return false;

    const updatedPages = [...currentVersion.pages];
    const updatedElements = updatedPages[pageIndex].elements.filter(e => e.id !== elementId);
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true,
      selectedElementId: selectedElementId === elementId ? null : selectedElementId
    });
    return true;
  },

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
      selectedElementId: null,
      selectedPageNumber: 1,
      editorMode: version.status === 'brouillon' ? 'edit' : 'view'
    });
  },

  createNewVersion: () => {
    const { allVersions, currentVersion, selectedElementId } = get();
    const maxVersion = Math.max(...allVersions.map(v => v.versionNumber), 0);
    
    // Clone profond de la version courante si elle existe, sinon version initiale
    const baseVersion = currentVersion 
      ? {
          ...currentVersion,
          pages: currentVersion.pages.map(page => ({
            ...page,
            elements: page.elements.map(el => ({
              ...el,
              position: { ...el.position },
              size: { ...el.size },
              content: el.content ? { ...el.content } : undefined
            })),
            dynamicZones: page.dynamicZones.map(zone => ({ ...zone }))
          }))
        }
      : createInitialVersion();

    const newVersion: TemplateVersion = {
      ...baseVersion,
      id: `version-${Date.now()}`,
      versionNumber: maxVersion + 1,
      status: 'brouillon',
      createdAt: new Date(),
      createdBy: 'user',
      publishedAt: null,
      dynamicZonesIntact: true
    };

    set({
      allVersions: [...allVersions, newVersion],
      currentVersion: newVersion,
      hasUnsavedChanges: false,
      editorMode: 'edit',
      selectedElementId: selectedElementId // Conserver la sélection
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

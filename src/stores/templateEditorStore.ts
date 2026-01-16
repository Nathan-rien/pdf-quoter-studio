/**
 * Store Zustand pour l'éditeur de template PDF
 * Gère l'état de l'éditeur et les actions autorisées
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  TemplateVersion, 
  EditableElement, 
  TemplateEditorState,
  TextContent,
  ImageContent,
  ShapeContent,
  ShapeType,
  ShapeInnerContent,
  TemplatePageContent,
  PublishValidationResult,
  PDFTemplate,
  IconContent
} from '@/types/template-editor';
import type { PDFPageNumber, DynamicZone } from '@/types/pdf-template';
import { PDF_TEMPLATE_CONTRACT } from '@/lib/pdf-template-contract';
import { validateTemplateForPublication } from '@/lib/template-validation';
import { blockDynamicZoneEdit } from '@/lib/template-protection';
import { PDF_TEMPLATE_ELEMENTS } from '@/lib/pdf-template-elements';
import { SHAPE_DEFAULT_SIZES } from '@/lib/template-styles';
import { getLogoById } from '@/lib/template-logos';

interface TemplateEditorStore extends TemplateEditorState {
  // Actions templates
  loadTemplateList: () => void;
  selectTemplate: (templateId: string) => void;
  createNewTemplate: (name: string, description?: string) => PDFTemplate | null;
  duplicateTemplate: (templateId: string, newName: string, description?: string, includeAllVersions?: boolean) => PDFTemplate | null;
  renameTemplate: (templateId: string, newName: string) => void;
  deleteTemplate: (templateId: string) => boolean;
  setTemplateActive: (templateId: string) => void;
  backToList: () => void;
  
  // Getters templates
  getActiveTemplate: () => PDFTemplate | null;
  getTemplateVersions: (templateId: string) => TemplateVersion[];
  getTemplateLatestVersion: (templateId: string) => TemplateVersion | null;

  // Actions de navigation
  setSelectedPage: (pageNumber: PDFPageNumber) => void;
  selectElement: (elementId: string | null) => void;
  toggleElementSelection: (elementId: string) => void; // Multi-sélection avec Ctrl+clic
  selectMultipleElements: (elementIds: string[]) => void;
  clearSelection: () => void;
  getSelectedElements: () => EditableElement[];
  setEditorMode: (mode: 'view' | 'edit') => void;
  
  // Édition inline
  setInlineEditing: (elementId: string | null) => void;

  // Getter pour l'élément sélectionné (dynamique)
  getSelectedElement: () => EditableElement | null;

  // Actions d'édition (éléments NON dynamiques uniquement)
  updateTextContent: (elementId: string, content: Partial<TextContent>) => boolean;
  updateImageContent: (elementId: string, content: Partial<ImageContent>) => boolean;
  updateElementPosition: (elementId: string, position: { x: number; y: number }) => boolean;
  updateElementSize: (elementId: string, size: { width: number; height: number }) => boolean;
  
  // Actions multi-sélection
  moveSelectedElements: (deltaX: number, deltaY: number) => boolean;
  deleteSelectedElements: () => number;
  duplicateSelectedElements: () => EditableElement[];
  
  // Presse-papier
  copySelectedElements: () => void;
  pasteElements: () => EditableElement[];
  
  // Historique (Undo)
  undo: () => boolean;
  canUndo: () => boolean;

  // Ajout d'éléments
  setAddElementMode: (mode: 'none' | 'text' | 'image' | 'shape' | 'icon' | 'logo') => void;
  setSelectedShapeType: (type: ShapeType | null) => void;
  setSelectedIconName: (name: string | null) => void;
  setSelectedLogoId: (id: string | null) => void;
  addElement: (type: 'text' | 'image', position: { x: number; y: number }) => EditableElement;
  addShape: (shapeType: ShapeType, position: { x: number; y: number }) => EditableElement;
  addIcon: (iconName: string, position: { x: number; y: number }) => EditableElement;
  addLogo: (logoId: string, position: { x: number; y: number }) => EditableElement;
  deleteElement: (elementId: string) => boolean;
  duplicateElement: (elementId: string) => EditableElement | null;
  
  // Actions spécifiques aux formes
  updateShapeContent: (elementId: string, content: Partial<ShapeContent>) => boolean;
  updateShapeInnerContent: (elementId: string, innerContent: Partial<ShapeInnerContent>) => boolean;
  toggleAspectRatioLock: (elementId: string) => boolean;
  toggleElementLock: (elementId: string) => boolean;
  
  // Actions spécifiques aux icônes
  updateIconContent: (elementId: string, content: Partial<IconContent>) => boolean;
  
  // Gestion des calques
  updateElementZIndex: (elementId: string, zIndex: number) => boolean;
  bringToFront: (elementId: string) => boolean;
  sendToBack: (elementId: string) => boolean;

  // Protection des zones dynamiques
  isElementEditable: (elementId: string) => boolean;
  attemptEditDynamicZone: (zoneId: string) => { blocked: true; error: ReturnType<typeof blockDynamicZoneEdit> };
  
  // Position des zones dynamiques
  updateDynamicZonePosition: (zoneId: string, position: { top: number; height: number }) => boolean;
  selectedDynamicZoneId: string | null;
  selectDynamicZone: (zoneId: string | null) => void;

  // Préparation du mode édition depuis l'aperçu (initialise une version de travail)
  preparePreviewEditing: (templateId: string) => { versionId: string; status: string } | null;
  
  // Mise à jour depuis l'aperçu (sans dépendre de selectedPageNumber ou status brouillon)
  // Autonome : initialise currentVersion si nécessaire
  updateElementFromPreview: (
    elementId: string, 
    pageNumber: PDFPageNumber, 
    updates: { position?: { x: number; y: number }; size?: { width: number; height: number } }
  ) => boolean;
  
  // Getter pour obtenir la version de travail courante (pour l'aperçu en mode édition)
  getCurrentVersionForPreview: () => TemplateVersion | null;

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
function createInitialVersion(templateId: string): TemplateVersion {
  const pages: TemplatePageContent[] = PDF_TEMPLATE_CONTRACT.pages.map(pageConfig => ({
    pageNumber: pageConfig.pageNumber,
    elements: PDF_TEMPLATE_ELEMENTS[pageConfig.pageNumber as PDFPageNumber] || [],
    dynamicZones: pageConfig.dynamicZones as DynamicZone[]
  }));

  return {
    id: `version-${Date.now()}`,
    templateId,
    versionNumber: 1,
    status: 'brouillon',
    createdAt: new Date(),
    createdBy: 'system',
    publishedAt: null,
    pages,
    dynamicZonesIntact: true
  };
}

// Version publiée de démo pour le template par défaut
function createPublishedDemoVersion(templateId: string): TemplateVersion {
  const version = createInitialVersion(templateId);
  return {
    ...version,
    id: 'version-published-v1',
    versionNumber: 1,
    status: 'publie',
    publishedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  };
}

// Template par défaut
const DEFAULT_TEMPLATE: PDFTemplate = {
  id: 'cybertek-pro-default',
  name: 'Proposition Commerciale CybertekPro',
  description: 'Template par défaut pour les propositions commerciales',
  createdAt: new Date('2025-01-01'),
  createdBy: 'system',
  updatedAt: new Date('2025-01-01'),
  isActive: true
};

// Presse-papier (non persisté)
let clipboard: EditableElement[] = [];

// Historique pour undo (non persisté) - stocke les versions précédentes des pages
interface HistoryEntry {
  pages: TemplatePageContent[];
  selectedElementId: string | null;
  selectedElementIds: string[];
}
const MAX_HISTORY_SIZE = 50;
let undoHistory: HistoryEntry[] = [];

// Helper pour sauvegarder l'état actuel dans l'historique
const saveToHistory = (state: TemplateEditorState) => {
  if (!state.currentVersion) return;
  
  undoHistory.push({
    pages: JSON.parse(JSON.stringify(state.currentVersion.pages)),
    selectedElementId: state.selectedElementId,
    selectedElementIds: [...state.selectedElementIds]
  });
  
  // Limiter la taille de l'historique
  if (undoHistory.length > MAX_HISTORY_SIZE) {
    undoHistory.shift();
  }
};

const initialState: TemplateEditorState = {
  // Templates
  allTemplates: [DEFAULT_TEMPLATE],
  currentTemplateId: null,
  viewMode: 'list',
  
  // Versions
  currentVersion: null,
  allVersions: [createPublishedDemoVersion(DEFAULT_TEMPLATE.id)],
  selectedElementId: null,
  selectedElementIds: [],
  selectedDynamicZoneId: null,
  selectedPageNumber: 1,
  editorMode: 'view',
  hasUnsavedChanges: false,
  addElementMode: 'none',
  selectedShapeType: null,
  selectedIconName: null,
  selectedLogoId: null,
  inlineEditingElementId: null
};

// Helper pour convertir les strings en dates lors de la désérialisation
const deserializeDates = (data: any) => {
  if (!data?.state) return data;
  
  return {
    ...data,
    state: {
      ...data.state,
      allTemplates: data.state.allTemplates?.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      })) || [],
      allVersions: data.state.allVersions?.map((v: any) => ({
        ...v,
        createdAt: new Date(v.createdAt),
        publishedAt: v.publishedAt ? new Date(v.publishedAt) : null,
      })) || [],
    },
  };
};

export const useTemplateEditorStore = create<TemplateEditorStore>()(
  persist(
    (set, get) => ({
  ...initialState,

  // === Actions Templates ===
  
  loadTemplateList: () => {
    set({ viewMode: 'list', currentTemplateId: null, currentVersion: null });
  },

  selectTemplate: (templateId) => {
    const { allVersions, allTemplates } = get();
    const template = allTemplates.find(t => t.id === templateId);
    if (!template) return;

    // Charger les versions de ce template
    const templateVersions = allVersions.filter(v => v.templateId === templateId);
    
    // Sélectionner la version la plus récente (publiée en priorité, sinon brouillon)
    const publishedVersions = templateVersions.filter(v => v.status === 'publie');
    const latestVersion = publishedVersions.length > 0 
      ? publishedVersions.reduce((a, b) => a.versionNumber > b.versionNumber ? a : b)
      : templateVersions.length > 0 
        ? templateVersions.reduce((a, b) => a.versionNumber > b.versionNumber ? a : b)
        : createInitialVersion(templateId);

    set({
      viewMode: 'editor',
      currentTemplateId: templateId,
      currentVersion: latestVersion,
      selectedPageNumber: 1,
      selectedElementId: null,
      editorMode: latestVersion.status === 'brouillon' ? 'edit' : 'view'
    });
  },

  createNewTemplate: (name, description = '') => {
    const newTemplate: PDFTemplate = {
      id: `template-${Date.now()}`,
      name,
      description,
      createdAt: new Date(),
      createdBy: 'user',
      updatedAt: new Date(),
      isActive: false
    };

    const initialVersion = createInitialVersion(newTemplate.id);

    set(state => ({
      allTemplates: [...state.allTemplates, newTemplate],
      allVersions: [...state.allVersions, initialVersion]
    }));

    return newTemplate;
  },

  duplicateTemplate: (templateId, newName, description, includeAllVersions = false) => {
    const { allTemplates, allVersions } = get();
    const sourceTemplate = allTemplates.find(t => t.id === templateId);
    if (!sourceTemplate) return null;

    const newTemplateId = `template-${Date.now()}`;
    const newTemplate: PDFTemplate = {
      id: newTemplateId,
      name: newName,
      description: description ?? sourceTemplate.description,
      createdAt: new Date(),
      createdBy: 'user',
      updatedAt: new Date(),
      isActive: false
    };

    // Récupérer les versions à dupliquer
    const sourceVersions = allVersions.filter(v => v.templateId === templateId);
    let versionsToDuplicate: TemplateVersion[];

    if (includeAllVersions) {
      versionsToDuplicate = sourceVersions;
    } else {
      // Seulement la dernière version publiée, ou la dernière version
      const publishedVersions = sourceVersions.filter(v => v.status === 'publie');
      const latestVersion = publishedVersions.length > 0
        ? publishedVersions.reduce((a, b) => a.versionNumber > b.versionNumber ? a : b)
        : sourceVersions.length > 0
          ? sourceVersions.reduce((a, b) => a.versionNumber > b.versionNumber ? a : b)
          : null;
      versionsToDuplicate = latestVersion ? [latestVersion] : [];
    }

    // Cloner les versions avec nouveaux IDs
    const duplicatedVersions: TemplateVersion[] = versionsToDuplicate.map((v, index) => ({
      ...v,
      id: `version-${Date.now()}-${index}`,
      templateId: newTemplateId,
      versionNumber: index + 1,
      status: 'brouillon' as const,
      createdAt: new Date(),
      publishedAt: null,
      pages: v.pages.map(page => ({
        ...page,
        elements: page.elements.map(el => ({
          ...el,
          id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          position: { ...el.position },
          size: { ...el.size },
          content: el.content ? { ...el.content } : el.content
        })),
        dynamicZones: page.dynamicZones.map(zone => ({ ...zone }))
      }))
    }));

    // Si aucune version n'a été dupliquée, créer une version initiale
    if (duplicatedVersions.length === 0) {
      duplicatedVersions.push(createInitialVersion(newTemplateId));
    }

    set(state => ({
      allTemplates: [...state.allTemplates, newTemplate],
      allVersions: [...state.allVersions, ...duplicatedVersions]
    }));

    return newTemplate;
  },

  renameTemplate: (templateId, newName) => {
    set(state => ({
      allTemplates: state.allTemplates.map(t =>
        t.id === templateId ? { ...t, name: newName, updatedAt: new Date() } : t
      )
    }));
  },

  deleteTemplate: (templateId) => {
    const { allTemplates, currentTemplateId } = get();
    const template = allTemplates.find(t => t.id === templateId);
    
    // Ne pas supprimer le template actif
    if (!template || template.isActive) return false;

    set(state => ({
      allTemplates: state.allTemplates.filter(t => t.id !== templateId),
      allVersions: state.allVersions.filter(v => v.templateId !== templateId),
      currentTemplateId: currentTemplateId === templateId ? null : currentTemplateId,
      currentVersion: currentTemplateId === templateId ? null : state.currentVersion,
      viewMode: currentTemplateId === templateId ? 'list' : state.viewMode
    }));

    return true;
  },

  setTemplateActive: (templateId) => {
    set(state => ({
      allTemplates: state.allTemplates.map(t => ({
        ...t,
        isActive: t.id === templateId
      }))
    }));
  },

  backToList: () => {
    set({ viewMode: 'list', currentTemplateId: null, currentVersion: null });
  },

  // Getters templates
  getActiveTemplate: () => {
    return get().allTemplates.find(t => t.isActive) || null;
  },

  getTemplateVersions: (templateId) => {
    return get().allVersions.filter(v => v.templateId === templateId);
  },

  getTemplateLatestVersion: (templateId) => {
    const versions = get().allVersions.filter(v => v.templateId === templateId);
    if (versions.length === 0) return null;
    
    const publishedVersions = versions.filter(v => v.status === 'publie');
    if (publishedVersions.length > 0) {
      return publishedVersions.reduce((a, b) => a.versionNumber > b.versionNumber ? a : b);
    }
    return versions.reduce((a, b) => a.versionNumber > b.versionNumber ? a : b);
  },

  // === Actions Navigation (existantes) ===

  // Getter dynamique pour l'élément sélectionné
  getSelectedElement: () => {
    const { selectedElementId, currentVersion, selectedPageNumber } = get();
    if (!selectedElementId || !currentVersion) return null;
    
    const page = currentVersion.pages.find(p => p.pageNumber === selectedPageNumber);
    return page?.elements.find(e => e.id === selectedElementId) || null;
  },

  // Navigation
  setSelectedPage: (pageNumber) => {
    set({ selectedPageNumber: pageNumber, selectedElementId: null, selectedElementIds: [] });
  },

  selectElement: (elementId) => {
    if (!elementId) {
      set({ selectedElementId: null, selectedElementIds: [] });
      return;
    }

    const pageContent = get().getCurrentPageContent();
    if (!pageContent) return;

    const element = pageContent.elements.find(e => e.id === elementId);
    if (element && !element.isDynamic) {
      set({ selectedElementId: elementId, selectedElementIds: [elementId] });
    }
  },

  // Multi-sélection avec Ctrl+clic
  toggleElementSelection: (elementId) => {
    const { selectedElementIds } = get();
    const pageContent = get().getCurrentPageContent();
    if (!pageContent) return;

    const element = pageContent.elements.find(e => e.id === elementId);
    if (!element || element.isDynamic) return;

    let newSelectedIds: string[];
    if (selectedElementIds.includes(elementId)) {
      // Retirer de la sélection
      newSelectedIds = selectedElementIds.filter(id => id !== elementId);
    } else {
      // Ajouter à la sélection
      newSelectedIds = [...selectedElementIds, elementId];
    }

    set({ 
      selectedElementIds: newSelectedIds,
      selectedElementId: newSelectedIds.length === 1 ? newSelectedIds[0] : (newSelectedIds.length > 0 ? newSelectedIds[0] : null)
    });
  },

  selectMultipleElements: (elementIds) => {
    const pageContent = get().getCurrentPageContent();
    if (!pageContent) return;

    // Filtrer seulement les éléments valides et non-dynamiques
    const validIds = elementIds.filter(id => {
      const element = pageContent.elements.find(e => e.id === id);
      return element && !element.isDynamic;
    });

    set({
      selectedElementIds: validIds,
      selectedElementId: validIds.length > 0 ? validIds[0] : null
    });
  },

  clearSelection: () => {
    set({ selectedElementId: null, selectedElementIds: [] });
  },

  getSelectedElements: () => {
    const { selectedElementIds, currentVersion, selectedPageNumber } = get();
    if (!currentVersion) return [];
    
    const page = currentVersion.pages.find(p => p.pageNumber === selectedPageNumber);
    if (!page) return [];

    return selectedElementIds
      .map(id => page.elements.find(e => e.id === id))
      .filter((e): e is EditableElement => e !== undefined && !e.isDynamic);
  },

  setEditorMode: (mode) => {
    set({ editorMode: mode });
  },

  // Édition inline
  setInlineEditing: (elementId) => {
    set({ inlineEditingElementId: elementId });
  },

  // Édition (protégée)
  updateTextContent: (elementId, content) => {
    const state = get();
    const { currentVersion, selectedPageNumber } = state;
    if (!currentVersion || currentVersion.status !== 'brouillon') return false;

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) return false;

    const elementIndex = currentVersion.pages[pageIndex].elements.findIndex(e => e.id === elementId);
    if (elementIndex === -1) return false;

    const element = currentVersion.pages[pageIndex].elements[elementIndex];
    if (element.isDynamic) return false; // Protection zone dynamique

    // Sauvegarder dans l'historique avant modification
    saveToHistory(state);

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
    set({ addElementMode: mode, selectedShapeType: mode === 'shape' ? null : null, selectedIconName: mode === 'icon' ? null : null });
  },

  setSelectedShapeType: (type) => {
    set({ selectedShapeType: type });
  },

  setSelectedIconName: (name) => {
    set({ selectedIconName: name });
  },

  // Ajout d'un nouvel élément
  addElement: (type, position) => {
    const { currentVersion, selectedPageNumber } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') {
      throw new Error('Cannot add element to non-draft version');
    }

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) {
      throw new Error('Page not found');
    }

    // Calculer le zIndex maximum actuel sur la page
    const existingElements = currentVersion.pages[pageIndex].elements.filter(e => !e.isDynamic);
    const maxZIndex = existingElements.reduce((max, el) => Math.max(max, el.zIndex || 0), 0);

    const newElement: EditableElement = {
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      pageNumber: selectedPageNumber,
      isDynamic: false,
      position,
      size: type === 'text' ? { width: 150, height: 30 } : { width: 100, height: 80 },
      content: type === 'text' 
        ? { 
            text: 'Nouveau texte', 
            fontFamily: 'DM Sans', 
            fontSize: 12, 
            color: '#1f2937', 
            bold: false, 
            italic: false, 
            underline: false,
            listType: 'none',
            indentLevel: 0
          }
        : { 
            imageUrl: '', 
            alt: 'Nouvelle image',
            rotation: 0,
            opacity: 100
          },
      zIndex: maxZIndex + 1
    };

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
    const state = get();
    const { currentVersion, selectedPageNumber, selectedElementId } = state;
    if (!currentVersion || currentVersion.status !== 'brouillon') return false;

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) return false;

    const element = currentVersion.pages[pageIndex].elements.find(e => e.id === elementId);
    if (!element || element.isDynamic) return false;

    // Sauvegarder dans l'historique avant suppression
    saveToHistory(state);

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

  // Ajout d'une forme
  addShape: (shapeType, position) => {
    const { currentVersion, selectedPageNumber } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') {
      throw new Error('Cannot add shape to non-draft version');
    }

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) {
      throw new Error('Page not found');
    }

    const existingElements = currentVersion.pages[pageIndex].elements.filter(e => !e.isDynamic);
    const maxZIndex = existingElements.reduce((max, el) => Math.max(max, el.zIndex || 0), 0);
    const defaultSize = SHAPE_DEFAULT_SIZES[shapeType];

    const isLine = shapeType === 'line' || shapeType === 'line-vertical';
    
    const defaultContent: ShapeContent = {
      shapeType,
      backgroundColor: isLine ? 'transparent' : '#f3f4f6',
      backgroundOpacity: 100,
      border: {
        enabled: true,
        color: '#1f2937',
        width: isLine ? 2 : 1
      },
      cornerRadius: shapeType === 'rounded-rectangle' ? 8 : 0,
      rotation: 0,
      aspectRatioLocked: shapeType === 'square' || shapeType === 'circle',
      isLocked: false,
      lineStyle: 'solid'
    };

    const newElement: EditableElement = {
      id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'shape',
      pageNumber: selectedPageNumber,
      isDynamic: false,
      position,
      size: { ...defaultSize },
      content: defaultContent,
      zIndex: maxZIndex + 1
    };

    const updatedPages = [...currentVersion.pages];
    const updatedElements = [...updatedPages[pageIndex].elements, newElement];
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true,
      selectedElementId: newElement.id,
      addElementMode: 'none',
      selectedShapeType: null,
      selectedIconName: null
    });

    return newElement;
  },

  // Setter pour l'ID du logo sélectionné
  setSelectedLogoId: (id) => set({ selectedLogoId: id }),

  // Ajout d'un logo (crée un élément image)
  addLogo: (logoId, position) => {
    const { currentVersion, selectedPageNumber } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') {
      throw new Error('Cannot add logo to non-draft version');
    }

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) {
      throw new Error('Page not found');
    }

    const logo = getLogoById(logoId);
    if (!logo) {
      throw new Error('Logo not found');
    }

    const existingElements = currentVersion.pages[pageIndex].elements.filter(e => !e.isDynamic);
    const maxZIndex = existingElements.reduce((max, el) => Math.max(max, el.zIndex || 0), 0);

    const defaultContent: ImageContent = {
      imageUrl: logo.url,
      alt: logo.description,
      rotation: 0,
      opacity: 100,
      objectFit: 'contain'
    };

    const newElement: EditableElement = {
      id: `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'image',
      pageNumber: selectedPageNumber,
      isDynamic: false,
      position,
      size: { width: 120, height: 50 }, // Taille par défaut pour un logo
      content: defaultContent,
      zIndex: maxZIndex + 1
    };

    const updatedPages = [...currentVersion.pages];
    const updatedElements = [...updatedPages[pageIndex].elements, newElement];
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true,
      selectedElementId: newElement.id,
      selectedElementIds: [newElement.id],
      addElementMode: 'none',
      selectedLogoId: null
    });

    return newElement;
  },

  // Ajout d'une icône
  addIcon: (iconName, position) => {
    const { currentVersion, selectedPageNumber } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') {
      throw new Error('Cannot add icon to non-draft version');
    }

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) {
      throw new Error('Page not found');
    }

    const existingElements = currentVersion.pages[pageIndex].elements.filter(e => !e.isDynamic);
    const maxZIndex = existingElements.reduce((max, el) => Math.max(max, el.zIndex || 0), 0);

    const defaultContent: IconContent = {
      iconName,
      size: 32,
      color: '#1f2937',
      strokeWidth: 2,
      rotation: 0
    };

    const newElement: EditableElement = {
      id: `icon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'icon',
      pageNumber: selectedPageNumber,
      isDynamic: false,
      position,
      size: { width: 48, height: 48 },
      content: defaultContent,
      zIndex: maxZIndex + 1
    };

    const updatedPages = [...currentVersion.pages];
    const updatedElements = [...updatedPages[pageIndex].elements, newElement];
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true,
      selectedElementId: newElement.id,
      selectedElementIds: [newElement.id],
      addElementMode: 'none',
      selectedIconName: null
    });

    return newElement;
  },

  // Duplication d'un élément
  duplicateElement: (elementId) => {
    const { currentVersion, selectedPageNumber } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') return null;

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) return null;

    const element = currentVersion.pages[pageIndex].elements.find(e => e.id === elementId);
    if (!element || element.isDynamic) return null;

    const existingElements = currentVersion.pages[pageIndex].elements.filter(e => !e.isDynamic);
    const maxZIndex = existingElements.reduce((max, el) => Math.max(max, el.zIndex || 0), 0);

    const duplicatedElement: EditableElement = {
      ...element,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: { x: element.position.x + 20, y: element.position.y + 20 },
      content: { ...element.content },
      zIndex: maxZIndex + 1
    };

    const updatedPages = [...currentVersion.pages];
    const updatedElements = [...updatedPages[pageIndex].elements, duplicatedElement];
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true,
      selectedElementId: duplicatedElement.id,
      selectedElementIds: [duplicatedElement.id]
    });

    return duplicatedElement;
  },

  // Déplacer tous les éléments sélectionnés
  moveSelectedElements: (deltaX, deltaY) => {
    const { currentVersion, selectedPageNumber, selectedElementIds } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') return false;
    if (selectedElementIds.length === 0) return false;

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) return false;

    const updatedPages = [...currentVersion.pages];
    const updatedElements = [...updatedPages[pageIndex].elements];

    let movedCount = 0;
    selectedElementIds.forEach(elementId => {
      const elementIndex = updatedElements.findIndex(e => e.id === elementId);
      if (elementIndex === -1) return;

      const element = updatedElements[elementIndex];
      if (element.isDynamic) return;

      // Pour les formes verrouillées, ne pas déplacer
      if (element.type === 'shape') {
        const shapeContent = element.content as ShapeContent;
        if (shapeContent.isLocked) return;
      }

      updatedElements[elementIndex] = {
        ...element,
        position: {
          x: Math.max(0, element.position.x + deltaX),
          y: Math.max(0, element.position.y + deltaY)
        }
      };
      movedCount++;
    });

    if (movedCount === 0) return false;

    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true
    });
    return true;
  },

  // Supprimer tous les éléments sélectionnés
  deleteSelectedElements: () => {
    const state = get();
    const { currentVersion, selectedPageNumber, selectedElementIds } = state;
    if (!currentVersion || currentVersion.status !== 'brouillon') return 0;
    if (selectedElementIds.length === 0) return 0;

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) return 0;

    // Sauvegarder dans l'historique avant suppression
    saveToHistory(state);

    const elementsToDelete = new Set(selectedElementIds);
    const updatedPages = [...currentVersion.pages];
    const originalLength = updatedPages[pageIndex].elements.length;
    
    // Filtrer les éléments non-dynamiques qui sont dans la sélection
    const updatedElements = updatedPages[pageIndex].elements.filter(e => {
      if (e.isDynamic) return true; // Garder les éléments dynamiques
      return !elementsToDelete.has(e.id);
    });

    const deletedCount = originalLength - updatedElements.length;
    if (deletedCount === 0) return 0;

    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true,
      selectedElementId: null,
      selectedElementIds: []
    });

    return deletedCount;
  },

  // Dupliquer tous les éléments sélectionnés
  duplicateSelectedElements: () => {
    const { currentVersion, selectedPageNumber, selectedElementIds } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') return [];
    if (selectedElementIds.length === 0) return [];

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) return [];

    const existingElements = currentVersion.pages[pageIndex].elements.filter(e => !e.isDynamic);
    let maxZIndex = existingElements.reduce((max, el) => Math.max(max, el.zIndex || 0), 0);

    const duplicatedElements: EditableElement[] = [];
    const updatedPages = [...currentVersion.pages];
    const updatedElements = [...updatedPages[pageIndex].elements];

    selectedElementIds.forEach(elementId => {
      const element = updatedPages[pageIndex].elements.find(e => e.id === elementId);
      if (!element || element.isDynamic) return;

      maxZIndex++;
      const duplicated: EditableElement = {
        ...element,
        id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        position: { x: element.position.x + 20, y: element.position.y + 20 },
        content: { ...element.content },
        zIndex: maxZIndex
      };

      updatedElements.push(duplicated);
      duplicatedElements.push(duplicated);
    });

    if (duplicatedElements.length === 0) return [];

    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true,
      selectedElementIds: duplicatedElements.map(e => e.id),
      selectedElementId: duplicatedElements.length > 0 ? duplicatedElements[0].id : null
    });

    return duplicatedElements;
  },

  // Copier les éléments sélectionnés dans le presse-papier
  copySelectedElements: () => {
    const { currentVersion, selectedPageNumber, selectedElementIds } = get();
    if (!currentVersion || selectedElementIds.length === 0) return;

    const page = currentVersion.pages.find(p => p.pageNumber === selectedPageNumber);
    if (!page) return;

    // Copier les éléments non-dynamiques sélectionnés
    clipboard = selectedElementIds
      .map(id => page.elements.find(e => e.id === id))
      .filter((e): e is EditableElement => e !== undefined && !e.isDynamic)
      .map(e => ({
        ...e,
        content: { ...e.content }
      }));
  },

  // Coller les éléments du presse-papier
  pasteElements: () => {
    const { currentVersion, selectedPageNumber } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') return [];
    if (clipboard.length === 0) return [];

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) return [];

    const existingElements = currentVersion.pages[pageIndex].elements.filter(e => !e.isDynamic);
    let maxZIndex = existingElements.reduce((max, el) => Math.max(max, el.zIndex || 0), 0);

    const pastedElements: EditableElement[] = [];
    const updatedPages = [...currentVersion.pages];
    const updatedElements = [...updatedPages[pageIndex].elements];

    clipboard.forEach(element => {
      maxZIndex++;
      const pasted: EditableElement = {
        ...element,
        id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        pageNumber: selectedPageNumber,
        position: { x: element.position.x + 20, y: element.position.y + 20 },
        content: { ...element.content },
        zIndex: maxZIndex
      };

      updatedElements.push(pasted);
      pastedElements.push(pasted);
    });

    if (pastedElements.length === 0) return [];

    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true,
      selectedElementIds: pastedElements.map(e => e.id),
      selectedElementId: pastedElements.length > 0 ? pastedElements[0].id : null
    });

    return pastedElements;
  },

  // Mise à jour du contenu d'une forme
  updateShapeContent: (elementId, content) => {
    const { currentVersion, selectedPageNumber } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') return false;

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) return false;

    const elementIndex = currentVersion.pages[pageIndex].elements.findIndex(e => e.id === elementId);
    if (elementIndex === -1) return false;

    const element = currentVersion.pages[pageIndex].elements[elementIndex];
    if (element.isDynamic || element.type !== 'shape') return false;

    const shapeContent = element.content as ShapeContent;
    if (shapeContent.isLocked) return false;

    const updatedPages = [...currentVersion.pages];
    const updatedElements = [...updatedPages[pageIndex].elements];
    updatedElements[elementIndex] = {
      ...element,
      content: { ...shapeContent, ...content }
    };
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true
    });
    return true;
  },

  // Mise à jour du contenu interne d'une forme
  updateShapeInnerContent: (elementId, innerContent) => {
    const { currentVersion, selectedPageNumber } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') return false;

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) return false;

    const elementIndex = currentVersion.pages[pageIndex].elements.findIndex(e => e.id === elementId);
    if (elementIndex === -1) return false;

    const element = currentVersion.pages[pageIndex].elements[elementIndex];
    if (element.isDynamic || element.type !== 'shape') return false;

    const shapeContent = element.content as ShapeContent;
    if (shapeContent.isLocked) return false;

    const currentInnerContent: ShapeInnerContent = shapeContent.innerContent || {
      alignment: { horizontal: 'center', vertical: 'center' },
      padding: 8
    };

    const updatedPages = [...currentVersion.pages];
    const updatedElements = [...updatedPages[pageIndex].elements];
    updatedElements[elementIndex] = {
      ...element,
      content: { 
        ...shapeContent, 
        innerContent: { ...currentInnerContent, ...innerContent }
      }
    };
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true
    });
    return true;
  },

  // Verrouillage du ratio d'aspect
  toggleAspectRatioLock: (elementId) => {
    const { currentVersion, selectedPageNumber } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') return false;

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) return false;

    const elementIndex = currentVersion.pages[pageIndex].elements.findIndex(e => e.id === elementId);
    if (elementIndex === -1) return false;

    const element = currentVersion.pages[pageIndex].elements[elementIndex];
    if (element.isDynamic || element.type !== 'shape') return false;

    const shapeContent = element.content as ShapeContent;

    const updatedPages = [...currentVersion.pages];
    const updatedElements = [...updatedPages[pageIndex].elements];
    updatedElements[elementIndex] = {
      ...element,
      content: { ...shapeContent, aspectRatioLocked: !shapeContent.aspectRatioLocked }
    };
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true
    });
    return true;
  },

  // Verrouillage d'une forme
  toggleElementLock: (elementId) => {
    const { currentVersion, selectedPageNumber } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') return false;

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) return false;

    const elementIndex = currentVersion.pages[pageIndex].elements.findIndex(e => e.id === elementId);
    if (elementIndex === -1) return false;

    const element = currentVersion.pages[pageIndex].elements[elementIndex];
    if (element.isDynamic || element.type !== 'shape') return false;

    const shapeContent = element.content as ShapeContent;

    const updatedPages = [...currentVersion.pages];
    const updatedElements = [...updatedPages[pageIndex].elements];
    updatedElements[elementIndex] = {
      ...element,
      content: { ...shapeContent, isLocked: !shapeContent.isLocked }
    };
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true
    });
    return true;
  },

  // Modification du contenu d'une icône
  updateIconContent: (elementId, content) => {
    const { currentVersion, selectedPageNumber } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') return false;

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) return false;

    const elementIndex = currentVersion.pages[pageIndex].elements.findIndex(e => e.id === elementId);
    if (elementIndex === -1) return false;

    const element = currentVersion.pages[pageIndex].elements[elementIndex];
    if (element.isDynamic || element.type !== 'icon') return false;

    const updatedPages = [...currentVersion.pages];
    const updatedElements = [...updatedPages[pageIndex].elements];
    updatedElements[elementIndex] = {
      ...element,
      content: { ...(element.content as IconContent), ...content }
    };
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true
    });
    return true;
  },
  updateElementZIndex: (elementId, zIndex) => {
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
    updatedElements[elementIndex] = { ...element, zIndex };
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true
    });
    return true;
  },

  bringToFront: (elementId) => {
    const { currentVersion, selectedPageNumber } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') return false;

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) return false;

    const elements = currentVersion.pages[pageIndex].elements;
    const element = elements.find(e => e.id === elementId);
    if (!element || element.isDynamic) return false;

    // Trouver le zIndex maximum
    const maxZIndex = elements.reduce((max, el) => Math.max(max, el.zIndex || 0), 0);
    
    const updatedPages = [...currentVersion.pages];
    const updatedElements = updatedPages[pageIndex].elements.map(el => 
      el.id === elementId ? { ...el, zIndex: maxZIndex + 1 } : el
    );
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true
    });
    return true;
  },

  sendToBack: (elementId) => {
    const { currentVersion, selectedPageNumber } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') return false;

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) return false;

    const elements = currentVersion.pages[pageIndex].elements;
    const element = elements.find(e => e.id === elementId);
    if (!element || element.isDynamic) return false;

    // Trouver le zIndex minimum
    const minZIndex = elements.reduce((min, el) => Math.min(min, el.zIndex || 0), 0);
    
    const updatedPages = [...currentVersion.pages];
    const updatedElements = updatedPages[pageIndex].elements.map(el => 
      el.id === elementId ? { ...el, zIndex: minZIndex - 1 } : el
    );
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true
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

  // Sélection et déplacement des zones dynamiques
  selectDynamicZone: (zoneId) => {
    set({ selectedDynamicZoneId: zoneId, selectedElementId: null });
  },

  updateDynamicZonePosition: (zoneId, position) => {
    const { currentVersion, selectedPageNumber } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') return false;

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === selectedPageNumber);
    if (pageIndex === -1) return false;

    const zoneIndex = currentVersion.pages[pageIndex].dynamicZones.findIndex(z => z.id === zoneId);
    if (zoneIndex === -1) return false;

    const updatedPages = [...currentVersion.pages];
    const updatedZones = [...updatedPages[pageIndex].dynamicZones];
    updatedZones[zoneIndex] = {
      ...updatedZones[zoneIndex],
      position: { top: position.top, height: position.height }
    };
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], dynamicZones: updatedZones };

    set({
      currentVersion: { ...currentVersion, pages: updatedPages },
      hasUnsavedChanges: true
    });
    return true;
  },

  // Préparer le mode édition depuis l'aperçu
  // Initialise currentVersion avec la dernière version du template
  preparePreviewEditing: (templateId) => {
    const { allVersions, currentVersion, currentTemplateId } = get();
    
    // Si déjà initialisé pour ce template, retourner les infos actuelles
    if (currentTemplateId === templateId && currentVersion) {
      return { versionId: currentVersion.id, status: currentVersion.status };
    }
    
    // Trouver la dernière version du template
    const templateVersions = allVersions.filter(v => v.templateId === templateId);
    if (templateVersions.length === 0) return null;
    
    // Prendre la version la plus récente
    const latestVersion = templateVersions.reduce((latest, v) => 
      v.versionNumber > latest.versionNumber ? v : latest
    , templateVersions[0]);
    
    // Charger cette version comme version courante
    set({
      currentVersion: latestVersion,
      currentTemplateId: templateId,
    });
    
    return { versionId: latestVersion.id, status: latestVersion.status };
  },
  
  // Getter pour obtenir la version de travail courante
  getCurrentVersionForPreview: () => {
    return get().currentVersion;
  },

  // Mise à jour d'un élément depuis l'aperçu (sans dépendre de selectedPageNumber ou status)
  // Autonome : initialise currentVersion si nécessaire via preparePreviewEditing
  updateElementFromPreview: (elementId, pageNumber, updates) => {
    let { currentVersion, allVersions, currentTemplateId } = get();
    
    // Si currentVersion n'est pas initialisée, essayer de l'initialiser
    if (!currentVersion) {
      // Trouver le template actif via la fonction du store
      const activeTemplate = get().getActiveTemplate();
      if (activeTemplate) {
        const result = get().preparePreviewEditing(activeTemplate.id);
        if (!result) return false;
        currentVersion = get().currentVersion;
        allVersions = get().allVersions;
      }
    }
    
    if (!currentVersion) return false;

    const pageIndex = currentVersion.pages.findIndex(p => p.pageNumber === pageNumber);
    if (pageIndex === -1) return false;

    const elementIndex = currentVersion.pages[pageIndex].elements.findIndex(e => e.id === elementId);
    if (elementIndex === -1) return false;

    const element = currentVersion.pages[pageIndex].elements[elementIndex];
    if (element.isDynamic) return false;

    // Créer une copie profonde pour la mise à jour
    const updatedPages = [...currentVersion.pages];
    const updatedElements = [...updatedPages[pageIndex].elements];
    
    updatedElements[elementIndex] = {
      ...element,
      position: updates.position || element.position,
      size: updates.size || element.size,
    };
    
    updatedPages[pageIndex] = { ...updatedPages[pageIndex], elements: updatedElements };
    
    const updatedVersion = { ...currentVersion, pages: updatedPages };
    
    // Mettre à jour aussi dans allVersions si la version y existe
    const versionIndex = allVersions.findIndex(v => v.id === currentVersion.id);
    let updatedAllVersions = allVersions;
    if (versionIndex !== -1) {
      updatedAllVersions = [...allVersions];
      updatedAllVersions[versionIndex] = updatedVersion;
    }

    set({
      currentVersion: updatedVersion,
      allVersions: updatedAllVersions,
      hasUnsavedChanges: true
    });
    
    return true;
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
    const { allVersions, currentVersion, selectedElementId, currentTemplateId } = get();
    if (!currentTemplateId) return null;
    
    const templateVersions = allVersions.filter(v => v.templateId === currentTemplateId);
    const maxVersion = Math.max(...templateVersions.map(v => v.versionNumber), 0);
    
    // Vérifier si les pages de la version courante sont valides (non vides)
    const hasValidPages = currentVersion?.pages && 
      currentVersion.pages.length > 0 &&
      currentVersion.pages.some(p => p.elements && p.elements.length > 0);
    
    // Clone profond de la version courante si elle existe ET a des pages valides
    let basePages: TemplatePageContent[];
    
    if (currentVersion && hasValidPages) {
      // Clone profond des pages existantes
      basePages = currentVersion.pages.map(page => ({
        ...page,
        elements: (page.elements || []).map(el => ({
          ...el,
          position: { ...el.position },
          size: { ...el.size },
          content: el.content ? { ...el.content } : undefined
        })),
        dynamicZones: (page.dynamicZones || []).map(zone => ({ ...zone }))
      }));
    } else {
      // Pages vides ou corrompues - recréer depuis le contrat PDF
      console.log('Pages vides détectées, reconstruction depuis le contrat PDF');
      basePages = PDF_TEMPLATE_CONTRACT.pages.map(pageConfig => ({
        pageNumber: pageConfig.pageNumber as PDFPageNumber,
        elements: PDF_TEMPLATE_ELEMENTS[pageConfig.pageNumber as PDFPageNumber] || [],
        dynamicZones: pageConfig.dynamicZones as DynamicZone[]
      }));
    }

    const newVersion: TemplateVersion = {
      id: `version-${Date.now()}`,
      templateId: currentTemplateId,
      versionNumber: maxVersion + 1,
      status: 'brouillon',
      createdAt: new Date(),
      createdBy: 'user',
      publishedAt: null,
      pages: basePages,
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
    const { currentVersion, allVersions, allTemplates, currentTemplateId } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') return;

    const updatedVersions = allVersions.map(v =>
      v.id === currentVersion.id ? currentVersion : v
    );

    // Mettre à jour la date de modification du template
    const updatedTemplates = allTemplates.map(t =>
      t.id === currentTemplateId ? { ...t, updatedAt: new Date() } : t
    );

    set({
      allVersions: updatedVersions,
      allTemplates: updatedTemplates,
      hasUnsavedChanges: false
    });
  },

  publishVersion: () => {
    const { currentVersion, allVersions, allTemplates, currentTemplateId } = get();
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

    // Mettre à jour la date de modification du template
    const updatedTemplates = allTemplates.map(t =>
      t.id === currentTemplateId ? { ...t, updatedAt: new Date() } : t
    );

    set({
      allVersions: updatedVersions,
      allTemplates: updatedTemplates,
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
    const { allVersions, currentTemplateId } = get();
    return allVersions.filter(v => v.templateId === currentTemplateId && v.status === 'publie');
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
    // Vider l'historique
    undoHistory = [];
  },

  // Annuler la dernière action
  undo: () => {
    const { currentVersion } = get();
    if (!currentVersion || currentVersion.status !== 'brouillon') return false;
    if (undoHistory.length === 0) return false;

    const previousState = undoHistory.pop()!;
    
    set({
      currentVersion: { ...currentVersion, pages: previousState.pages },
      selectedElementId: previousState.selectedElementId,
      selectedElementIds: previousState.selectedElementIds,
      hasUnsavedChanges: undoHistory.length > 0
    });
    
    return true;
  },

  canUndo: () => {
    return undoHistory.length > 0;
  }
}),
    {
      name: 'template-editor-storage',
      // Ne persister que les métadonnées légères, pas les pages complètes
      // Les données complètes sont maintenant dans le cloud
      partialize: (state) => ({
        allTemplates: state.allTemplates.map(t => ({
          ...t,
          // Garder uniquement les infos essentielles
        })),
        // Ne pas persister toutes les versions, seulement les IDs pour référence
        // Les données complètes seront chargées depuis le cloud
        allVersions: state.allVersions.map(v => ({
          id: v.id,
          templateId: v.templateId,
          versionNumber: v.versionNumber,
          status: v.status,
          createdAt: v.createdAt,
          createdBy: v.createdBy,
          publishedAt: v.publishedAt,
          dynamicZonesIntact: v.dynamicZonesIntact,
          // Exclure les pages qui sont volumineuses
          pages: [] // Les pages seront rechargées depuis le cloud
        })),
      }),
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            return deserializeDates(JSON.parse(str));
          } catch (error) {
            console.error('Erreur lecture localStorage:', error);
            localStorage.removeItem(name);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('Erreur écriture localStorage (quota dépassé?):', error);
            // En cas de quota dépassé, vider le cache local
            try {
              localStorage.removeItem(name);
            } catch (e) {
              // Ignorer
            }
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

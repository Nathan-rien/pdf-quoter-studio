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
  PDFTemplate
} from '@/types/template-editor';
import type { PDFPageNumber, DynamicZone } from '@/types/pdf-template';
import { PDF_TEMPLATE_CONTRACT } from '@/lib/pdf-template-contract';
import { validateTemplateForPublication } from '@/lib/template-validation';
import { blockDynamicZoneEdit } from '@/lib/template-protection';
import { PDF_TEMPLATE_ELEMENTS } from '@/lib/pdf-template-elements';
import { SHAPE_DEFAULT_SIZES } from '@/lib/template-styles';

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
  setEditorMode: (mode: 'view' | 'edit') => void;

  // Getter pour l'élément sélectionné (dynamique)
  getSelectedElement: () => EditableElement | null;

  // Actions d'édition (éléments NON dynamiques uniquement)
  updateTextContent: (elementId: string, content: Partial<TextContent>) => boolean;
  updateImageContent: (elementId: string, content: Partial<ImageContent>) => boolean;
  updateElementPosition: (elementId: string, position: { x: number; y: number }) => boolean;
  updateElementSize: (elementId: string, size: { width: number; height: number }) => boolean;

  // Ajout d'éléments
  setAddElementMode: (mode: 'none' | 'text' | 'image' | 'shape') => void;
  setSelectedShapeType: (type: ShapeType | null) => void;
  addElement: (type: 'text' | 'image', position: { x: number; y: number }) => EditableElement;
  addShape: (shapeType: ShapeType, position: { x: number; y: number }) => EditableElement;
  deleteElement: (elementId: string) => boolean;
  duplicateElement: (elementId: string) => EditableElement | null;
  
  // Actions spécifiques aux formes
  updateShapeContent: (elementId: string, content: Partial<ShapeContent>) => boolean;
  updateShapeInnerContent: (elementId: string, innerContent: Partial<ShapeInnerContent>) => boolean;
  toggleAspectRatioLock: (elementId: string) => boolean;
  toggleElementLock: (elementId: string) => boolean;
  
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

const initialState: TemplateEditorState = {
  // Templates
  allTemplates: [DEFAULT_TEMPLATE],
  currentTemplateId: null,
  viewMode: 'list',
  
  // Versions
  currentVersion: null,
  allVersions: [createPublishedDemoVersion(DEFAULT_TEMPLATE.id)],
  selectedElementId: null,
  selectedDynamicZoneId: null,
  selectedPageNumber: 1,
  editorMode: 'view',
  hasUnsavedChanges: false,
  addElementMode: 'none',
  selectedShapeType: null
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
    set({ addElementMode: mode, selectedShapeType: mode === 'shape' ? null : null });
  },

  setSelectedShapeType: (type) => {
    set({ selectedShapeType: type });
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

    const defaultContent: ShapeContent = {
      shapeType,
      backgroundColor: '#f3f4f6',
      backgroundOpacity: 100,
      border: {
        enabled: true,
        color: '#1f2937',
        width: 1
      },
      cornerRadius: shapeType === 'rounded-rectangle' ? 8 : 0,
      rotation: 0,
      aspectRatioLocked: shapeType === 'square' || shapeType === 'circle',
      isLocked: false
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
      selectedShapeType: null
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
      selectedElementId: duplicatedElement.id
    });

    return duplicatedElement;
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

  // Gestion des calques (z-index)
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
      : createInitialVersion(currentTemplateId);

    const newVersion: TemplateVersion = {
      ...baseVersion,
      id: `version-${Date.now()}`,
      templateId: currentTemplateId,
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
  }
}),
    {
      name: 'template-editor-storage',
      partialize: (state) => ({
        allTemplates: state.allTemplates,
        allVersions: state.allVersions,
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          return deserializeDates(JSON.parse(str));
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

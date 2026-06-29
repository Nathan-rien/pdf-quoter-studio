/**
 * Hook pour synchroniser les templates avec Lovable Cloud
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTemplateEditorStore } from '@/stores/templateEditorStore';
import type { PDFTemplate, TemplateVersion, TemplatePageContent } from '@/types/template-editor';
import type { PDFPageNumber, DynamicZone } from '@/types/pdf-template';
import { PDF_TEMPLATE_CONTRACT } from '@/lib/pdf-template-contract';
import { PDF_TEMPLATE_ELEMENTS } from '@/lib/pdf-template-elements';
import { toast } from 'sonner';

let templatesMetadataLoaded = false;
let templatesMetadataLoadPromise: Promise<void> | null = null;

// Types pour la base de données
interface DbTemplate {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DbVersion {
  id: string;
  template_id: string;
  version_number: number;
  status: string;
  pages: any;
  created_at: string;
  created_by: string | null;
  published_at: string | null;
}

// Convertir un template DB vers le format du store
function dbToStoreTemplate(db: DbTemplate): PDFTemplate {
  return {
    id: db.id,
    name: db.name,
    description: db.description || '',
    createdAt: new Date(db.created_at),
    createdBy: 'system',
    updatedAt: new Date(db.updated_at),
    isActive: db.is_active
  };
}

// Créer les pages par défaut depuis le contrat PDF
function createDefaultPages(): TemplatePageContent[] {
  return PDF_TEMPLATE_CONTRACT.pages.map(pageConfig => ({
    pageNumber: pageConfig.pageNumber as PDFPageNumber,
    elements: PDF_TEMPLATE_ELEMENTS[pageConfig.pageNumber as PDFPageNumber] || [],
    dynamicZones: pageConfig.dynamicZones as DynamicZone[]
  }));
}

// Convertir une version DB vers le format du store
function dbToStoreVersion(db: DbVersion): TemplateVersion {
  // Parse les pages depuis le JSON (peut être undefined si lazy loading)
  let pages: TemplatePageContent[] = [];
  
  if (db.pages !== undefined) {
    if (db.pages && Array.isArray(db.pages) && db.pages.length > 0) {
      // Vérifier que les pages ont réellement du contenu
      const hasContent = db.pages.some((page: any) => 
        page.elements && page.elements.length > 0
      );
      
      if (hasContent) {
        pages = db.pages.map((page: any) => ({
          pageNumber: page.pageNumber as PDFPageNumber,
          elements: page.elements || [],
          dynamicZones: page.dynamicZones || []
        }));
      } else {
        // Pages vides en base — ne PAS substituer par les pages par défaut (qui sont celles du template Location)
        console.log('Pages vides détectées, conservation d\'un tableau vide');
        pages = [];
      }
    } else {
      // Pas de pages en base — ne PAS substituer par les pages par défaut
      pages = [];
    }
  }
  // Si db.pages === undefined (lazy loading), pages reste un tableau vide
  
  return {
    id: db.id,
    templateId: db.template_id,
    versionNumber: db.version_number,
    status: db.status as 'brouillon' | 'publie' | 'archive',
    pages,
    createdAt: new Date(db.created_at),
    createdBy: db.created_by || 'system',
    publishedAt: db.published_at ? new Date(db.published_at) : null,
    dynamicZonesIntact: true
  };
}

// Générer un UUID valide à partir d'un ID existant
function toValidUUID(id: string): string {
  // Si c'est déjà un UUID valide, le retourner
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id;
  }
  
  // Sinon, créer un UUID déterministe basé sur l'ID
  // Utiliser un hash simple pour générer un UUID v4-like
  const hash = id.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
  const timestamp = id.replace(/\D/g, '').slice(0, 12).padStart(12, '0');
  
  return `${hashStr.slice(0, 8)}-${timestamp.slice(0, 4)}-4${timestamp.slice(4, 7)}-8${timestamp.slice(7, 10)}-${timestamp}0000`.slice(0, 36);
}

// Convertir un template du store vers le format DB
function storeToDbTemplate(template: PDFTemplate): Omit<DbTemplate, 'created_at' | 'updated_at'> {
  return {
    id: toValidUUID(template.id),
    name: template.name,
    description: template.description || null,
    is_active: template.isActive
  };
}

// Convertir une version du store vers le format DB
function storeToDbVersion(version: TemplateVersion): Omit<DbVersion, 'created_at'> {
  return {
    id: toValidUUID(version.id),
    template_id: toValidUUID(version.templateId),
    version_number: version.versionNumber,
    status: version.status,
    pages: version.pages,
    created_by: version.createdBy || null,
    published_at: version.publishedAt?.toISOString() || null
  };
}

export function useTemplateSync() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoadingVersion, setIsLoadingVersion] = useState(false);

  // Charger les templates depuis la base de données (SANS les pages pour éviter le timeout)
  const loadFromDatabase = useCallback(async () => {
    if (hasLoaded) return;

    if (templatesMetadataLoaded) {
      setIsLoading(false);
      setHasLoaded(true);
      return;
    }

    if (templatesMetadataLoadPromise) {
      setIsLoading(true);
      await templatesMetadataLoadPromise;
      setIsLoading(false);
      setHasLoaded(true);
      return;
    }
    
    setIsLoading(true);
    templatesMetadataLoadPromise = (async () => {
      try {
      
      // Récupérer les templates
      const { data: templates, error: templatesError } = await supabase
        .from('pdf_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (templatesError) {
        console.error('Erreur chargement templates:', templatesError);
        return;
      }

      // Si pas de templates en base, garder le store tel quel (avec le template par défaut)
      if (!templates || templates.length === 0) {
        console.log('Aucun template en base, utilisation du store local');
        templatesMetadataLoaded = true;
        setHasLoaded(true);
        return;
      }

      // Récupérer les versions SANS la colonne pages (trop volumineuse)
      const { data: versions, error: versionsError } = await supabase
        .from('template_versions')
        .select('id, template_id, version_number, status, created_at, created_by, published_at')
        .order('version_number', { ascending: true });

      if (versionsError) {
        console.error('Erreur chargement versions:', versionsError);
        return;
      }

      // Convertir et mettre à jour le store
      const storeTemplates = templates.map(dbToStoreTemplate);
      // Convertir sans les pages (lazy loading)
      const storeVersions = (versions || []).map(v => dbToStoreVersion({ ...v, pages: undefined }));

      const currentState = useTemplateEditorStore.getState();
      const mergedVersions = storeVersions.map(version => {
        const existing = currentState.allVersions.find(v => v.id === version.id);
        return existing?.pages?.length ? { ...version, pages: existing.pages } : version;
      });

      // Mettre à jour le store avec les données de la base
      useTemplateEditorStore.setState({
        allTemplates: storeTemplates,
        allVersions: mergedVersions,
        currentVersion: currentState.currentVersion
          ? mergedVersions.find(v => v.id === currentState.currentVersion?.id) || currentState.currentVersion
          : currentState.currentVersion,
      });

      templatesMetadataLoaded = true;
      setHasLoaded(true);
      console.log(`Chargé ${storeTemplates.length} templates et ${storeVersions.length} versions (métadonnées) depuis la base`);
    } catch (error) {
      console.error('Erreur sync templates:', error);
    } finally {
        templatesMetadataLoadPromise = null;
      }
    })();

    try {
      await templatesMetadataLoadPromise;
    } finally {
      setIsLoading(false);
    }
  }, [hasLoaded]);

  // Charger les pages d'une version spécifique (lazy loading)
  const loadVersionPages = useCallback(async (versionId: string): Promise<TemplatePageContent[] | null> => {
    try {
      setIsLoadingVersion(true);
      
      const { data, error } = await supabase
        .from('template_versions')
        .select('pages')
        .eq('id', toValidUUID(versionId))
        .maybeSingle();

      if (error) {
        console.error('Erreur chargement pages:', error);
        toast.error('Erreur lors du chargement de la version');
        return null;
      }

      if (!data) {
        console.error('Version non trouvée:', versionId);
        return null;
      }

      // Parser les pages
      let pages: TemplatePageContent[] = [];
      
      if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {
        const hasContent = data.pages.some((page: any) => 
          page.elements && page.elements.length > 0
        );
        
        if (hasContent) {
          pages = data.pages.map((page: any) => ({
            pageNumber: page.pageNumber as PDFPageNumber,
            elements: page.elements || [],
            dynamicZones: page.dynamicZones || []
          }));
        } else {
          pages = [];
        }
      } else {
        pages = [];
      }

      // Mettre à jour le store avec les pages chargées
      const currentState = useTemplateEditorStore.getState();
      const updatedVersions = currentState.allVersions.map(v =>
        v.id === versionId ? { ...v, pages } : v
      );

      if (!updatedVersions.some(v => v.id === versionId)) {
        console.warn('[loadVersionPages] Version non trouvée dans allVersions:', versionId);
      }

      // IMPORTANT: si la version courante est celle qu'on vient de charger,
      // il faut aussi mettre à jour currentVersion (sinon UI = pages(0) + boucle de reload).
      useTemplateEditorStore.setState({
        allVersions: updatedVersions,
        currentVersion:
          currentState.currentVersion?.id === versionId
            ? { ...currentState.currentVersion, pages }
            : currentState.currentVersion,
      });
      
      console.log(`Pages chargées pour version ${versionId}: ${pages.length} pages`);
      return pages;
    } catch (error) {
      console.error('Erreur chargement pages:', error);
      toast.error('Erreur lors du chargement de la version');
      return null;
    } finally {
      setIsLoadingVersion(false);
    }
  }, []);

  // Sauvegarder un template dans la base de données
  const saveTemplateToDatabase = useCallback(async (template: PDFTemplate) => {
    try {
      setIsSyncing(true);
      
      const dbTemplate = storeToDbTemplate(template);
      
      const { error } = await supabase
        .from('pdf_templates')
        .upsert(dbTemplate);

      if (error) {
        console.error('Erreur sauvegarde template:', error);
        toast.error('Erreur lors de la sauvegarde du template');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Sauvegarder une version dans la base de données
  const saveVersionToDatabase = useCallback(async (version: TemplateVersion) => {
    try {
      setIsSyncing(true);
      
      const dbVersion = storeToDbVersion(version);
      
      const { error } = await supabase
        .from('template_versions')
        .upsert(dbVersion as any);

      if (error) {
        console.error('Erreur sauvegarde version:', error);
        toast.error('Erreur lors de la sauvegarde de la version');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur sauvegarde version:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Synchroniser tout le store vers la base de données
  const syncAllToDatabase = useCallback(async () => {
    const state = useTemplateEditorStore.getState();
    
    try {
      setIsSyncing(true);
      
      // Sauvegarder tous les templates
      for (const template of state.allTemplates) {
        await saveTemplateToDatabase(template);
      }

      // Sauvegarder toutes les versions
      for (const version of state.allVersions) {
        await saveVersionToDatabase(version);
      }

      toast.success('Templates synchronisés avec le cloud');
      return true;
    } catch (error) {
      console.error('Erreur sync all:', error);
      toast.error('Erreur lors de la synchronisation');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [saveTemplateToDatabase, saveVersionToDatabase]);

  // Supprimer un template de la base de données
  const deleteTemplateFromDatabase = useCallback(async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('pdf_templates')
        .delete()
        .eq('id', templateId);

      if (error) {
        console.error('Erreur suppression template:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur suppression:', error);
      return false;
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    loadFromDatabase();
  }, [loadFromDatabase]);

  return {
    isLoading,
    isSyncing,
    isLoadingVersion,
    hasLoaded,
    loadFromDatabase,
    loadVersionPages,
    saveTemplateToDatabase,
    saveVersionToDatabase,
    syncAllToDatabase,
    deleteTemplateFromDatabase
  };
}

/**
 * Contrat du template PDF - pages dynamiques
 * 
 * RÈGLES CONTRACTUELLES :
 * - Les pages avec zones dynamiques peuvent être supprimées AVEC CONFIRMATION
 * - Les zones dynamiques peuvent être ajoutées/supprimées/déplacées
 * - Toute injection hors zone autorisée = ERREUR BLOQUANTE
 */

import { 
  PDFTemplateContract, 
  PDFPageConfig, 
  DynamicZone, 
  DynamicZoneType,
  PageDeletionCheck,
  hasPageDynamicZones,
  generateDynamicZoneId,
  AVAILABLE_ZONE_TYPES
} from '@/types/pdf-template';

// Configuration initiale des 8 pages par défaut
const DEFAULT_PAGE_CONFIGS: PDFPageConfig[] = [
  // PAGE 1 - Couverture (STATIQUE)
  {
    pageNumber: 1,
    title: 'Couverture',
    type: 'static',
    dynamicZones: [],
    staticElements: [
      'Titre "PROPOSITION COMMERCIALE"',
      'Date (Septembre 2025)',
      'Logo CybertekPro',
      'Informations client',
      'Image de fond',
      'Footer avec adresse'
    ]
  },
  // PAGE 2 - Nos engagements (STATIQUE)
  {
    pageNumber: 2,
    title: 'Nos engagements',
    type: 'static',
    dynamicZones: [],
    staticElements: [
      'Titre "Nos engagements :"',
      '1. Allonger la durée de vie du matériel informatique',
      '2. Gestion de parc évolutive',
      '3. Accompagnement dans votre démarche environnementale',
      'Footer CybertekPro'
    ]
  },
  // PAGE 3 - La location évolutive (STATIQUE)
  {
    pageNumber: 3,
    title: 'La location évolutive',
    type: 'static',
    dynamicZones: [],
    staticElements: [
      'Titre "La location évolutive"',
      'Section Flexibilité',
      'Section Économique',
      'Section Écologique',
      'Logo CybertekPro'
    ]
  },
  // PAGE 4 - Votre offre neuf + rachat (DYNAMIQUE PARTIELLE)
  {
    pageNumber: 4,
    title: 'Votre offre neuf + rachat',
    type: 'dynamic_partial',
    dynamicZones: [
      {
        id: 'invest_table_page4',
        pageNumber: 4,
        type: 'invest_table',
        sourceSheet: 'invest ',
        isRequired: true,
        description: 'Tableau Invest - Section Rachat matériel 2025'
      }
    ],
    staticElements: [
      'Titre "Votre offre neuf + rachat"',
      'Paragraphe explicatif lease back',
      'Section "Avantages"',
      'Section "Condition de l\'offre"',
      'Footer CybertekPro'
    ]
  },
  // PAGE 5 - Votre offre matériel neuf (DYNAMIQUE PARTIELLE)
  {
    pageNumber: 5,
    title: 'Votre offre matériel neuf',
    type: 'dynamic_partial',
    dynamicZones: [
      {
        id: 'invest_table_page5',
        pageNumber: 5,
        type: 'invest_table',
        sourceSheet: 'invest ',
        isRequired: true,
        description: 'Tableau Invest - Section Matériel neuf 2025'
      },
      {
        id: 'location_block_page5',
        pageNumber: 5,
        type: 'location_block',
        sourceSheet: 'invest ',
        isRequired: true,
        description: 'Bloc Location (Durée, Montant, Loyer, Coût)'
      }
    ],
    staticElements: [
      'Titre "Votre offre matériel neuf"',
      'Section "Condition de l\'offre"',
      'Footer CybertekPro'
    ]
  },
  // PAGE 6 - Votre offre de services (DYNAMIQUE CONDITIONNELLE)
  {
    pageNumber: 6,
    title: 'Votre offre de services',
    type: 'dynamic_conditional',
    dynamicZones: [
      {
        id: 'services_inclus',
        pageNumber: 6,
        type: 'options_block',
        sourceSheet: 'Options services ',
        isRequired: false,
        description: 'Bloc Services Inclus'
      },
      {
        id: 'lease_back',
        pageNumber: 6,
        type: 'options_block',
        sourceSheet: 'Options services ',
        isRequired: false,
        description: 'Bloc Lease Back'
      },
      {
        id: 'nos_options',
        pageNumber: 6,
        type: 'options_block',
        sourceSheet: 'Options services ',
        isRequired: false,
        description: 'Bloc Nos Options'
      }
    ],
    staticElements: [
      'Titre "Votre offre de services"',
      'Titre "Nos options"',
      'Séparateurs visuels',
      'Footer CybertekPro'
    ]
  },
  // PAGE 7 - Les services CybertekPro (STATIQUE)
  {
    pageNumber: 7,
    title: 'Les services CybertekPro',
    type: 'static',
    dynamicZones: [],
    staticElements: [
      'Titre "Les services CybertekPro"',
      'Carte: Reprise et Reconditionnement',
      'Carte: CyberSécurité',
      'Carte: Intervention sur site',
      'Carte: Logistique',
      'Carte: Maintenance et garantie',
      'Carte: Services atelier',
      'Carte: Lease Back',
      'Carte: Données RSE',
      'Footer CybertekPro'
    ]
  },
  // PAGE 8 - Bon pour accord (STATIQUE)
  {
    pageNumber: 8,
    title: 'Bon pour accord',
    type: 'static',
    dynamicZones: [],
    staticElements: [
      'Titre "Bon pour accord"',
      'Zone signature "Le / /"',
      'Zone "Signature et cachet"',
      'Mentions légales',
      'Clause de validité',
      'Footer CybertekPro'
    ]
  }
];

// Template contractuel (mutable pour permettre l'ajout/suppression de pages)
export const PDF_TEMPLATE_CONTRACT: PDFTemplateContract = {
  id: 'cybertek-pro-v1',
  name: 'Proposition Commerciale CybertekPro',
  version: '1.0',
  totalPages: 8,
  pages: [...DEFAULT_PAGE_CONFIGS],
  createdAt: new Date('2025-01-01'),
  isActive: true
};

/**
 * Récupère la configuration d'une page par son numéro
 */
export function getPageConfig(pageNumber: number): PDFPageConfig | null {
  return PDF_TEMPLATE_CONTRACT.pages.find(p => p.pageNumber === pageNumber) || null;
}

/**
 * Vérifie si une page accepte des données dynamiques
 */
export function pageHasDynamicZones(pageNumber: number): boolean {
  const config = getPageConfig(pageNumber);
  return config ? config.dynamicZones.length > 0 : false;
}

/**
 * Récupère toutes les zones dynamiques requises
 */
export function getRequiredDynamicZones() {
  return PDF_TEMPLATE_CONTRACT.pages.flatMap(p => p.dynamicZones.filter(z => z.isRequired));
}

/**
 * Récupère les pages avec des zones dynamiques
 */
export function getDynamicPages() {
  return PDF_TEMPLATE_CONTRACT.pages.filter(p => p.dynamicZones.length > 0);
}

/**
 * Vérifie si une page peut être supprimée (avec gestion des avertissements)
 */
export function canDeletePage(pageNumber: number, allDynamicZones?: DynamicZone[]): PageDeletionCheck {
  // Vérifier si la page existe
  const pageConfig = getPageConfig(pageNumber);
  if (!pageConfig) {
    return { canDelete: false, reason: 'Page non trouvée' };
  }

  // Minimum 1 page requise
  if (PDF_TEMPLATE_CONTRACT.pages.length <= 1) {
    return { canDelete: false, reason: 'Au moins 1 page requise' };
  }

  // Vérifier si la page a des zones dynamiques
  const dynamicZonesOnPage = allDynamicZones 
    ? allDynamicZones.filter(z => z.pageNumber === pageNumber)
    : pageConfig.dynamicZones;

  if (dynamicZonesOnPage.length > 0) {
    const requiredZones = dynamicZonesOnPage.filter(z => z.isRequired);
    
    if (requiredZones.length > 0) {
      return { 
        canDelete: true, 
        hasWarning: true,
        warning: `Cette page contient ${requiredZones.length} zone(s) dynamique(s) requise(s). Les données ne seront plus injectées.`,
        dynamicZonesCount: dynamicZonesOnPage.length
      };
    }
    
    return { 
      canDelete: true, 
      hasWarning: true,
      warning: `Cette page contient ${dynamicZonesOnPage.length} zone(s) dynamique(s). Les données ne seront plus injectées.`,
      dynamicZonesCount: dynamicZonesOnPage.length
    };
  }

  return { canDelete: true };
}

/**
 * Ajoute une nouvelle page au template
 */
export function addPageToContract(title: string = 'Nouvelle page', afterPageNumber?: number): PDFPageConfig {
  const insertIndex = afterPageNumber 
    ? PDF_TEMPLATE_CONTRACT.pages.findIndex(p => p.pageNumber === afterPageNumber) + 1
    : PDF_TEMPLATE_CONTRACT.pages.length;

  // Trouver le prochain numéro de page
  const maxPageNumber = Math.max(...PDF_TEMPLATE_CONTRACT.pages.map(p => p.pageNumber));
  const newPageNumber = maxPageNumber + 1;

  const newPage: PDFPageConfig = {
    pageNumber: newPageNumber,
    title,
    type: 'static',
    dynamicZones: [],
    staticElements: []
  };

  PDF_TEMPLATE_CONTRACT.pages.splice(insertIndex, 0, newPage);
  PDF_TEMPLATE_CONTRACT.totalPages = PDF_TEMPLATE_CONTRACT.pages.length;

  // Renuméroter les pages après l'insertion
  renumberPages();

  return newPage;
}

/**
 * Supprime une page du template
 */
export function removePageFromContract(pageNumber: number, forceDelete: boolean = false): boolean {
  const check = canDeletePage(pageNumber);
  
  // Si on ne peut pas supprimer et ce n'est pas une suppression forcée
  if (!check.canDelete && !forceDelete) {
    return false;
  }
  
  // Si il y a un avertissement mais pas de forceDelete, on bloque
  if (check.hasWarning && !forceDelete) {
    return false;
  }

  const pageIndex = PDF_TEMPLATE_CONTRACT.pages.findIndex(p => p.pageNumber === pageNumber);
  if (pageIndex === -1) return false;

  PDF_TEMPLATE_CONTRACT.pages.splice(pageIndex, 1);
  PDF_TEMPLATE_CONTRACT.totalPages = PDF_TEMPLATE_CONTRACT.pages.length;

  // Renuméroter les pages
  renumberPages();

  return true;
}

/**
 * Ajoute une zone dynamique à une page
 */
export function addDynamicZoneToPage(
  pageNumber: number, 
  type: DynamicZoneType, 
  isRequired: boolean = false,
  description?: string
): DynamicZone | null {
  const pageIndex = PDF_TEMPLATE_CONTRACT.pages.findIndex(p => p.pageNumber === pageNumber);
  if (pageIndex === -1) return null;

  const zoneTypeInfo = AVAILABLE_ZONE_TYPES.find(z => z.type === type);
  if (!zoneTypeInfo) return null;

  const newZone: DynamicZone = {
    id: generateDynamicZoneId(type, pageNumber),
    pageNumber,
    type,
    sourceSheet: zoneTypeInfo.sourceSheet,
    isRequired,
    description: description || zoneTypeInfo.description
  };

  PDF_TEMPLATE_CONTRACT.pages[pageIndex].dynamicZones.push(newZone);
  
  // Mettre à jour le type de page si nécessaire
  if (PDF_TEMPLATE_CONTRACT.pages[pageIndex].type === 'static') {
    PDF_TEMPLATE_CONTRACT.pages[pageIndex].type = 'dynamic_partial';
  }

  return newZone;
}

/**
 * Supprime une zone dynamique
 */
export function removeDynamicZoneFromContract(zoneId: string): boolean {
  for (const page of PDF_TEMPLATE_CONTRACT.pages) {
    const zoneIndex = page.dynamicZones.findIndex(z => z.id === zoneId);
    if (zoneIndex !== -1) {
      page.dynamicZones.splice(zoneIndex, 1);
      
      // Mettre à jour le type de page si plus de zones
      if (page.dynamicZones.length === 0) {
        page.type = 'static';
      }
      
      return true;
    }
  }
  return false;
}

/**
 * Met à jour une zone dynamique
 */
export function updateDynamicZoneInContract(
  zoneId: string, 
  updates: Partial<Pick<DynamicZone, 'isRequired' | 'description' | 'position'>>
): boolean {
  for (const page of PDF_TEMPLATE_CONTRACT.pages) {
    const zone = page.dynamicZones.find(z => z.id === zoneId);
    if (zone) {
      Object.assign(zone, updates);
      return true;
    }
  }
  return false;
}

/**
 * Déplace une zone dynamique vers une autre page
 */
export function moveDynamicZoneToPage(zoneId: string, targetPageNumber: number): boolean {
  // Trouver la zone
  let foundZone: DynamicZone | null = null;
  let sourcePageIndex = -1;
  
  for (let i = 0; i < PDF_TEMPLATE_CONTRACT.pages.length; i++) {
    const zone = PDF_TEMPLATE_CONTRACT.pages[i].dynamicZones.find(z => z.id === zoneId);
    if (zone) {
      foundZone = { ...zone };
      sourcePageIndex = i;
      break;
    }
  }
  
  if (!foundZone || sourcePageIndex === -1) return false;
  
  // Vérifier que la page cible existe
  const targetPageIndex = PDF_TEMPLATE_CONTRACT.pages.findIndex(p => p.pageNumber === targetPageNumber);
  if (targetPageIndex === -1) return false;
  
  // Supprimer de la page source
  const sourceZoneIndex = PDF_TEMPLATE_CONTRACT.pages[sourcePageIndex].dynamicZones.findIndex(z => z.id === zoneId);
  PDF_TEMPLATE_CONTRACT.pages[sourcePageIndex].dynamicZones.splice(sourceZoneIndex, 1);
  
  // Mettre à jour le type de la page source si plus de zones
  if (PDF_TEMPLATE_CONTRACT.pages[sourcePageIndex].dynamicZones.length === 0) {
    PDF_TEMPLATE_CONTRACT.pages[sourcePageIndex].type = 'static';
  }
  
  // Ajouter à la page cible
  foundZone.pageNumber = targetPageNumber;
  PDF_TEMPLATE_CONTRACT.pages[targetPageIndex].dynamicZones.push(foundZone);
  
  // Mettre à jour le type de la page cible
  if (PDF_TEMPLATE_CONTRACT.pages[targetPageIndex].type === 'static') {
    PDF_TEMPLATE_CONTRACT.pages[targetPageIndex].type = 'dynamic_partial';
  }
  
  return true;
}

/**
 * Récupère les types de zones disponibles
 */
export function getAvailableZoneTypes() {
  return AVAILABLE_ZONE_TYPES;
}

/**
 * Récupère toutes les zones dynamiques du contrat
 */
export function getAllDynamicZones(): DynamicZone[] {
  return PDF_TEMPLATE_CONTRACT.pages.flatMap(p => p.dynamicZones);
}

/**
 * Renuméroter les pages séquentiellement
 */
function renumberPages() {
  // Simplement trier et renuméroter séquentiellement
  PDF_TEMPLATE_CONTRACT.pages.sort((a, b) => a.pageNumber - b.pageNumber);
  
  PDF_TEMPLATE_CONTRACT.pages.forEach((page, index) => {
    const newNumber = index + 1;
    if (page.pageNumber !== newNumber) {
      // Mettre à jour le numéro de page dans les zones dynamiques aussi
      page.dynamicZones.forEach(zone => {
        zone.pageNumber = newNumber;
      });
      page.pageNumber = newNumber;
    }
  });
}

/**
 * Réinitialise le contrat aux pages par défaut
 */
export function resetContractToDefaults() {
  PDF_TEMPLATE_CONTRACT.pages = [...DEFAULT_PAGE_CONFIGS];
  PDF_TEMPLATE_CONTRACT.totalPages = 8;
}

/**
 * Obtenir les configurations par défaut des pages
 */
export function getDefaultPageConfigs(): PDFPageConfig[] {
  return [...DEFAULT_PAGE_CONFIGS];
}

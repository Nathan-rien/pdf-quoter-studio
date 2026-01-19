/**
 * Contrat du template PDF - pages dynamiques
 * 
 * RÈGLES CONTRACTUELLES :
 * - Les pages 4, 5, 6 sont PROTÉGÉES (zones dynamiques)
 * - Les autres pages peuvent être ajoutées/supprimées
 * - Toute injection hors zone autorisée = ERREUR BLOQUANTE
 */

import { PDFTemplateContract, PDFPageConfig, isProtectedPage } from '@/types/pdf-template';

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
  // PAGE 4 - Votre offre neuf + rachat (DYNAMIQUE PARTIELLE) - PROTÉGÉE
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
  // PAGE 5 - Votre offre matériel neuf (DYNAMIQUE PARTIELLE) - PROTÉGÉE
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
  // PAGE 6 - Votre offre de services (DYNAMIQUE CONDITIONNELLE) - PROTÉGÉE
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
 * Vérifie si une page peut être supprimée
 */
export function canDeletePage(pageNumber: number): { canDelete: boolean; reason?: string } {
  // Vérifier si la page existe
  const pageConfig = getPageConfig(pageNumber);
  if (!pageConfig) {
    return { canDelete: false, reason: 'Page non trouvée' };
  }

  // Minimum 1 page requise
  if (PDF_TEMPLATE_CONTRACT.pages.length <= 1) {
    return { canDelete: false, reason: 'Au moins 1 page requise' };
  }

  // Pages protégées (zones dynamiques)
  if (isProtectedPage(pageNumber)) {
    return { canDelete: false, reason: 'Page protégée (zones dynamiques)' };
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
export function removePageFromContract(pageNumber: number): boolean {
  const check = canDeletePage(pageNumber);
  if (!check.canDelete) {
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
 * Renuméroter les pages en préservant les zones dynamiques sur 4, 5, 6
 */
function renumberPages() {
  // Les pages protégées (4, 5, 6) gardent leur numéro
  // Les autres pages sont renumérotées séquentiellement
  let currentNumber = 1;
  
  for (const page of PDF_TEMPLATE_CONTRACT.pages) {
    if (isProtectedPage(page.pageNumber)) {
      // Garder le numéro des pages protégées
      continue;
    }
    
    // S'assurer qu'on n'écrase pas les numéros protégés
    while ([4, 5, 6].includes(currentNumber)) {
      currentNumber++;
    }
    
    if (page.pageNumber !== currentNumber) {
      page.pageNumber = currentNumber;
    }
    currentNumber++;
  }

  // Trier les pages par numéro
  PDF_TEMPLATE_CONTRACT.pages.sort((a, b) => a.pageNumber - b.pageNumber);
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

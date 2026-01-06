/**
 * Contrat figé du template PDF - 8 pages
 * 
 * RÈGLES CONTRACTUELLES :
 * - Le nombre et l'ordre des pages sont IMMUABLES
 * - Les zones dynamiques sont EXCLUSIVES aux pages définies
 * - Toute injection hors zone autorisée = ERREUR BLOQUANTE
 */

import { PDFTemplateContract, PDFPageConfig } from '@/types/pdf-template';

// Configuration des 8 pages
const PAGE_CONFIGS: PDFPageConfig[] = [
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

// Template contractuel unique
export const PDF_TEMPLATE_CONTRACT: PDFTemplateContract = {
  id: 'cybertek-pro-v1',
  name: 'Proposition Commerciale CybertekPro',
  version: '1.0',
  totalPages: 8,
  pages: PAGE_CONFIGS,
  createdAt: new Date('2025-01-01'),
  isActive: true
};

/**
 * Récupère la configuration d'une page par son numéro
 */
export function getPageConfig(pageNumber: number): PDFPageConfig | null {
  return PAGE_CONFIGS.find(p => p.pageNumber === pageNumber) || null;
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
  return PAGE_CONFIGS.flatMap(p => p.dynamicZones.filter(z => z.isRequired));
}

/**
 * Récupère les pages avec des zones dynamiques
 */
export function getDynamicPages() {
  return PAGE_CONFIGS.filter(p => p.dynamicZones.length > 0);
}

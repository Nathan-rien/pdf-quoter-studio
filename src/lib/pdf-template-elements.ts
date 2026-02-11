/**
 * Éléments du template PDF basés sur le document réel
 * Chaque page contient les éléments texte/image éditables (non dynamiques)
 */

import type { EditableElement, TextContent } from '@/types/template-editor';
import type { PDFPageNumber } from '@/types/pdf-template';

// Helper pour créer un élément texte
function createTextElement(
  id: string,
  pageNumber: PDFPageNumber,
  text: string,
  position: { x: number; y: number },
  size: { width: number; height: number },
  options: Partial<TextContent> = {}
): EditableElement {
  return {
    id,
    type: 'text',
    pageNumber,
    isDynamic: false,
    position,
    size,
    content: {
      text,
      fontFamily: 'DM Sans',
      fontSize: 14,
      color: '#1f2937',
      bold: false,
      italic: false,
      underline: false,
      ...options,
    } as TextContent,
  };
}

// Helper pour créer un élément image
function createImageElement(
  id: string,
  pageNumber: PDFPageNumber,
  position: { x: number; y: number },
  size: { width: number; height: number },
  imageUrl: string = '',
  alt: string = 'Image'
): EditableElement {
  return {
    id,
    type: 'image',
    pageNumber,
    isDynamic: false,
    position,
    size,
    content: { imageUrl, alt },
  };
}

// Page 1 - Couverture
const PAGE_1_ELEMENTS: EditableElement[] = [
  createImageElement('p1_logo', 1, { x: 20, y: 20 }, { width: 120, height: 50 }),
  createTextElement('p1_title', 1, 'PROPOSITION COMMERCIALE', { x: 20, y: 100 }, { width: 350, height: 40 }, {
    fontSize: 28,
    bold: true,
    color: '#1e3a5f',
  }),
  createTextElement('p1_date', 1, 'Septembre 2025', { x: 20, y: 150 }, { width: 200, height: 30 }, {
    fontSize: 20,
    color: '#ffffff',
  }),
  createTextElement('p1_client_label', 1, 'Client', { x: 20, y: 220 }, { width: 100, height: 25 }, {
    fontSize: 16,
    bold: true,
  }),
  createTextElement('p1_client_name', 1, 'Johanna Weill', { x: 20, y: 250 }, { width: 250, height: 25 }, {
    fontSize: 14,
  }),
  createTextElement('p1_phone', 1, 'Téléphone: 05 56 11 88 99', { x: 20, y: 280 }, { width: 250, height: 20 }),
  createTextElement('p1_email', 1, 'Email: j.weill@cybertek-pro.fr', { x: 20, y: 305 }, { width: 280, height: 20 }),
  createTextElement('p1_address', 1, 'Adresse: 130, rue Achard - Bât. U 33300 Bordeaux – France', { x: 20, y: 330 }, { width: 350, height: 20 }),
];

// Page 2 - Nos engagements
const PAGE_2_ELEMENTS: EditableElement[] = [
  createTextElement('p2_title', 2, 'Nos engagements :', { x: 20, y: 40 }, { width: 300, height: 35 }, {
    fontSize: 24,
    bold: true,
    color: '#1e3a5f',
  }),
  createTextElement('p2_eng1_title', 2, '1. Allonger la durée de vie du matériel informatique', { x: 20, y: 90 }, { width: 350, height: 25 }, {
    fontSize: 16,
    bold: true,
    color: '#10b981',
  }),
  createTextElement('p2_eng1_desc', 2, 'La location réduit le besoin de produire de nouveaux équipements en prolongeant la durée de vie utile des appareils existants. Cela permet de diminuer la quantité de déchets électroniques générés ainsi que l\'impact environnemental lié à la fabrication de nouveaux produits.', { x: 20, y: 120 }, { width: 350, height: 70 }, {
    fontSize: 12,
  }),
  createTextElement('p2_eng2_title', 2, '2. Gestion de parc évolutive', { x: 20, y: 200 }, { width: 350, height: 25 }, {
    fontSize: 16,
    bold: true,
    color: '#10b981',
  }),
  createTextElement('p2_eng2_desc', 2, 'Notre offre de gestion de parc informatique répond aux besoins et aux enjeux actuels des entreprises. Nous proposons des solutions flexibles et durables, intégrant des équipements performants ainsi que des services clé en main.', { x: 20, y: 230 }, { width: 350, height: 70 }, {
    fontSize: 12,
  }),
  createTextElement('p2_eng3_title', 2, '3. Accompagnement dans votre démarche environnementale', { x: 20, y: 310 }, { width: 350, height: 25 }, {
    fontSize: 16,
    bold: true,
    color: '#10b981',
  }),
  createTextElement('p2_eng3_desc', 2, 'Nous vous accompagnons dans votre démarche environnementale en assurant le recyclage du matériel ou sa réintégration sur le marché de la seconde main, le tout localement dans notre centre logistique de Bordeaux.', { x: 20, y: 340 }, { width: 350, height: 70 }, {
    fontSize: 12,
  }),
];

// Page 3 - La location évolutive
const PAGE_3_ELEMENTS: EditableElement[] = [
  createTextElement('p3_title', 3, 'La location évolutive', { x: 20, y: 40 }, { width: 350, height: 40 }, {
    fontSize: 28,
    bold: true,
    color: '#1e3a5f',
  }),
  createImageElement('p3_illustration', 3, { x: 20, y: 100 }, { width: 350, height: 300 }),
];

// Page 4 - Votre offre neuf + rachat (contient zone dynamique)
const PAGE_4_ELEMENTS: EditableElement[] = [
  createTextElement('p4_title', 4, 'Votre offre neuf + rachat', { x: 20, y: 30 }, { width: 350, height: 35 }, {
    fontSize: 24,
    bold: true,
    color: '#1e3a5f',
  }),
  createTextElement('p4_intro', 4, 'Notre service de lease back informatique permet aux entreprises de vendre leur parc IT existant tout en continuant à l\'utiliser grâce à une solution de location sur-mesure.', { x: 20, y: 70 }, { width: 350, height: 50 }, {
    fontSize: 11,
  }),
  // Zone dynamique "invest_table_page4" occupe l'espace central
  createTextElement('p4_avantages_title', 4, 'Avantages :', { x: 20, y: 320 }, { width: 150, height: 20 }, {
    fontSize: 14,
    bold: true,
    color: '#10b981',
  }),
  createTextElement('p4_avantages_list', 4, '• Apport en trésorerie + création de charge déductible\n• Gestion des reprises au terme du contrat\n• Visibilité budgétaire', { x: 20, y: 345 }, { width: 350, height: 50 }, {
    fontSize: 10,
  }),
  createTextElement('p4_conditions_title', 4, 'Condition de l\'offre :', { x: 20, y: 400 }, { width: 200, height: 20 }, {
    fontSize: 14,
    bold: true,
    color: '#10b981',
  }),
  createTextElement('p4_conditions_text', 4, '• Les loyers sont payables trimestriellement terme à échoir par prélèvement\n• Frais de dossier bancaire {{FRAIS_DOSSIER}} € HT.', { x: 20, y: 425 }, { width: 350, height: 40 }, {
    fontSize: 10,
  }),
];

// Page 5 - Votre offre matériel neuf (contient zones dynamiques)
const PAGE_5_ELEMENTS: EditableElement[] = [
  createTextElement('p5_title', 5, 'Votre offre matériel neuf', { x: 20, y: 30 }, { width: 350, height: 35 }, {
    fontSize: 24,
    bold: true,
    color: '#1e3a5f',
  }),
  // Zones dynamiques "location_block_page5" et "invest_table_page5" occupent l'espace central
  createTextElement('p5_conditions_title', 5, 'Condition de l\'offre :', { x: 20, y: 400 }, { width: 200, height: 20 }, {
    fontSize: 14,
    bold: true,
    color: '#10b981',
  }),
  createTextElement('p5_conditions_text', 5, 'Les loyers sont payables trimestriellement terme à échoir par prélèvement\nFrais de dossier bancaire {{FRAIS_DOSSIER}} € HT.', { x: 20, y: 425 }, { width: 350, height: 40 }, {
    fontSize: 10,
  }),
];

// Page 6 - Votre offre de services (contient zones dynamiques)
const PAGE_6_ELEMENTS: EditableElement[] = [
  createTextElement('p6_title', 6, 'Votre offre de services', { x: 20, y: 30 }, { width: 350, height: 35 }, {
    fontSize: 24,
    bold: true,
    color: '#1e3a5f',
  }),
  createTextElement('p6_subtitle', 6, 'Nos options', { x: 20, y: 70 }, { width: 200, height: 25 }, {
    fontSize: 18,
    bold: true,
    color: '#10b981',
  }),
  // Zones dynamiques "services_inclus", "lease_back", "nos_options" occupent l'espace
];

// Page 7 - Les services CybertekPro
const PAGE_7_ELEMENTS: EditableElement[] = [
  createTextElement('p7_title', 7, 'Les services CybertekPro', { x: 20, y: 30 }, { width: 350, height: 35 }, {
    fontSize: 24,
    bold: true,
    color: '#1e3a5f',
  }),
  createTextElement('p7_section1_title', 7, 'Reprise et Reconditionnement', { x: 20, y: 80 }, { width: 200, height: 20 }, {
    fontSize: 14,
    bold: true,
    color: '#10b981',
  }),
  createTextElement('p7_section1_items', 7, '• Effacements données Blancco avec rapports de destruction\n• Enlèvement et reprise de parc', { x: 30, y: 105 }, { width: 170, height: 50 }, {
    fontSize: 10,
  }),
  createTextElement('p7_section2_title', 7, 'CyberSécurité', { x: 200, y: 80 }, { width: 150, height: 20 }, {
    fontSize: 14,
    bold: true,
    color: '#10b981',
  }),
  createTextElement('p7_section2_items', 7, '• Audit Cybersécurité\n• Test intrusion\n• Audit de l\'existant\n• Analyses de risques', { x: 210, y: 105 }, { width: 150, height: 70 }, {
    fontSize: 10,
  }),
  createTextElement('p7_section3_title', 7, 'Logistique', { x: 20, y: 180 }, { width: 150, height: 20 }, {
    fontSize: 14,
    bold: true,
    color: '#10b981',
  }),
  createTextElement('p7_section3_items', 7, '• Reprise multi sites\n• Livraison multi sites\n• Stock tampon', { x: 30, y: 205 }, { width: 170, height: 50 }, {
    fontSize: 10,
  }),
  createTextElement('p7_section4_title', 7, 'Maintenance et garantie', { x: 200, y: 180 }, { width: 180, height: 20 }, {
    fontSize: 14,
    bold: true,
    color: '#10b981',
  }),
  createTextElement('p7_section4_items', 7, '• Extension garantie\n• SAV et relation client\n• Maintenance 4H / J+1', { x: 210, y: 205 }, { width: 160, height: 50 }, {
    fontSize: 10,
  }),
  createTextElement('p7_section5_title', 7, 'Services atelier', { x: 20, y: 280 }, { width: 150, height: 20 }, {
    fontSize: 14,
    bold: true,
    color: '#10b981',
  }),
  createTextElement('p7_section5_items', 7, '• Personnalisation / gravure\n• Préconfiguration logiciel', { x: 30, y: 305 }, { width: 170, height: 40 }, {
    fontSize: 10,
  }),
  createTextElement('p7_section6_title', 7, 'Données RSE', { x: 200, y: 280 }, { width: 150, height: 20 }, {
    fontSize: 14,
    bold: true,
    color: '#10b981',
  }),
  createTextElement('p7_section6_items', 7, '• Rapport extra financier\n• Certificat DEEE', { x: 210, y: 305 }, { width: 160, height: 40 }, {
    fontSize: 10,
  }),
  createTextElement('p7_section7_title', 7, 'Lease Back', { x: 20, y: 360 }, { width: 150, height: 20 }, {
    fontSize: 14,
    bold: true,
    color: '#10b981',
  }),
  createTextElement('p7_section7_items', 7, '• Location évolutive\n• Rachat de parc en cours d\'usage et relocation', { x: 30, y: 385 }, { width: 300, height: 40 }, {
    fontSize: 10,
  }),
];

// Page 8 - Bon pour accord
const PAGE_8_ELEMENTS: EditableElement[] = [
  createTextElement('p8_title', 8, 'Bon pour accord', { x: 20, y: 40 }, { width: 250, height: 35 }, {
    fontSize: 24,
    bold: true,
    color: '#1e3a5f',
  }),
  createTextElement('p8_date_label', 8, 'Le  /  /', { x: 20, y: 100 }, { width: 150, height: 25 }, {
    fontSize: 14,
  }),
  createTextElement('p8_signature_label', 8, 'Signature et cachet', { x: 20, y: 140 }, { width: 200, height: 25 }, {
    fontSize: 14,
    bold: true,
  }),
  createImageElement('p8_signature_zone', 8, { x: 20, y: 170 }, { width: 200, height: 100 }),
  createTextElement('p8_important_label', 8, 'Important : La présente proposition commerciale :', { x: 20, y: 290 }, { width: 350, height: 20 }, {
    fontSize: 12,
    bold: true,
  }),
  createTextElement('p8_important_text', 8, '• Ne constitue qu\'une offre soumise à l\'accord express du Comité des Engagements du Groupe Cybertek qui sera formalisée par la signature du contrat correspondant par un représentant dûment habilité de notre société.', { x: 20, y: 315 }, { width: 350, height: 50 }, {
    fontSize: 9,
  }),
  createTextElement('p8_validity', 8, 'Proposition valable un mois à compter de sa date d\'émission.', { x: 20, y: 375 }, { width: 350, height: 20 }, {
    fontSize: 10,
    italic: true,
  }),
  createTextElement('p8_disclaimer', 8, 'Entre la date de cette proposition et la date de mise en place de la location, Le groupe Cybertek peut, avec notification au locataire, ajuster le montant du loyer de sorte que l\'économie du dossier soit maintenue.', { x: 20, y: 405 }, { width: 350, height: 50 }, {
    fontSize: 9,
  }),
];

// Export de tous les éléments par page (pages par défaut)
export const PDF_TEMPLATE_ELEMENTS: Record<number, EditableElement[]> = {
  1: PAGE_1_ELEMENTS,
  2: PAGE_2_ELEMENTS,
  3: PAGE_3_ELEMENTS,
  4: PAGE_4_ELEMENTS,
  5: PAGE_5_ELEMENTS,
  6: PAGE_6_ELEMENTS,
  7: PAGE_7_ELEMENTS,
  8: PAGE_8_ELEMENTS,
};

// Obtenir tous les éléments pour une page
export function getPageElements(pageNumber: number): EditableElement[] {
  return PDF_TEMPLATE_ELEMENTS[pageNumber] || [];
}

// Obtenir le nombre total d'éléments éditables
export function getTotalEditableElements(): number {
  return Object.values(PDF_TEMPLATE_ELEMENTS).reduce(
    (total, elements) => total + elements.filter(e => !e.isDynamic).length,
    0
  );
}

// Fonctions de calcul pour le workflow Proposition
// Basées sur les formules Excel de Matrice_Location

import { getBaseTauxRuntime } from '@/stores/baseTauxStore';
import { getFraisDossier } from '@/data/frais-dossier';

/**
 * Lookup du coefficient dans la table Base Taux
 * La durée dans Base Taux est maintenant en MOIS (comparaison directe)
 */
export function lookupCoefficient(
  partenaire: string | null,
  montant: number | null,
  dureeMois: number | null
): number | null {
  if (!partenaire || montant === null || dureeMois === null) {
    return null;
  }

  // Chercher la ligne correspondante dans Base Taux (comparaison directe en mois)
  const match = getBaseTauxRuntime().find(row =>
    row.partenaire === partenaire &&
    row.montantMin <= montant &&
    row.montantMax >= montant &&
    row.dureeMois === dureeMois
  );

  return match?.taux ?? null;
}

/**
 * Calcule l'investissement margé
 * Formule: Montant Investissement / (1 - Marge Appliquée / 100)
 */
export function calculateInvestMarge(
  montantInvestissement: number | null,
  margeAppliquee: number
): number | null {
  if (montantInvestissement === null || margeAppliquee >= 100) {
    return null;
  }
  const result = montantInvestissement / (1 - margeAppliquee / 100);
  return Math.round(result * 100) / 100;
}

/**
 * Calcule les services inclus dans le loyer
 * Formule: Somme des prix des options services sélectionnées
 */
export function calculateServicesInclusLoyers(
  optionsPrices: (number | null)[]
): number | null {
  const validPrices = optionsPrices.filter((p): p is number => p !== null && p > 0);
  if (validPrices.length === 0) return null;
  return Math.round(validPrices.reduce((sum, p) => sum + p, 0) * 100) / 100;
}

/**
 * Calcule le loyer services inclus
 * Formule: Services Inclus Loyers * Coefficient / 100
 */
export function calculateLoyerServicesInclus(
  servicesInclusLoyers: number | null,
  coefficient: number | null
): number | null {
  if (servicesInclusLoyers === null || coefficient === null) {
    return null;
  }
  const result = servicesInclusLoyers * coefficient / 100;
  return Math.round(result * 100) / 100;
}

/**
 * Calcule le loyer mensuel
 * Formule: (Invest Margé * Coefficient / 100) + Loyer Services Inclus
 */
export function calculateLoyerMensuel(
  investMarge: number | null,
  coefficient: number | null,
  loyerServicesInclus: number | null
): number | null {
  if (investMarge === null || coefficient === null) {
    return null;
  }
  const loyerBase = investMarge * coefficient / 100;
  const loyerServices = loyerServicesInclus ?? 0;
  return Math.round((loyerBase + loyerServices) * 100) / 100;
}

/**
 * Calcule la somme des loyers
 * Formule: Loyer Mensuel * Durée
 */
export function calculateSommeLoyers(
  loyerMensuel: number | null,
  duree: number | null
): number | null {
  if (loyerMensuel === null || duree === null) {
    return null;
  }
  return Math.round(loyerMensuel * duree * 100) / 100;
}

/**
 * Calcule le loyer trimestriel (mensuel × 3)
 */
export function calculateLoyerTrimestriel(loyerMensuel: number | null): number | null {
  if (loyerMensuel === null) return null;
  return Math.round(loyerMensuel * 3 * 100) / 100;
}

/**
 * Calcule le coût du contrat
 * Formule: Somme des Loyers - Montant Investissement
 */
export function calculateCoutContrat(
  sommeLoyers: number | null,
  montantInvestissement: number | null
): number | null {
  if (sommeLoyers === null || montantInvestissement === null) {
    return null;
  }
  return Math.round((sommeLoyers - montantInvestissement) * 100) / 100;
}

/**
 * Calcule le coût locatif annuel en pourcentage
 * Formule: ((Coût du contrat / Montant Investissement) * 100) / Nombre d'années
 * Où Coût du contrat = Somme Loyers - Montant Investissement
 */
export function calculateCoutLocatifAnnuel(
  sommeLoyers: number | null,
  duree: number | null,
  montantInvestissement: number | null
): number | null {
  if (sommeLoyers === null || duree === null || montantInvestissement === null || montantInvestissement === 0) {
    return null;
  }
  const nbAnnees = duree / 12;
  if (nbAnnees === 0) return null;
  
  // Coût du contrat = Somme Loyers - Montant Investissement
  const coutContrat = sommeLoyers - montantInvestissement;
  // ((Coût du contrat / Montant Investissement) * 100) / Nombre d'années
  const pourcentage = ((coutContrat / montantInvestissement) * 100) / nbAnnees;
  return Math.round(pourcentage * 100) / 100;
}

/**
 * Calcule la marge location
 * Formule: Invest Margé - Montant Investissement
 */
export function calculateMargeLoc(
  investMarge: number | null,
  montantInvestissement: number | null
): number | null {
  if (investMarge === null || montantInvestissement === null) {
    return null;
  }
  return Math.round((investMarge - montantInvestissement) * 100) / 100;
}

/**
 * Calcule le loyer mensuel sur investissement (hors services)
 * Formule: Invest Margé * Coefficient / 100
 */
export function calculateLoyerMensuelInvestissement(
  investMarge: number | null,
  coefficient: number | null
): number | null {
  if (investMarge === null || coefficient === null) {
    return null;
  }
  const result = investMarge * coefficient / 100;
  return Math.round(result * 100) / 100;
}

/**
 * Interface pour les résultats des calculs
 */
export interface CalculatedMatriceValues {
  coefficient: number | null;
  coefficientAuto: number | null; // valeur issue du lookup Base Taux (non modifiée par l'override)
  investMarge: number | null;
  servicesInclusLoyers: number | null;
  loyerServicesInclus: number | null;
  loyerMensuelInvestissement: number | null;
  loyerMensuel: number | null;
  loyerTrimestriel: number | null;
  sommeLoyers: number | null;
  coutContrat: number | null;
  coutLocatifAnnuel: number | null;
  margeLoc: number | null;
  fraisDossier: number | null;
}

/**
 * Calcule toutes les valeurs de la matrice
 */
export function calculateAllMatriceValues(
  montantInvestissement: number | null,
  duree: number | null,
  refinanceur: string | null,
  margeAppliquee: number,
  optionsPrices: (number | null)[],
  coefficientOverride?: number | null
): CalculatedMatriceValues {
  // Lookup coefficient (auto), sauf si override fourni
  const coefficientAuto = lookupCoefficient(refinanceur, montantInvestissement, duree);
  const coefficient = (coefficientOverride != null) ? coefficientOverride : coefficientAuto;
  
  // Calcul invest margé
  const investMarge = calculateInvestMarge(montantInvestissement, margeAppliquee);
  
  // Calcul services inclus
  const servicesInclusLoyers = calculateServicesInclusLoyers(optionsPrices);
  
  // Calcul loyer services inclus
  const loyerServicesInclus = calculateLoyerServicesInclus(servicesInclusLoyers, coefficient);
  
  // Calcul loyer mensuel sur investissement (hors services)
  const loyerMensuelInvestissement = calculateLoyerMensuelInvestissement(investMarge, coefficient);
  
  // Calcul loyer mensuel total (investissement + services)
  const loyerMensuel = calculateLoyerMensuel(investMarge, coefficient, loyerServicesInclus);
  
  // Calcul somme loyers
  const sommeLoyers = calculateSommeLoyers(loyerMensuel, duree);
  
  // Calcul coût contrat
  const coutContrat = calculateCoutContrat(sommeLoyers, montantInvestissement);
  
  // Calcul coût locatif annuel
  const coutLocatifAnnuel = calculateCoutLocatifAnnuel(sommeLoyers, duree, montantInvestissement);
  
  // Calcul marge loc
  const margeLoc = calculateMargeLoc(investMarge, montantInvestissement);
  
  // Frais de dossier
  const fraisDossier = getFraisDossier(refinanceur);
  
  return {
    coefficient,
    coefficientAuto,
    investMarge,
    servicesInclusLoyers,
    loyerServicesInclus,
    loyerMensuelInvestissement,
    loyerMensuel,
    sommeLoyers,
    coutContrat,
    coutLocatifAnnuel,
    margeLoc,
    fraisDossier,
  };
}

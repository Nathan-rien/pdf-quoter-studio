/**
 * Règles de calcul - INTERDICTION PAR DÉFAUT
 * 
 * RÈGLE ABSOLUE : Aucun calcul automatique n'est autorisé.
 * 
 * Les calculs suivants sont INTERDITS tant que non définis explicitement :
 * - Sous-totaux
 * - Totaux
 * - TVA
 * - Remises
 * - Mensualités / Trimestrialités
 * - Taux
 * - Tout autre calcul dérivé
 * 
 * Les valeurs affichées/exportées proviennent UNIQUEMENT des sources :
 * - Excel (tel quel)
 * - CSV (tel quel, si contrat défini)
 * - Template (contenu fixe)
 */

export const CALCULATION_RULES = {
  // Tous les calculs sont interdits par défaut
  totalAllowed: false,
  subTotalAllowed: false,
  tvaAllowed: false,
  discountCalculationAllowed: false,
  monthlyPaymentAllowed: false,
  rateApplicationAllowed: false,
  
  /**
   * Message d'erreur bloquant pour tentative de calcul
   */
  getBlockingMessage: (calculationType: string): string => {
    return `BLOCAGE : Calcul "${calculationType}" non autorisé. ` +
           `Aucune règle de calcul n'est définie (formule, sources, arrondis, gestion des nulls). ` +
           `Action: Définissez explicitement la règle de calcul ou utilisez les valeurs sources.`;
  }
} as const;

/**
 * Vérifie qu'une valeur affichée provient bien des sources
 * et n'est pas le résultat d'un calcul implicite
 */
export function validateNoImplicitCalculation(
  displayedValue: number,
  sourceValues: number[],
  context: string
): { isValid: boolean; error?: string } {
  // Si la valeur affichée ne correspond à aucune source, c'est un calcul implicite
  const isFromSource = sourceValues.includes(displayedValue);

  if (!isFromSource) {
    return {
      isValid: false,
      error: CALCULATION_RULES.getBlockingMessage(context)
    };
  }

  return { isValid: true };
}

/**
 * Retourne la somme des VTN UNIQUEMENT si cette valeur existe dans les sources
 * Sinon, retourne null pour indiquer qu'aucun total ne peut être affiché
 * 
 * NOTE : Cette fonction est utilisée pour afficher un "total" qui doit
 * provenir des données source (ligne "TOTAL" dans Excel), pas d'un calcul.
 */
export function getSourceTotal(
  values: (number | null)[],
  sourceLabels: (string | null)[]
): { total: number | null; isFromSource: boolean; sourceRowIndex: number | null } {
  // Chercher une ligne explicitement nommée "TOTAL" ou similaire
  for (let i = 0; i < sourceLabels.length; i++) {
    const label = sourceLabels[i];
    if (label && /^total/i.test(label.trim())) {
      const value = values[i];
      if (value !== null && typeof value === 'number') {
        return {
          total: value,
          isFromSource: true,
          sourceRowIndex: i
        };
      }
    }
  }

  // Aucun total trouvé dans les sources
  return {
    total: null,
    isFromSource: false,
    sourceRowIndex: null
  };
}

/**
 * Vérifie si un calcul spécifique est autorisé
 * NOTE: Tous les calculs sont actuellement interdits par défaut
 */
export function isCalculationAllowed(calculationType: string): boolean {
  const allowedCalcs: Record<string, boolean> = {
    total: CALCULATION_RULES.totalAllowed,
    subTotal: CALCULATION_RULES.subTotalAllowed,
    tva: CALCULATION_RULES.tvaAllowed,
    discount: CALCULATION_RULES.discountCalculationAllowed,
    monthlyPayment: CALCULATION_RULES.monthlyPaymentAllowed,
    rate: CALCULATION_RULES.rateApplicationAllowed,
  };
  return allowedCalcs[calculationType] ?? false;
}

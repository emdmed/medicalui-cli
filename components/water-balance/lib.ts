/**
 * Pure water-balance calculation functions.
 */

export const safeParseFloat = (value: any): number => {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

export const calculateInsensibleLoss = (weightKg: any): string => {
  return (safeParseFloat(weightKg) * 12).toFixed(0);
};

export const calculateEndogenousGeneration = (weightKg: any): string => {
  return (safeParseFloat(weightKg) * 4.5).toFixed(0);
};

export const calculateDefecationLoss = (count: any): string => {
  return (safeParseFloat(count) * 120).toFixed(0);
};

export const calculateWaterBalance = (
  weight: string,
  fluidIntakeOral: string,
  fluidIntakeIV: string,
  diuresis: string,
  defecationCount: string,
): string => {
  const weightNum = safeParseFloat(weight);
  const insensibleLoss = safeParseFloat(calculateInsensibleLoss(weightNum));
  const endogenousGeneration = safeParseFloat(
    calculateEndogenousGeneration(weightNum),
  );
  const defecationLoss = safeParseFloat(
    calculateDefecationLoss(defecationCount),
  );

  const intake =
    safeParseFloat(fluidIntakeOral) +
    safeParseFloat(fluidIntakeIV) +
    endogenousGeneration;
  const output = safeParseFloat(diuresis) + defecationLoss + insensibleLoss;
  return (intake - output).toFixed(0);
};

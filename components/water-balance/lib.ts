/**
 * Pure water-balance calculation functions.
 */

// ─── Clinical Constants ──────────────────────────────────────────────
const INSENSIBLE_LOSS_ML_PER_KG_DAY = 12;
const ENDOGENOUS_GENERATION_ML_PER_KG_DAY = 4.5;
const DEFECATION_LOSS_ML_PER_STOOL = 120;

export const safeParseFloat = (value: string | number | null | undefined): number => {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
};

export const calculateInsensibleLoss = (weightKg: string | number | null | undefined): string => {
  return (safeParseFloat(weightKg) * INSENSIBLE_LOSS_ML_PER_KG_DAY).toFixed(0);
};

export const calculateEndogenousGeneration = (weightKg: string | number | null | undefined): string => {
  return (safeParseFloat(weightKg) * ENDOGENOUS_GENERATION_ML_PER_KG_DAY).toFixed(0);
};

export const calculateDefecationLoss = (count: string | number | null | undefined): string => {
  return (safeParseFloat(count) * DEFECATION_LOSS_ML_PER_STOOL).toFixed(0);
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

/**
 * Pure DKA (Diabetic Ketoacidosis) monitoring functions.
 */

const safeParseFloat = (value: any): number => {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

export const calculateGlucoseReductionRate = (
  current: string,
  previous: string,
  hours: string,
): string | null => {
  const h = safeParseFloat(hours);
  if (h <= 0) return null;
  if (current === "" || previous === "") return null;
  const curr = safeParseFloat(current);
  const prev = safeParseFloat(previous);
  const rate = (prev - curr) / h;
  return rate.toFixed(1);
};

export const isGlucoseOnTarget = (rate: string | null, unit: "mmol" | "mgdl"): boolean => {
  if (!rate) return false;
  const r = parseFloat(rate);
  if (isNaN(r)) return false;
  return unit === "mmol" ? r >= 3.0 : r >= 54;
};

export const calculateKetoneReductionRate = (
  current: string,
  previous: string,
  hours: string,
): string | null => {
  const h = safeParseFloat(hours);
  if (h <= 0) return null;
  if (current === "" || previous === "") return null;
  const curr = safeParseFloat(current);
  const prev = safeParseFloat(previous);
  const rate = (prev - curr) / h;
  return rate.toFixed(2);
};

export const isKetoneOnTarget = (rate: string | null): boolean => {
  if (!rate) return false;
  const r = parseFloat(rate);
  return !isNaN(r) && r >= 0.5;
};

export const calculateBicarbonateIncreaseRate = (
  current: string,
  previous: string,
  hours: string,
): string | null => {
  const h = safeParseFloat(hours);
  if (h <= 0) return null;
  if (current === "" || previous === "") return null;
  const curr = safeParseFloat(current);
  const prev = safeParseFloat(previous);
  const rate = (curr - prev) / h;
  return rate.toFixed(1);
};

export const isBicarbonateOnTarget = (rate: string | null): boolean => {
  if (!rate) return false;
  const r = parseFloat(rate);
  return !isNaN(r) && r >= 3.0;
};

export const classifyPotassium = (value: string): string => {
  const v = safeParseFloat(value);
  if (v === 0 && value === "") return "Unknown";
  if (v < 3.0) return "Critical Low";
  if (v < 4.0) return "Low";
  if (v <= 5.0) return "Normal";
  if (v <= 6.0) return "High";
  return "Critical High";
};

export const getPotassiumSeverity = (value: string): string => {
  const v = safeParseFloat(value);
  if (v === 0 && value === "") return "default";
  if (v < 3.0) return "critical";
  if (v < 4.0) return "warning";
  if (v <= 5.0) return "normal";
  if (v <= 6.0) return "warning";
  return "critical";
};

export const calculateUrineOutputRate = (
  volume: string,
  weight: string,
  hours: string,
): string | null => {
  const w = safeParseFloat(weight);
  const h = safeParseFloat(hours);
  if (w <= 0 || h <= 0) return null;
  const vol = safeParseFloat(volume);
  const rate = vol / (w * h);
  return rate.toFixed(2);
};

export const isUrineOutputOnTarget = (rate: string | null): boolean => {
  if (!rate) return false;
  const r = parseFloat(rate);
  return !isNaN(r) && r >= 0.5;
};

export const classifyGCS = (value: string): string => {
  const v = safeParseFloat(value);
  if (v === 0 && value === "") return "Unknown";
  if (v < 3 || v > 15) return "Invalid";
  if (v === 15) return "Normal";
  if (v >= 13) return "Mild";
  if (v >= 9) return "Moderate";
  return "Severe";
};

export const isGCSDecreasing = (current: string, previous: string): boolean => {
  const curr = safeParseFloat(current);
  const prev = safeParseFloat(previous);
  if (curr === 0 || prev === 0) return false;
  return (prev - curr) >= 2;
};

export const assessDKAResolution = (
  glucose: string,
  ketones: string,
  bicarbonate: string,
  pH: string,
  unit: "mmol" | "mgdl",
): { resolved: boolean; criteria: Record<string, boolean> } => {
  const glu = safeParseFloat(glucose);
  const ket = safeParseFloat(ketones);
  const bic = safeParseFloat(bicarbonate);
  const ph = safeParseFloat(pH);

  const glucoseThreshold = unit === "mmol" ? 11.1 : 200;
  const glucoseMet = glu > 0 && glu < glucoseThreshold;
  const ketonesMet = ket >= 0 && ketones !== "" && ket < 0.6;
  const bicarbonateMet = bic >= 15;
  const pHMet = ph > 7.30;

  return {
    resolved: glucoseMet && ketonesMet && bicarbonateMet && pHMet,
    criteria: {
      glucose: glucoseMet,
      ketones: ketonesMet,
      bicarbonate: bicarbonateMet,
      pH: pHMet,
    },
  };
};

export const suggestInsulinAdjustment = (
  glucose: string,
  rate: string | null,
  insulinRate: string,
  unit: "mmol" | "mgdl",
): string => {
  const glu = safeParseFloat(glucose);
  const ins = safeParseFloat(insulinRate);

  if (glu === 0 && glucose === "") return "Insufficient data";
  if (ins <= 0) return "Insufficient data";

  const lowThreshold = unit === "mmol" ? 14 : 252;
  const targetThreshold = unit === "mmol" ? 11.1 : 200;

  if (glu < targetThreshold) {
    return "Consider switching to subcutaneous insulin";
  }

  if (glu < lowThreshold) {
    return "Consider reducing insulin rate and adding dextrose";
  }

  if (rate) {
    const r = parseFloat(rate);
    if (!isNaN(r)) {
      const targetRate = unit === "mmol" ? 3.0 : 54;
      if (r < targetRate) {
        return "Consider increasing insulin rate";
      }
    }
  }

  return "Maintain current insulin rate";
};

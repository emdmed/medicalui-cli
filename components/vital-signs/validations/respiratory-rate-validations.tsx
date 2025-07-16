export type RespiratoryRateCategory = "Elevated" | "Low" | "Normal";

export interface RespiratoryRateValidation {
  category: RespiratoryRateCategory;
}

export const RESPIRATORY_RATE_LIMITS = {
  MIN: 8,
  MAX: 40,
  CATEGORIES: {
    ELEVATED: 18,
    LOW: 12,
  },
};

export const validateRespiratoryRateInput = (value: string | number): string | null => {
  const num = parseInt(value?.toString() || "");
  
  if (isNaN(num) || num < RESPIRATORY_RATE_LIMITS.MIN || num > RESPIRATORY_RATE_LIMITS.MAX) {
    return `Respiratory rate must be between ${RESPIRATORY_RATE_LIMITS.MIN}-${RESPIRATORY_RATE_LIMITS.MAX} breaths/min`;
  }
  
  return null;
};

export const isValidRespiratoryRateInput = (value: string): boolean => {
  if (value === "") return true;
  
  const numValue = parseInt(value, 10);
  if (!/^\d+$/.test(value)) return false;
  
  return numValue <= RESPIRATORY_RATE_LIMITS.MAX;
};

export const getRespiratoryRateCategory = (respiratoryRate: string | number): RespiratoryRateValidation | null => {
  const rate = typeof respiratoryRate === 'string' ? parseInt(respiratoryRate) : respiratoryRate;
  
  if (!rate || isNaN(rate)) return null;
  
  if (rate > RESPIRATORY_RATE_LIMITS.CATEGORIES.ELEVATED) {
    return { category: "Elevated" };
  }
  
  if (rate < RESPIRATORY_RATE_LIMITS.CATEGORIES.LOW) {
    return { category: "Low" };
  }
  
  return { category: "Normal" };
};

export const parseRespiratoryRateValue = (value: string | number): number => {
  const parsed = parseInt(value?.toString() || "");
  return isNaN(parsed) ? 0 : parsed;
};
export interface HeartRateCategory {
  category: "Elevated" | "Low" | "Normal";
}

export const HEART_RATE_LIMITS = {
  MIN: 30,
  MAX: 220,
  CATEGORIES: {
    ELEVATED: 100,
    LOW: 60,
  },
};

export const validateHeartRateInput = (value: string): boolean => {
  const num = parseInt(value);
  return !isNaN(num) && num >= HEART_RATE_LIMITS.MIN && num <= HEART_RATE_LIMITS.MAX;
};

export const getHeartRateCategory = (heartRate: number): HeartRateCategory | null => {
  if (!heartRate) return null;
  
  if (heartRate > HEART_RATE_LIMITS.CATEGORIES.ELEVATED) {
    return { category: "Elevated" };
  }
  
  if (heartRate < HEART_RATE_LIMITS.CATEGORIES.LOW) {
    return { category: "Low" };
  }
  
  return { category: "Normal" };
};

export const parseHeartRateValue = (value: string): number => {
  const parsed = parseInt(value);
  return isNaN(parsed) ? 0 : parsed;
};
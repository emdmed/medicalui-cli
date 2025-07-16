
export interface BloodPressureValue {
  systolic: string | number;
  diastolic: string | number;
}

export interface BloodPressureCategory {
  category: "High" | "Low" | "Normal";
}

export const BLOOD_PRESSURE_LIMITS = {
  SYSTOLIC: {
    MIN: 40,
    MAX: 350,
    VALIDATION_MIN: 50,
  },
  DIASTOLIC: {
    MIN: 10,
    MAX: 130,
  },
  CATEGORIES: {
    HIGH_SYSTOLIC: 130,
    HIGH_DIASTOLIC: 90,
    LOW_SYSTOLIC: 90,
    LOW_DIASTOLIC: 60,
  },
};

export const validateBloodPressureInput = (
  bloodPressureValue?: BloodPressureValue
): string | null => {
  const systolicNum = parseInt(bloodPressureValue?.systolic?.toString() || "", 10);
  const diastolicNum = parseInt(bloodPressureValue?.diastolic?.toString() || "", 10);

  if (!bloodPressureValue?.systolic || !bloodPressureValue?.diastolic) {
    return "Both systolic and diastolic values are required";
  }

  if (systolicNum < BLOOD_PRESSURE_LIMITS.SYSTOLIC.MIN || systolicNum > BLOOD_PRESSURE_LIMITS.SYSTOLIC.MAX) {
    return `Systolic must be between ${BLOOD_PRESSURE_LIMITS.SYSTOLIC.VALIDATION_MIN}-${BLOOD_PRESSURE_LIMITS.SYSTOLIC.MAX} mmHg`;
  }
  
  if (diastolicNum < BLOOD_PRESSURE_LIMITS.DIASTOLIC.MIN || diastolicNum > BLOOD_PRESSURE_LIMITS.DIASTOLIC.MAX) {
    return `Diastolic must be between ${BLOOD_PRESSURE_LIMITS.DIASTOLIC.MIN}-${BLOOD_PRESSURE_LIMITS.DIASTOLIC.MAX} mmHg`;
  }

  if (systolicNum <= diastolicNum) {
    return "Systolic must be higher than diastolic";
  }

  return null;
};

export const isValidBloodPressureInput = (
  value: string, 
  type: 'systolic' | 'diastolic'
): boolean => {
  if (value === "") return true;
  
  const numValue = parseInt(value, 10);
  if (!/^\d+$/.test(value)) return false;
  
  const limits = type === 'systolic' 
    ? BLOOD_PRESSURE_LIMITS.SYSTOLIC 
    : BLOOD_PRESSURE_LIMITS.DIASTOLIC;
    
  return numValue <= limits.MAX;
};

export const getBloodPressureCategory = (
  systolic: number, 
  diastolic: number
): BloodPressureCategory | null => {
  if (!systolic || !diastolic) return null;
  
  const { HIGH_SYSTOLIC, HIGH_DIASTOLIC, LOW_SYSTOLIC, LOW_DIASTOLIC } = 
    BLOOD_PRESSURE_LIMITS.CATEGORIES;
  
  if (systolic > HIGH_SYSTOLIC || diastolic >= HIGH_DIASTOLIC) {
    return { category: "High" };
  }
  
  if (systolic < LOW_SYSTOLIC || diastolic < LOW_DIASTOLIC) {
    return { category: "Low" };
  }
  
  return null;
};

export const parseBloodPressureValues = (
  bloodPressureValue?: BloodPressureValue
): { systolic: number; diastolic: number } | null => {
  if (!bloodPressureValue?.systolic || !bloodPressureValue?.diastolic) {
    return null;
  }
  
  const systolic = parseInt(bloodPressureValue.systolic.toString(), 10);
  const diastolic = parseInt(bloodPressureValue.diastolic.toString(), 10);
  
  if (isNaN(systolic) || isNaN(diastolic)) {
    return null;
  }
  
  return { systolic, diastolic };
};
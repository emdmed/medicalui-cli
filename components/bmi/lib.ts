/**
 * Pure BMI calculation functions.
 */

// Realistic upper bounds to reject data-entry errors
const MAX_WEIGHT_KG = 700;     // heaviest recorded human ~635 kg
const MAX_WEIGHT_LBS = 1500;   // ~680 kg
const MAX_HEIGHT_M = 2.75;     // tallest recorded human 2.72 m
const MAX_HEIGHT_IN = 108;     // 9 feet

export const calculateBMI = (
  w: string,
  hFt: string,
  hIn: string,
  hM: string,
  metric: boolean,
): string | null => {
  const weightNum = parseFloat(w);
  if (isNaN(weightNum) || weightNum <= 0) return null;

  if (metric) {
    if (weightNum > MAX_WEIGHT_KG) return null;
    const heightNum = parseFloat(hM);
    if (isNaN(heightNum) || heightNum <= 0 || heightNum > MAX_HEIGHT_M) return null;
    return (weightNum / (heightNum * heightNum)).toFixed(1);
  } else {
    if (weightNum > MAX_WEIGHT_LBS) return null;
    const feet = parseFloat(hFt) || 0;
    const inches = parseFloat(hIn) || 0;
    const totalInches = feet * 12 + inches;
    if (totalInches <= 0 || totalInches > MAX_HEIGHT_IN) return null;
    return ((weightNum / (totalInches * totalInches)) * 703).toFixed(1);
  }
};

export const getBMICategory = (bmi: string | null): string => {
  if (!bmi) return "Unknown";
  const bmiNum = parseFloat(bmi);
  if (bmiNum < 18.5) return "Underweight";
  if (bmiNum < 25) return "Normal";
  if (bmiNum < 30) return "Overweight";
  return "Obese";
};

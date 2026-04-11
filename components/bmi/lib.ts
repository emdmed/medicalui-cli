/**
 * Pure BMI calculation functions.
 */

export const calculateBMI = (
  w: string,
  hFt: string,
  hIn: string,
  hM: string,
  metric: boolean,
): string | null => {
  const weightNum = parseFloat(w);

  if (weightNum > 0) {
    if (metric) {
      const heightNum = parseFloat(hM);
      if (heightNum > 0) {
        return (weightNum / (heightNum * heightNum)).toFixed(1);
      }
    } else {
      const feet = parseFloat(hFt) || 0;
      const inches = parseFloat(hIn) || 0;
      const totalInches = feet * 12 + inches;

      if (totalInches > 0) {
        return ((weightNum / (totalInches * totalInches)) * 703).toFixed(1);
      }
    }
  }
  return null;
};

export const getBMICategory = (bmi: string | null): string => {
  if (!bmi) return "Unknown";
  const bmiNum = parseFloat(bmi);
  if (bmiNum < 18.5) return "Underweight";
  if (bmiNum < 25) return "Normal";
  if (bmiNum < 30) return "Overweight";
  return "Obese";
};

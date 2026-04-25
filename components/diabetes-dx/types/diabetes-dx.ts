/**
 * Type definitions for the Diabetes Diagnosis Classifier component.
 *
 * Key types for consumers:
 *   DiabetesDxProps       — Props for the main <DiabetesDxEvaluator> component
 *   DiabetesDxPatientData — Full patient data with readings
 *   DiabetesDxReading     — Single lab reading with A1C, FPG, 2h-PG, random PG
 */

export interface DiabetesDxReading {
  id: string;
  date: string;       // ISO date YYYY-MM-DD
  a1c: string;        // %
  fpg: string;        // mg/dL
  twohPG: string;     // mg/dL
  randomPG: string;   // mg/dL
}

export interface DiabetesDxPatientData {
  age: string;
  sex: string;        // "male" | "female"
  hasSymptoms: boolean;
  readings: DiabetesDxReading[];
}

export interface DiabetesDxProps {
  data?: DiabetesDxPatientData;
  onData?: (data: DiabetesDxPatientData) => void;
}

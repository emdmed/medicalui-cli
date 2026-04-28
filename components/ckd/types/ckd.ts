import type { TraceEntry } from "../../base/trace";

/**
 * Type definitions for the CKD (Chronic Kidney Disease) Evaluation component.
 *
 * Key types for consumers:
 *   CKDProps       — Props for the main <CKDEvaluator> component
 *   CKDPatientData — Full patient CKD tracking data
 *   CKDReading     — Single lab reading with creatinine + ACR
 */

export interface CKDReading {
  id: string;
  date: string;          // ISO date string (YYYY-MM-DD)

  // Labs
  creatinine: string;    // mg/dL
  acr: string;           // mg/g (urine albumin-to-creatinine ratio)

  // Calculated (stored for history display)
  egfr: number;          // mL/min/1.73m²
  gfrCategory: string;   // G1–G5
  albCategory: string;   // A1–A3
  trace?: TraceEntry[];
}

export type CKDCauseCategory =
  | ""
  | "glomerular"
  | "tubulointerstitial"
  | "vascular"
  | "cystic-congenital"
  | "systemic"
  | "unknown";

export interface CKDPatientData {
  // Demographics
  age: string;
  sex: string;           // "male" | "female"

  // Etiology
  causeCategory: CKDCauseCategory;
  causeDetail: string;   // free-text specific cause

  // Comorbidities (for treatment eligibility)
  hasDiabetes: boolean;
  hasHeartFailure: boolean;
  hasPriorCVD: boolean;
  hasKidneyTransplant: boolean;
  onMaxRASi: boolean;
  potassiumNormal: boolean;

  // Lab readings over time
  readings: CKDReading[];
}

export interface CKDProps {
  data?: CKDPatientData;
  onData?: (data: CKDPatientData) => void;
}

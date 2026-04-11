/**
 * Type definitions for the DKA Monitoring component.
 *
 * Key types for consumers:
 *   DKAProps       — Props for the main <DKAMonitor> component
 *   DKAPatientData — Full patient DKA tracking data
 *   DKAReading     — Single hourly reading with all tracked parameters
 *   DKAAlert       — Warning/critical alerts
 */

export interface DKAReading {
  id: string;
  timestamp: number; // unix seconds
  glucose: string;
  ketones: string;
  bicarbonate: string;
  pH: string;
  potassium: string;
  insulinRate: string;
  gcs: string;
  urineOutput: string;
  pCO2: string;     // mmHg
  sodium: string;   // mEq/L (Na+)
  chloride: string; // mEq/L (Cl-)
  albumin: string;  // g/dL
}

export interface DKAPatientData {
  weight: string;
  glucoseUnit: "mmol" | "mgdl";
  readings: DKAReading[];
}

export interface DKAAlert {
  type: "warning" | "critical";
  message: string;
  parameter: string;
}

export interface DKAProps {
  data?: DKAPatientData;
  onData?: (data: DKAPatientData) => void;
}

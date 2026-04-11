/**
 * Type definitions for the Sepsis/SOFA Monitoring component.
 *
 * Key types for consumers:
 *   SepsisProps       — Props for the main <SepsisMonitor> component
 *   SepsisPatientData — Full patient sepsis tracking data
 *   SepsisReading     — Single reading with all SOFA parameters
 *   Hour1Bundle       — Hour-1 resuscitation bundle tracking
 */

export interface SepsisReading {
  id: string;
  timestamp: number; // unix seconds

  // Respiration (SOFA)
  paO2: string;          // mmHg
  fiO2: string;          // % (21-100)
  onVentilation: boolean;

  // Coagulation (SOFA)
  platelets: string;     // x10^3/uL

  // Liver (SOFA)
  bilirubin: string;     // mg/dL

  // Cardiovascular (SOFA)
  map: string;           // mmHg
  dopamine: string;      // ug/kg/min
  dobutamine: string;    // ug/kg/min
  epinephrine: string;   // ug/kg/min
  norepinephrine: string; // ug/kg/min

  // CNS (SOFA)
  gcs: string;           // 3-15

  // Renal (SOFA)
  creatinine: string;    // mg/dL
  urineOutput: string;   // mL (cumulative for the period)

  // Screening
  respiratoryRate: string; // breaths/min
  sbp: string;             // mmHg

  // Lactate
  lactate: string;       // mmol/L

  // Infection
  suspectedInfection: boolean;
  infectionSource: string;
}

export interface Hour1Bundle {
  lactateMeasured: boolean;
  bloodCulturesObtained: boolean;
  antibioticsGiven: boolean;
  fluidBolusGiven: boolean;
  vasopressorsStarted: boolean;
  bundleStartTime: number | null; // unix seconds
}

export interface SepsisPatientData {
  weight: string;
  baselineSOFA: string;
  readings: SepsisReading[];
  hour1Bundle: Hour1Bundle;
}

export interface SepsisProps {
  data?: SepsisPatientData;
  onData?: (data: SepsisPatientData) => void;
}

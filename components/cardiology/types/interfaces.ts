/** Shared interfaces for cardiology risk calculators. */

// ── ASCVD ──────────────────────────────────────────────
export interface ASCVDInputs {
  age: string;
  sex: "male" | "female";
  race: "white" | "aa" | "other";
  totalCholesterol: string;
  hdlCholesterol: string;
  systolicBP: string;
  bpTreatment: boolean;
  diabetes: boolean;
  smoker: boolean;
}

export interface ASCVDResult {
  risk: string; // percentage string e.g. "7.2"
  category: string;
  severity: string;
}

// ── HEART Score ────────────────────────────────────────
export interface HEARTInputs {
  history: 0 | 1 | 2;
  ecg: 0 | 1 | 2;
  age: 0 | 1 | 2;
  riskFactors: 0 | 1 | 2;
  troponin: 0 | 1 | 2;
}

export interface HEARTResult {
  score: number;
  category: string;
  action: string;
  severity: string;
}

// ── CHA₂DS₂-VASc ──────────────────────────────────────
export interface CHADSVAScInputs {
  chf: boolean;
  hypertension: boolean;
  age75: boolean;
  diabetes: boolean;
  stroke: boolean;
  vascularDisease: boolean;
  age65: boolean;
  sexFemale: boolean;
}

export interface CHADSVAScResult {
  score: number;
  category: string;
  action: string;
  severity: string;
}

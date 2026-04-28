import type { TraceEntry } from "../../base/trace";

// ─── Cardio-metabolic ───────────────────────────────────────────────

export interface CardioMetabolicReading {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  totalCholesterol: string; // mg/dL
  ldl: string; // mg/dL
  hdl: string; // mg/dL
  triglycerides: string; // mg/dL
  hba1c: string; // %
  glucose: string; // mg/dL
  sbp: string; // mmHg
  dbp: string; // mmHg
  lpa: string; // mg/dL — Lp(a), lifetime marker
  apoB: string; // mg/dL — ApoB
  trace?: TraceEntry[];
}

// ─── Phospho-calcic ────────────────────────────────────────────────

export interface PhosphoCalcicReading {
  id: string;
  date: string;
  calcium: string; // mg/dL
  phosphorus: string; // mg/dL
  pth: string; // pg/mL
  vitaminD: string; // ng/mL (25-OH)
  albumin: string; // g/dL (for corrected Ca)
  trace?: TraceEntry[];
}

// ─── Anemia ────────────────────────────────────────────────────────

export interface AnemiaReading {
  id: string;
  date: string;
  hemoglobin: string; // g/dL
  ferritin: string; // ng/mL
  tsat: string; // % (transferrin saturation)
  iron: string; // µg/dL
  reticulocytes: string; // %
  sex?: string; // "male" | "female"
  trace?: TraceEntry[];
}

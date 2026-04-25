// ─── T1D Staging ──────────────────────────────────────────────────

export interface T1dStagingReading {
  id: string;
  date: string;
  autoantibodyCount: string;
  gad65: boolean;
  ia2: boolean;
  znt8: boolean;
  insulinAb: boolean;
  fpg: string;       // mg/dL
  twohPG: string;    // mg/dL
  a1c: string;       // %
  hasSymptoms: boolean;
}

// ─── T1 vs T2 Classification ─────────────────────────────────────

export interface T1vsT2Reading {
  id: string;
  date: string;
  age: string;
  bmi: string;
  hasAutoantibodies: boolean;
  cPeptide: string;          // pmol/L
  familyHxT1D: boolean;
  familyHxT2D: boolean;
  dkaHistory: boolean;
  otherAutoimmune: boolean;
  onInsulin: boolean;
}

// ─── T2D Screening Eligibility ───────────────────────────────────

export interface T2dScreeningReading {
  id: string;
  date: string;
  age: string;
  bmi: string;
  ethnicity: string;
  riskFactors: {
    firstDegreeRelative: boolean;
    highRiskEthnicity: boolean;
    cvdHistory: boolean;
    hypertension: boolean;
    dyslipidemia: boolean;
    pcos: boolean;
    physicalInactivity: boolean;
    insulinResistanceSigns: boolean;
    priorPrediabetes: boolean;
    priorGDM: boolean;
  };
}

// ─── GDM Screening ───────────────────────────────────────────────

export interface GdmScreeningReading {
  id: string;
  date: string;
  strategy: "one-step" | "two-step";
  gestationalAge: string;  // weeks
  fasting: string;         // mg/dL
  oneHour: string;         // mg/dL
  twoHour: string;         // mg/dL
  threeHour: string;       // mg/dL (two-step only)
}

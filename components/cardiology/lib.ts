/**
 * Pure cardiology risk calculation functions.
 * Calculators: ASCVD (Pooled Cohort Equations), HEART Score, CHA₂DS₂-VASc.
 */

import type {
  ASCVDInputs,
  HEARTInputs,
  CHADSVAScInputs,
} from "./types/interfaces";

// ── Helpers ────────────────────────────────────────────

const safeParseFloat = (value: string): number => {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

// ── ASCVD (Pooled Cohort Equations 2013) ───────────────

interface CoxCoefficients {
  lnAge: number;
  lnAgeSq: number;
  lnTC: number;
  lnAgeLnTC: number;
  lnHDL: number;
  lnAgeLnHDL: number;
  lnTreatedSBP: number;
  lnAgeLnTreatedSBP: number;
  lnUntreatedSBP: number;
  lnAgeLnUntreatedSBP: number;
  smoker: number;
  lnAgeSmoker: number;
  diabetes: number;
  meanCoeff: number;
  baselineSurvival: number;
}

const COEFFICIENTS: Record<string, CoxCoefficients> = {
  "white-female": {
    lnAge: -29.799,
    lnAgeSq: 4.884,
    lnTC: 13.54,
    lnAgeLnTC: -3.114,
    lnHDL: -13.578,
    lnAgeLnHDL: 3.149,
    lnTreatedSBP: 2.019,
    lnAgeLnTreatedSBP: 0,
    lnUntreatedSBP: 1.957,
    lnAgeLnUntreatedSBP: 0,
    smoker: 7.574,
    lnAgeSmoker: -1.665,
    diabetes: 0.661,
    meanCoeff: -29.18,
    baselineSurvival: 0.9665,
  },
  "aa-female": {
    lnAge: 17.114,
    lnAgeSq: 0,
    lnTC: 0.94,
    lnAgeLnTC: 0,
    lnHDL: -18.92,
    lnAgeLnHDL: 4.475,
    lnTreatedSBP: 29.291,
    lnAgeLnTreatedSBP: -6.432,
    lnUntreatedSBP: 27.82,
    lnAgeLnUntreatedSBP: -6.087,
    smoker: 0.691,
    lnAgeSmoker: 0,
    diabetes: 0.874,
    meanCoeff: 86.61,
    baselineSurvival: 0.9533,
  },
  "white-male": {
    lnAge: 12.344,
    lnAgeSq: 0,
    lnTC: 11.853,
    lnAgeLnTC: -2.664,
    lnHDL: -7.99,
    lnAgeLnHDL: 1.769,
    lnTreatedSBP: 1.797,
    lnAgeLnTreatedSBP: 0,
    lnUntreatedSBP: 1.764,
    lnAgeLnUntreatedSBP: 0,
    smoker: 7.837,
    lnAgeSmoker: -1.795,
    diabetes: 0.658,
    meanCoeff: 61.18,
    baselineSurvival: 0.9144,
  },
  "aa-male": {
    lnAge: 2.469,
    lnAgeSq: 0,
    lnTC: 0.302,
    lnAgeLnTC: 0,
    lnHDL: -0.307,
    lnAgeLnHDL: 0,
    lnTreatedSBP: 1.916,
    lnAgeLnTreatedSBP: 0,
    lnUntreatedSBP: 1.809,
    lnAgeLnUntreatedSBP: 0,
    smoker: 0.549,
    lnAgeSmoker: 0,
    diabetes: 0.645,
    meanCoeff: 19.54,
    baselineSurvival: 0.8954,
  },
};

export const calculateASCVD = (inputs: ASCVDInputs): string | null => {
  const age = safeParseFloat(inputs.age);
  const tc = safeParseFloat(inputs.totalCholesterol);
  const hdl = safeParseFloat(inputs.hdlCholesterol);
  const sbp = safeParseFloat(inputs.systolicBP);

  if (age < 40 || age > 79) return null;
  if (tc <= 0 || hdl <= 0 || sbp <= 0) return null;

  const raceKey = inputs.race === "aa" ? "aa" : "white";
  const sexKey = inputs.sex;
  const coeff = COEFFICIENTS[`${raceKey}-${sexKey}`];

  const lnAge = Math.log(age);
  const lnTC = Math.log(tc);
  const lnHDL = Math.log(hdl);
  const lnSBP = Math.log(sbp);

  let sum = 0;
  sum += coeff.lnAge * lnAge;
  sum += coeff.lnAgeSq * lnAge * lnAge;
  sum += coeff.lnTC * lnTC;
  sum += coeff.lnAgeLnTC * lnAge * lnTC;
  sum += coeff.lnHDL * lnHDL;
  sum += coeff.lnAgeLnHDL * lnAge * lnHDL;

  if (inputs.bpTreatment) {
    sum += coeff.lnTreatedSBP * lnSBP;
    sum += coeff.lnAgeLnTreatedSBP * lnAge * lnSBP;
  } else {
    sum += coeff.lnUntreatedSBP * lnSBP;
    sum += coeff.lnAgeLnUntreatedSBP * lnAge * lnSBP;
  }

  sum += coeff.smoker * (inputs.smoker ? 1 : 0);
  sum += coeff.lnAgeSmoker * lnAge * (inputs.smoker ? 1 : 0);
  sum += coeff.diabetes * (inputs.diabetes ? 1 : 0);

  const risk = (1 - Math.pow(coeff.baselineSurvival, Math.exp(sum - coeff.meanCoeff))) * 100;

  const clamped = Math.max(0, Math.min(100, risk));
  return clamped.toFixed(1);
};

export const getASCVDCategory = (risk: string | null): string => {
  if (!risk) return "Unknown";
  const value = parseFloat(risk);
  if (isNaN(value)) return "Unknown";
  if (value < 5) return "Low";
  if (value < 7.5) return "Borderline";
  if (value < 20) return "Intermediate";
  return "High";
};

export const getASCVDSeverity = (risk: string | null): string => {
  if (!risk) return "default";
  const value = parseFloat(risk);
  if (isNaN(value)) return "default";
  if (value < 5) return "low";
  if (value < 7.5) return "borderline";
  if (value < 20) return "intermediate";
  return "high";
};

// ── HEART Score ────────────────────────────────────────

export const calculateHEARTScore = (inputs: HEARTInputs): number => {
  return inputs.history + inputs.ecg + inputs.age + inputs.riskFactors + inputs.troponin;
};

export const getHEARTCategory = (score: number): string => {
  if (score <= 3) return "Low";
  if (score <= 6) return "Moderate";
  return "High";
};

export const getHEARTAction = (score: number): string => {
  if (score <= 3) return "Discharge with outpatient follow-up; consider stress testing";
  if (score <= 6) return "Observation, serial troponins, and non-invasive testing";
  return "Urgent invasive strategy; early cardiology consultation";
};

export const getHEARTSeverity = (score: number): string => {
  if (score <= 3) return "low";
  if (score <= 6) return "moderate";
  return "high";
};

// ── CHA₂DS₂-VASc ──────────────────────────────────────

export const calculateCHADSVASc = (inputs: CHADSVAScInputs): number => {
  let score = 0;
  if (inputs.chf) score += 1;
  if (inputs.hypertension) score += 1;
  if (inputs.age75) score += 2;
  else if (inputs.age65) score += 1;
  if (inputs.diabetes) score += 1;
  if (inputs.stroke) score += 2;
  if (inputs.vascularDisease) score += 1;
  if (inputs.sexFemale) score += 1;
  return score;
};

export const getCHADSVAScCategory = (score: number, isFemale: boolean): string => {
  if (isFemale) {
    if (score <= 1) return "Low";
    if (score === 2) return "Low-Moderate";
    return "Moderate-High";
  }
  if (score === 0) return "Low";
  if (score === 1) return "Low-Moderate";
  return "Moderate-High";
};

export const getCHADSVAScAction = (score: number, isFemale: boolean): string => {
  if (isFemale) {
    if (score <= 1) return "No anticoagulation needed";
    if (score === 2) return "Consider anticoagulation";
    return "Anticoagulation recommended";
  }
  if (score === 0) return "No anticoagulation needed";
  if (score === 1) return "Consider anticoagulation";
  return "Anticoagulation recommended";
};

export const getCHADSVAScSeverity = (score: number, isFemale: boolean): string => {
  if (isFemale) {
    if (score <= 1) return "low";
    if (score === 2) return "moderate";
    return "high";
  }
  if (score === 0) return "low";
  if (score === 1) return "moderate";
  return "high";
};

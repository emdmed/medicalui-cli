/**
 * Pure Sepsis/SOFA monitoring functions.
 * Based on Sepsis-3 (2016 Third International Consensus) and Surviving Sepsis Campaign.
 */

const safeParseFloat = (value: any): number => {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

// ─── SOFA Organ Scoring (each 0-4) ──────────────────────────────────

export const calculateRespirationSOFA = (
  paO2: string,
  fiO2: string,
  onVentilation: boolean,
): number => {
  const pao2 = safeParseFloat(paO2);
  const fio2 = safeParseFloat(fiO2);
  if (pao2 <= 0 || fio2 < 21 || fio2 > 100) return 0;

  const ratio = pao2 / (fio2 / 100);

  if (ratio < 100 && onVentilation) return 4;
  if (ratio < 200 && onVentilation) return 3;
  if (ratio < 300) return 2;
  if (ratio < 400) return 1;
  return 0;
};

export const calculateCoagulationSOFA = (platelets: string): number => {
  const p = safeParseFloat(platelets);
  if (p === 0 && platelets === "") return 0;
  if (p < 20) return 4;
  if (p < 50) return 3;
  if (p < 100) return 2;
  if (p < 150) return 1;
  return 0;
};

export const calculateLiverSOFA = (bilirubin: string): number => {
  const b = safeParseFloat(bilirubin);
  if (b === 0 && bilirubin === "") return 0;
  if (b >= 12) return 4;
  if (b >= 6.0) return 3;
  if (b >= 2.0) return 2;
  if (b >= 1.2) return 1;
  return 0;
};

export const calculateCardiovascularSOFA = (
  map: string,
  dopamine: string,
  dobutamine: string,
  epinephrine: string,
  norepinephrine: string,
): number => {
  const mapVal = safeParseFloat(map);
  const dopa = safeParseFloat(dopamine);
  const dobu = safeParseFloat(dobutamine);
  const epi = safeParseFloat(epinephrine);
  const norepi = safeParseFloat(norepinephrine);

  if (dopa > 15 || epi > 0.1 || norepi > 0.1) return 4;
  if (dopa > 5 || (epi > 0 && epi <= 0.1) || (norepi > 0 && norepi <= 0.1)) return 3;
  if ((dopa > 0 && dopa <= 5) || dobu > 0) return 2;
  if (mapVal > 0 && mapVal < 70) return 1;
  return 0;
};

export const calculateCNSSOFA = (gcs: string): number => {
  const g = safeParseFloat(gcs);
  if (g === 0 && gcs === "") return 0;
  if (g < 6) return 4;
  if (g <= 9) return 3;
  if (g <= 12) return 2;
  if (g <= 14) return 1;
  return 0;
};

export const calculateRenalSOFA = (
  creatinine: string,
  urineOutput: string,
  weight: string,
  hours: string,
): number => {
  const cr = safeParseFloat(creatinine);
  const uo = safeParseFloat(urineOutput);
  const w = safeParseFloat(weight);
  const h = safeParseFloat(hours);

  let crScore = 0;
  if (cr === 0 && creatinine === "") {
    crScore = 0;
  } else if (cr >= 5.0) {
    crScore = 4;
  } else if (cr >= 3.5) {
    crScore = 3;
  } else if (cr >= 2.0) {
    crScore = 2;
  } else if (cr >= 1.2) {
    crScore = 1;
  }

  let uoScore = 0;
  if (w > 0 && h > 0 && uo >= 0 && urineOutput !== "") {
    const rate = uo / (w * h);
    if (rate < 0.3) {
      uoScore = 4;
    } else if (rate < 0.5) {
      uoScore = 3;
    }
  }

  return Math.max(crScore, uoScore);
};

// ─── Composite SOFA ─────────────────────────────────────────────────

export const calculateTotalSOFA = (
  reading: {
    paO2: string; fiO2: string; onVentilation: boolean;
    platelets: string; bilirubin: string;
    map: string; dopamine: string; dobutamine: string;
    epinephrine: string; norepinephrine: string;
    gcs: string; creatinine: string; urineOutput: string;
  },
  weight: string,
  hours: string,
): number => {
  return (
    calculateRespirationSOFA(reading.paO2, reading.fiO2, reading.onVentilation) +
    calculateCoagulationSOFA(reading.platelets) +
    calculateLiverSOFA(reading.bilirubin) +
    calculateCardiovascularSOFA(
      reading.map, reading.dopamine, reading.dobutamine,
      reading.epinephrine, reading.norepinephrine,
    ) +
    calculateCNSSOFA(reading.gcs) +
    calculateRenalSOFA(reading.creatinine, reading.urineOutput, weight, hours)
  );
};

export const calculateSOFADelta = (current: number, baseline: string): number => {
  const base = safeParseFloat(baseline);
  return current - base;
};

// ─── qSOFA Screening ────────────────────────────────────────────────

export const calculateQSOFA = (
  respiratoryRate: string,
  sbp: string,
  gcs: string,
): number => {
  let score = 0;
  const rr = safeParseFloat(respiratoryRate);
  const s = safeParseFloat(sbp);
  const g = safeParseFloat(gcs);

  if (rr >= 22) score++;
  if (s > 0 && s <= 100) score++;
  if (g > 0 && g < 15) score++;

  return score;
};

export const isQSOFAPositive = (score: number): boolean => score >= 2;

// ─── Sepsis-3 Assessment ────────────────────────────────────────────

export const assessSepsis = (
  sofaScore: number,
  sofaDelta: number,
  suspectedInfection: boolean,
): boolean => {
  if (!suspectedInfection) return false;
  return sofaScore >= 2 || sofaDelta >= 2;
};

export const assessSepticShock = (
  hasSepsis: boolean,
  vasopressorsNeeded: boolean,
  lactate: string,
): boolean => {
  if (!hasSepsis) return false;
  if (!vasopressorsNeeded) return false;
  const lac = safeParseFloat(lactate);
  return lac > 2;
};

// ─── Hour-1 Bundle ──────────────────────────────────────────────────

export const assessBundleCompliance = (
  bundle: {
    lactateMeasured: boolean;
    bloodCulturesObtained: boolean;
    antibioticsGiven: boolean;
    fluidBolusGiven: boolean;
    vasopressorsStarted: boolean;
    bundleStartTime: number | null;
  },
  currentTime: number,
): { complete: boolean; allItemsDone: boolean; withinTimeLimit: boolean } => {
  const allItemsDone =
    bundle.lactateMeasured &&
    bundle.bloodCulturesObtained &&
    bundle.antibioticsGiven &&
    bundle.fluidBolusGiven &&
    bundle.vasopressorsStarted;

  if (!bundle.bundleStartTime) {
    return { complete: false, allItemsDone, withinTimeLimit: false };
  }

  const elapsedMinutes = (currentTime - bundle.bundleStartTime) / 60;
  const withinTimeLimit = elapsedMinutes <= 60;

  return {
    complete: allItemsDone && withinTimeLimit,
    allItemsDone,
    withinTimeLimit,
  };
};

// ─── Lactate Clearance ──────────────────────────────────────────────

export const calculateLactateClearance = (
  initial: string,
  repeat: string,
): string | null => {
  const init = safeParseFloat(initial);
  const rep = safeParseFloat(repeat);
  if (init <= 0 || initial === "") return null;
  if (repeat === "") return null;
  const clearance = ((init - rep) / init) * 100;
  return clearance.toFixed(1);
};

export const isLactateClearanceAdequate = (clearance: string | null): boolean => {
  if (!clearance) return false;
  const c = parseFloat(clearance);
  return !isNaN(c) && c >= 10;
};

// ─── Utilities ──────────────────────────────────────────────────────

export const getSOFASeverityLevel = (
  score: number,
): "Low" | "Moderate" | "High" | "Very High" => {
  if (score <= 5) return "Low";
  if (score <= 10) return "Moderate";
  if (score <= 15) return "High";
  return "Very High";
};

export const getSOFASeverity = (
  score: number,
): "normal" | "warning" | "critical" => {
  if (score <= 5) return "normal";
  if (score <= 10) return "warning";
  return "critical";
};

export const hasVasopressors = (
  dopamine: string,
  dobutamine: string,
  epinephrine: string,
  norepinephrine: string,
): boolean => {
  return (
    safeParseFloat(dopamine) > 0 ||
    safeParseFloat(dobutamine) > 0 ||
    safeParseFloat(epinephrine) > 0 ||
    safeParseFloat(norepinephrine) > 0
  );
};

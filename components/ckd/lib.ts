/**
 * Pure CKD (Chronic Kidney Disease) calculation functions.
 * Based on KDIGO 2024 guidelines, CKD-EPI 2021 equation, and 4-variable KFRE (Tangri).
 */

const safeParseFloat = (value: any): number => {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

// ─── eGFR (CKD-EPI 2021 Race-Free) ─────────────────────────────────

/**
 * CKD-EPI 2021 race-free equation.
 * 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^-1.2 × 0.9938^age × 1.012 [if female]
 * Female: κ=0.7, α=-0.241; Male: κ=0.9, α=-0.302
 */
export const calculateEGFR = (
  creatinine: string,
  age: string,
  sex: string,
): number => {
  const scr = safeParseFloat(creatinine);
  const ageVal = safeParseFloat(age);
  if (scr <= 0 || ageVal <= 0) return 0;

  const isFemale = sex.toLowerCase() === "female" || sex.toLowerCase() === "f";
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;

  const scrOverKappa = scr / kappa;
  const minTerm = Math.pow(Math.min(scrOverKappa, 1), alpha);
  const maxTerm = Math.pow(Math.max(scrOverKappa, 1), -1.2);
  const ageTerm = Math.pow(0.9938, ageVal);
  const sexFactor = isFemale ? 1.012 : 1;

  const egfr = 142 * minTerm * maxTerm * ageTerm * sexFactor;
  return Math.round(egfr * 10) / 10;
};

// ─── GFR Category ───────────────────────────────────────────────────

export const classifyGFRCategory = (egfr: string): string => {
  const val = safeParseFloat(egfr);
  if (val >= 90) return "G1";
  if (val >= 60) return "G2";
  if (val >= 45) return "G3a";
  if (val >= 30) return "G3b";
  if (val >= 15) return "G4";
  return "G5";
};

export const getGFRCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    G1: "Normal or high",
    G2: "Mildly decreased",
    G3a: "Mildly to moderately decreased",
    G3b: "Moderately to severely decreased",
    G4: "Severely decreased",
    G5: "Kidney failure",
  };
  return labels[category] ?? "Unknown";
};

// ─── Albuminuria Category ───────────────────────────────────────────

export const classifyAlbuminuriaCategory = (acr: string): string => {
  const val = safeParseFloat(acr);
  if (val < 30) return "A1";
  if (val < 300) return "A2";
  return "A3";
};

export const getAlbuminuriaCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    A1: "Normal to mildly increased",
    A2: "Moderately increased",
    A3: "Severely increased",
  };
  return labels[category] ?? "Unknown";
};

// ─── KDIGO Risk Heatmap ─────────────────────────────────────────────

export const getCKDRiskLevel = (
  gfrCategory: string,
  albCategory: string,
): string => {
  const grid: Record<string, Record<string, string>> = {
    G1:  { A1: "green",  A2: "yellow", A3: "orange" },
    G2:  { A1: "green",  A2: "yellow", A3: "orange" },
    G3a: { A1: "yellow", A2: "orange", A3: "red" },
    G3b: { A1: "orange", A2: "red",    A3: "deep-red" },
    G4:  { A1: "red",    A2: "deep-red", A3: "deep-red" },
    G5:  { A1: "deep-red", A2: "deep-red", A3: "deep-red" },
  };
  return grid[gfrCategory]?.[albCategory] ?? "green";
};

export const getMonitoringFrequency = (
  gfrCategory: string,
  albCategory: string,
): number => {
  const grid: Record<string, Record<string, number>> = {
    G1:  { A1: 1, A2: 1, A3: 2 },
    G2:  { A1: 1, A2: 1, A3: 2 },
    G3a: { A1: 1, A2: 2, A3: 3 },
    G3b: { A1: 2, A2: 3, A3: 3 },
    G4:  { A1: 3, A2: 3, A3: 4 },
    G5:  { A1: 4, A2: 4, A3: 4 },
  };
  return grid[gfrCategory]?.[albCategory] ?? 1;
};

// ─── KFRE (Kidney Failure Risk Equation) ────────────────────────────

export const calculateKFRE = (
  age: string,
  sex: string,
  egfr: string,
  acr: string,
): { twoYear: number; fiveYear: number } => {
  const ageVal = safeParseFloat(age);
  const egfrVal = safeParseFloat(egfr);
  const acrVal = safeParseFloat(acr);
  if (ageVal <= 0 || egfrVal <= 0 || acrVal <= 0) return { twoYear: 0, fiveYear: 0 };

  const isMale = sex.toLowerCase() === "male" || sex.toLowerCase() === "m";
  const maleIndicator = isMale ? 1 : 0;
  const lnACR = Math.log(acrVal);

  const lp =
    -0.2201 * (ageVal / 10 - 7.036) +
    0.2467 * (maleIndicator - 0.5642) -
    0.5567 * (egfrVal / 5 - 7.222) +
    0.4510 * (lnACR - 5.137);

  const expLP = Math.exp(lp);
  const twoYear = 1 - Math.pow(0.9832, expLP);
  const fiveYear = 1 - Math.pow(0.9365, expLP);

  return {
    twoYear: Math.round(twoYear * 1000) / 10,
    fiveYear: Math.round(fiveYear * 1000) / 10,
  };
};

// ─── Referral Assessment ────────────────────────────────────────────

export const assessReferralNeed = (kfre5yr: string): string => {
  const val = safeParseFloat(kfre5yr);
  if (val >= 40) return "krt-planning";
  if (val >= 10) return "multidisciplinary";
  if (val >= 5) return "nephrology";
  if (val >= 3) return "nephrology";
  return "none";
};

export const getReferralLabel = (referral: string): string => {
  const labels: Record<string, string> = {
    none: "No referral needed",
    nephrology: "Refer to nephrology",
    multidisciplinary: "Multidisciplinary care",
    "krt-planning": "KRT planning required",
  };
  return labels[referral] ?? "Unknown";
};

// ─── Treatment Eligibility ──────────────────────────────────────────

export const checkRASiEligibility = (
  gfrCategory: string,
  albCategory: string,
  hasDiabetes: boolean,
): { eligible: boolean; grade: string } => {
  if (albCategory === "A3") return { eligible: true, grade: "1B" };
  if (albCategory === "A2") return { eligible: true, grade: "1B" };
  if (hasDiabetes && albCategory === "A1" && gfrCategory !== "G1" && gfrCategory !== "G2") {
    return { eligible: true, grade: "2C" };
  }
  return { eligible: false, grade: "" };
};

export const checkSGLT2iEligibility = (
  egfr: string,
  acr: string,
  hasHeartFailure: boolean,
): { eligible: boolean; grade: string } => {
  const egfrVal = safeParseFloat(egfr);
  const acrVal = safeParseFloat(acr);
  if (egfrVal < 20) return { eligible: false, grade: "" };
  if (acrVal >= 200) return { eligible: true, grade: "1A" };
  if (hasHeartFailure) return { eligible: true, grade: "1A" };
  if (acrVal >= 30) return { eligible: true, grade: "2B" };
  return { eligible: false, grade: "" };
};

export const checkFinerenoneEligibility = (
  egfr: string,
  acr: string,
  hasDiabetes: boolean,
  onMaxRASi: boolean,
  potassiumNormal: boolean,
): { eligible: boolean; grade: string } => {
  const egfrVal = safeParseFloat(egfr);
  const acrVal = safeParseFloat(acr);
  if (!hasDiabetes) return { eligible: false, grade: "" };
  if (egfrVal < 25) return { eligible: false, grade: "" };
  if (acrVal < 30) return { eligible: false, grade: "" };
  if (!onMaxRASi) return { eligible: false, grade: "" };
  if (!potassiumNormal) return { eligible: false, grade: "" };
  return { eligible: true, grade: "1A" };
};

// ─── Progression Monitoring ─────────────────────────────────────────

export const calculateEGFRSlope = (
  readings: { egfr: number; date: string }[],
): number => {
  if (!Array.isArray(readings) || readings.length < 2) return 0;

  const parsed = readings
    .map((r) => ({
      egfr: typeof r.egfr === "number" ? r.egfr : parseFloat(String(r.egfr)),
      time: new Date(r.date).getTime(),
    }))
    .filter((p) => !isNaN(p.egfr) && !isNaN(p.time))
    .sort((a, b) => a.time - b.time);

  // Deduplicate by timestamp — keep last reading per date to avoid division by zero
  const seen = new Set<number>();
  const points: typeof parsed = [];
  for (let i = parsed.length - 1; i >= 0; i--) {
    if (!seen.has(parsed[i].time)) {
      seen.add(parsed[i].time);
      points.unshift(parsed[i]);
    }
  }

  if (points.length < 2) return 0;

  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  const years = points.map((p) => (p.time - points[0].time) / msPerYear);
  const egfrs = points.map((p) => p.egfr);

  const n = years.length;
  const sumX = years.reduce((a, b) => a + b, 0);
  const sumY = egfrs.reduce((a, b) => a + b, 0);
  const sumXY = years.reduce((acc, x, i) => acc + x * egfrs[i], 0);
  const sumX2 = years.reduce((acc, x) => acc + x * x, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return 0;

  const slope = (n * sumXY - sumX * sumY) / denom;
  return Math.round(slope * 10) / 10;
};

export const isRapidDecline = (slope: number): boolean => {
  return slope <= -5;
};

export const hasSignificantEGFRChange = (
  previous: number,
  current: number,
): boolean => {
  if (previous <= 0) return false;
  const change = (previous - current) / previous;
  return change > 0.2;
};

export const hasACRDoubling = (
  previous: string,
  current: string,
): boolean => {
  const prev = safeParseFloat(previous);
  const curr = safeParseFloat(current);
  if (prev <= 0) return false;
  return curr >= 2 * prev;
};

// ─── Utilities ──────────────────────────────────────────────────────

export const getCKDSeverity = (
  gfrCategory: string,
): "normal" | "warning" | "critical" => {
  if (gfrCategory === "G1" || gfrCategory === "G2") return "normal";
  if (gfrCategory === "G3a" || gfrCategory === "G3b") return "warning";
  return "critical";
};

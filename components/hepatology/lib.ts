/**
 * Hepatology sub-component classification functions.
 * MASLD/MASH screening — ADA Standards of Care 2026 Ch. 4, Fig 4.3.
 */

const sf = (v: any): number => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

type Severity = "normal" | "warning" | "critical";

// ═══════════════════════════════════════════════════════════════════
// FIB-4 CALCULATION
// ═══════════════════════════════════════════════════════════════════

export function calculateFIB4(
  age: string,
  ast: string,
  alt: string,
  platelets: string,
): { score: number; tier: "low" | "indeterminate" | "high"; severity: Severity } {
  const a = sf(age);
  const astVal = sf(ast);
  const altVal = sf(alt);
  const plt = sf(platelets);

  if (a <= 0 || astVal <= 0 || altVal <= 0 || plt <= 0) {
    return { score: 0, tier: "low", severity: "normal" };
  }

  const score = (a * astVal) / (plt * Math.sqrt(altVal));

  // Age-adjusted cutoffs per ADA 2026
  const lowCutoff = a >= 65 ? 2.0 : 1.3;
  const highCutoff = a >= 65 ? 2.67 : 2.67;

  let tier: "low" | "indeterminate" | "high";
  let severity: Severity;

  if (score < lowCutoff) {
    tier = "low";
    severity = "normal";
  } else if (score >= highCutoff) {
    tier = "high";
    severity = "critical";
  } else {
    tier = "indeterminate";
    severity = "warning";
  }

  return { score: Math.round(score * 100) / 100, tier, severity };
}

// ═══════════════════════════════════════════════════════════════════
// MASLD RISK STRATIFICATION (two-phase algorithm)
// ═══════════════════════════════════════════════════════════════════

export interface MASLDRiskResult {
  stage: string;
  action: string;
  severity: Severity;
  referral: boolean;
  interval: string;
}

export function getMASLDRiskStratification(
  fib4Score: number,
  fib4Tier: "low" | "indeterminate" | "high",
  age: string,
  lsm?: string,
  elf?: string,
): MASLDRiskResult {
  // Phase 1: FIB-4 triage
  if (fib4Tier === "high") {
    return {
      stage: "High risk — advanced fibrosis",
      action: "Refer to hepatologist",
      severity: "critical",
      referral: true,
      interval: "Immediate",
    };
  }

  if (fib4Tier === "low") {
    return {
      stage: "Low risk",
      action: "Reassess with FIB-4",
      severity: "normal",
      referral: false,
      interval: "Every 1–2 years",
    };
  }

  // Phase 2: Indeterminate FIB-4 → LSM or ELF
  const lsmVal = sf(lsm ?? "");
  const elfVal = sf(elf ?? "");

  if (lsmVal > 0) {
    if (lsmVal < 8.0) {
      return {
        stage: "Low risk (LSM confirmed)",
        action: "Reassess with FIB-4",
        severity: "normal",
        referral: false,
        interval: "Every 1–2 years",
      };
    }
    // LSM ≥ 8.0 kPa
    return {
      stage: "At-risk — significant fibrosis",
      action: "Refer to hepatologist",
      severity: "critical",
      referral: true,
      interval: "Specialist evaluation",
    };
  }

  if (elfVal > 0) {
    if (elfVal < 9.8) {
      return {
        stage: "Low risk (ELF confirmed)",
        action: "Reassess with FIB-4",
        severity: "normal",
        referral: false,
        interval: "Every 1–2 years",
      };
    }
    // ELF ≥ 9.8
    return {
      stage: "At-risk — significant fibrosis",
      action: "Refer to hepatologist",
      severity: "critical",
      referral: true,
      interval: "Specialist evaluation",
    };
  }

  // Indeterminate without phase 2 data
  return {
    stage: "Indeterminate",
    action: "Obtain LSM or ELF",
    severity: "warning",
    referral: false,
    interval: "Needs further workup",
  };
}

// ═══════════════════════════════════════════════════════════════════
// TREATMENT RECOMMENDATIONS (ADA Fig 4.3)
// ═══════════════════════════════════════════════════════════════════

export interface TreatmentRecommendation {
  obesity: string;
  diabetes: string;
  mash: string;
}

export function getMASLDTreatmentRecommendation(
  referral: boolean,
  severity: Severity,
): TreatmentRecommendation {
  if (referral || severity === "critical") {
    return {
      obesity: "Weight loss ≥10% (lifestyle ± GLP-1 RA ± metabolic surgery)",
      diabetes: "Prefer pioglitazone or GLP-1 RA for glycemic management",
      mash: "Consider resmetirom (thyroid hormone receptor-beta agonist) if biopsy-confirmed MASH with F2–F3 fibrosis",
    };
  }

  if (severity === "warning") {
    return {
      obesity: "Weight loss ≥5–7% through lifestyle modification",
      diabetes: "Optimize glycemic control; consider GLP-1 RA",
      mash: "Monitor; obtain LSM or ELF to clarify risk",
    };
  }

  return {
    obesity: "Maintain healthy weight",
    diabetes: "Standard glycemic management",
    mash: "Routine monitoring per screening interval",
  };
}

// ═══════════════════════════════════════════════════════════════════
// RISK FACTOR COUNT
// ═══════════════════════════════════════════════════════════════════

export function countRiskFactors(riskFactors: Record<string, boolean>): number {
  return Object.values(riskFactors).filter(Boolean).length;
}

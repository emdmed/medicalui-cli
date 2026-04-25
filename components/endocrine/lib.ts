/**
 * Endocrine sub-component classification functions.
 * T1D staging, T1 vs T2 classification, T2D screening, GDM screening.
 */

const sf = (v: any): number => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

type Severity = "normal" | "warning" | "critical";

// ═══════════════════════════════════════════════════════════════════
// T1D STAGING
// ═══════════════════════════════════════════════════════════════════

export function classifyT1DStage(
  autoantibodyCount: string,
  fpg: string,
  twohPG: string,
  a1c: string,
  hasSymptoms: boolean,
): { stage: 1 | 2 | 3 | 0; label: string; severity: Severity } {
  const abCount = sf(autoantibodyCount);
  const f = sf(fpg);
  const t = sf(twohPG);
  const a = sf(a1c);

  if (abCount < 2) return { stage: 0, label: "Insufficient autoantibodies", severity: "normal" };

  // Stage 3: overt hyperglycemia or symptoms
  if (hasSymptoms || a >= 6.5 || f >= 126 || t >= 200) {
    return { stage: 3, label: "Stage 3 — Symptomatic T1D", severity: "critical" };
  }

  // Stage 2: dysglycemia (prediabetes range)
  if ((a >= 5.7 && a < 6.5) || (f >= 100 && f < 126) || (t >= 140 && t < 200)) {
    return { stage: 2, label: "Stage 2 — Dysglycemia", severity: "warning" };
  }

  // Stage 1: normal glycemia with ≥2 autoantibodies
  return { stage: 1, label: "Stage 1 — Normoglycemia", severity: "normal" };
}

// ═══════════════════════════════════════════════════════════════════
// T1 vs T2 CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════

export function classifyT1vsT2(
  age: string,
  bmi: string,
  hasAutoantibodies: boolean,
  cPeptide: string,
  familyHxT1D: boolean,
  familyHxT2D: boolean,
  dkaHistory: boolean,
  otherAutoimmune: boolean,
  onInsulin: boolean,
): { classification: string; label: string; severity: Severity; features: { t1: string[]; t2: string[] } } {
  const ageVal = sf(age);
  const bmiVal = sf(bmi);
  const cp = sf(cPeptide);

  const t1Features: string[] = [];
  const t2Features: string[] = [];

  // AABBCC mnemonic scoring
  // A — Age of onset
  if (ageVal > 0 && ageVal < 30) t1Features.push("Young onset");
  if (ageVal >= 40) t2Features.push("Older onset");

  // A — Autoantibodies
  if (hasAutoantibodies) t1Features.push("Autoantibody+");
  else t2Features.push("Autoantibody−");

  // B — BMI
  if (bmiVal > 0 && bmiVal < 25) t1Features.push("Normal BMI");
  if (bmiVal >= 30) t2Features.push("Obese");

  // B — Background (family)
  if (familyHxT1D) t1Features.push("Family Hx T1D");
  if (familyHxT2D) t2Features.push("Family Hx T2D");

  // C — Complications (DKA)
  if (dkaHistory) t1Features.push("DKA history");

  // C — Comorbidities (autoimmune)
  if (otherAutoimmune) t1Features.push("Other autoimmune");

  // C-peptide decision tree
  let cpClassification: string | null = null;
  if (cp > 0) {
    if (cp < 200) cpClassification = "T1D";
    else if (cp <= 600) cpClassification = "Indeterminate";
    else cpClassification = "T2D";
  }

  // Overall classification
  const t1Score = t1Features.length;
  const t2Score = t2Features.length;

  let classification: string;
  let severity: Severity;

  if (cpClassification === "T1D" || (t1Score > t2Score && hasAutoantibodies)) {
    classification = "Type 1";
    severity = "critical";
  } else if (cpClassification === "T2D" || (t2Score > t1Score && !hasAutoantibodies)) {
    classification = "Type 2";
    severity = "warning";
  } else {
    classification = "Indeterminate";
    severity = "warning";
  }

  return {
    classification,
    label: classification,
    severity,
    features: { t1: t1Features, t2: t2Features },
  };
}

// ═══════════════════════════════════════════════════════════════════
// T2D SCREENING ELIGIBILITY
// ═══════════════════════════════════════════════════════════════════

export interface T2DScreeningResult {
  action: string;
  interval: string;
  severity: Severity;
  riskFactorCount: number;
}

export function getT2DScreeningRecommendation(
  age: string,
  bmi: string,
  ethnicity: string,
  riskFactors: Record<string, boolean>,
): T2DScreeningResult {
  const ageVal = sf(age);
  const bmiVal = sf(bmi);

  const isAsian = ethnicity.toLowerCase().includes("asian");
  const bmiThreshold = isAsian ? 23 : 25;

  const factorCount = Object.values(riskFactors).filter(Boolean).length;

  // BMI ≥ threshold + any risk factor → screen now
  if (bmiVal >= bmiThreshold && factorCount > 0) {
    return {
      action: "Screen now",
      interval: "Every 3 years if normal",
      severity: "critical",
      riskFactorCount: factorCount,
    };
  }

  // BMI ≥ threshold without risk factors
  if (bmiVal >= bmiThreshold) {
    return {
      action: "Consider screening",
      interval: "Every 3 years",
      severity: "warning",
      riskFactorCount: factorCount,
    };
  }

  // Age ≥ 35 → universal screening
  if (ageVal >= 35) {
    return {
      action: "Screen at 35+",
      interval: "Every 3 years",
      severity: "warning",
      riskFactorCount: factorCount,
    };
  }

  return {
    action: "No screening indicated",
    interval: "—",
    severity: "normal",
    riskFactorCount: factorCount,
  };
}

// ═══════════════════════════════════════════════════════════════════
// GDM SCREENING
// ═══════════════════════════════════════════════════════════════════

export interface GDMResult {
  positive: boolean;
  exceededValues: string[];
  exceededCount: number;
}

// One-step (IADPSG) — 75g OGTT, any 1 exceeded → GDM
export function classifyGDM_OneStep(
  fasting: string,
  oneHour: string,
  twoHour: string,
): GDMResult {
  const exceeded: string[] = [];
  if (sf(fasting) >= 92) exceeded.push("Fasting ≥92");
  if (sf(oneHour) >= 180) exceeded.push("1-hr ≥180");
  if (sf(twoHour) >= 153) exceeded.push("2-hr ≥153");

  return {
    positive: exceeded.length >= 1,
    exceededValues: exceeded,
    exceededCount: exceeded.length,
  };
}

// Two-step — Step 1: 50g GCT ≥130-140 → Step 2: 100g OGTT, ≥2 of 4 exceeded → GDM
export function classifyGDM_TwoStep(
  fasting: string,
  oneHour: string,
  twoHour: string,
  threeHour: string,
): GDMResult {
  const exceeded: string[] = [];
  // Carpenter-Coustan criteria
  if (sf(fasting) >= 95) exceeded.push("Fasting ≥95");
  if (sf(oneHour) >= 180) exceeded.push("1-hr ≥180");
  if (sf(twoHour) >= 155) exceeded.push("2-hr ≥155");
  if (sf(threeHour) >= 140) exceeded.push("3-hr ≥140");

  return {
    positive: exceeded.length >= 2,
    exceededValues: exceeded,
    exceededCount: exceeded.length,
  };
}

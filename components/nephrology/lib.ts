/**
 * Nephrology specialty calculations.
 *
 * - Cardio-metabolic: lipid targets, HbA1c classification, BP in CKD
 * - Phospho-calcic: Ca×P product, corrected Ca, PTH targets by CKD stage
 * - Anemia: iron deficiency assessment, Hb target, TSAT/ferritin adequacy
 */

const sf = (v: string): number => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

// ═══════════════════════════════════════════════════════════════════
// CARDIO-METABOLIC
// ═══════════════════════════════════════════════════════════════════

export function classifyLDL(ldl: string): {
  label: string;
  severity: "normal" | "warning" | "critical";
} {
  const v = sf(ldl);
  if (v === 0) return { label: "—", severity: "normal" };
  // CKD patients: LDL < 70 optimal for high CV risk
  if (v < 70) return { label: "Optimal", severity: "normal" };
  if (v < 100) return { label: "Acceptable", severity: "normal" };
  if (v < 130) return { label: "Borderline", severity: "warning" };
  return { label: "Elevated", severity: "critical" };
}

export function classifyHbA1c(hba1c: string): {
  label: string;
  severity: "normal" | "warning" | "critical";
} {
  const v = sf(hba1c);
  if (v === 0) return { label: "—", severity: "normal" };
  if (v < 5.7) return { label: "Normal", severity: "normal" };
  if (v < 6.5) return { label: "Prediabetes", severity: "warning" };
  if (v < 8.0) return { label: "Controlled diabetic", severity: "warning" };
  return { label: "Uncontrolled diabetic", severity: "critical" };
}

export function classifyBPInCKD(
  sbp: string,
  dbp: string,
): { label: string; severity: "normal" | "warning" | "critical" } {
  const s = sf(sbp);
  const d = sf(dbp);
  if (s === 0 || d === 0) return { label: "—", severity: "normal" };
  // KDIGO 2021: target < 120/80 for CKD
  if (s < 120 && d < 80) return { label: "On target", severity: "normal" };
  if (s < 140 && d < 90) return { label: "Above target", severity: "warning" };
  return { label: "Uncontrolled", severity: "critical" };
}

export function classifyTriglycerides(tg: string): {
  label: string;
  severity: "normal" | "warning" | "critical";
} {
  const v = sf(tg);
  if (v === 0) return { label: "—", severity: "normal" };
  if (v < 150) return { label: "Normal", severity: "normal" };
  if (v < 200) return { label: "Borderline", severity: "warning" };
  if (v < 500) return { label: "Elevated", severity: "warning" };
  return { label: "Very high", severity: "critical" };
}

// ═══════════════════════════════════════════════════════════════════
// PHOSPHO-CALCIC
// ═══════════════════════════════════════════════════════════════════

/** Ca × P product (mg²/dL²). Target: < 55 */
export function calculateCaPhProduct(
  calcium: string,
  phosphorus: string,
): number | null {
  const ca = sf(calcium);
  const ph = sf(phosphorus);
  if (ca === 0 || ph === 0) return null;
  return Math.round(ca * ph * 10) / 10;
}

/** Albumin-corrected calcium: Ca_corr = Ca + 0.8 × (4.0 − albumin) */
export function calculateCorrectedCalcium(
  calcium: string,
  albumin: string,
): number | null {
  const ca = sf(calcium);
  const alb = sf(albumin);
  if (ca === 0 || alb === 0) return null;
  return Math.round((ca + 0.8 * (4.0 - alb)) * 10) / 10;
}

export function classifyCalcium(ca: string): {
  label: string;
  severity: "normal" | "warning" | "critical";
} {
  const v = sf(ca);
  if (v === 0) return { label: "—", severity: "normal" };
  if (v < 8.5) return { label: "Hypocalcemia", severity: "warning" };
  if (v > 10.5) return { label: "Hypercalcemia", severity: "warning" };
  return { label: "Normal", severity: "normal" };
}

export function classifyPhosphorus(ph: string): {
  label: string;
  severity: "normal" | "warning" | "critical";
} {
  const v = sf(ph);
  if (v === 0) return { label: "—", severity: "normal" };
  if (v < 2.5) return { label: "Hypophosphatemia", severity: "warning" };
  if (v > 4.5) return { label: "Hyperphosphatemia", severity: "warning" };
  return { label: "Normal", severity: "normal" };
}

export function classifyPTH(pth: string, gfrCategory?: string): {
  label: string;
  severity: "normal" | "warning" | "critical";
} {
  const v = sf(pth);
  if (v === 0) return { label: "—", severity: "normal" };
  // KDIGO targets vary by CKD stage
  // G3a-G3b: keep in normal range (15-65 pg/mL)
  // G4-G5: allow 2-9× upper limit of normal
  if (gfrCategory === "G4" || gfrCategory === "G5") {
    if (v > 585) return { label: "Very high", severity: "critical" }; // >9× ULN
    if (v > 130) return { label: "Elevated (acceptable in advanced CKD)", severity: "warning" };
    return { label: "Normal", severity: "normal" };
  }
  if (v > 65) return { label: "Elevated", severity: "warning" };
  if (v < 15) return { label: "Low", severity: "warning" };
  return { label: "Normal", severity: "normal" };
}

export function classifyVitaminD(vd: string): {
  label: string;
  severity: "normal" | "warning" | "critical";
} {
  const v = sf(vd);
  if (v === 0) return { label: "—", severity: "normal" };
  if (v < 20) return { label: "Deficiency", severity: "critical" };
  if (v < 30) return { label: "Insufficiency", severity: "warning" };
  return { label: "Sufficient", severity: "normal" };
}

export function classifyCaPhProduct(product: number): {
  label: string;
  severity: "normal" | "warning" | "critical";
} {
  if (product < 55) return { label: "Normal", severity: "normal" };
  return { label: "Elevated — vascular calcification risk", severity: "critical" };
}

// ═══════════════════════════════════════════════════════════════════
// ANEMIA
// ═══════════════════════════════════════════════════════════════════

export function classifyHemoglobin(hb: string): {
  label: string;
  severity: "normal" | "warning" | "critical";
} {
  const v = sf(hb);
  if (v === 0) return { label: "—", severity: "normal" };
  // KDIGO: target Hb 10-11.5 g/dL for CKD on ESA
  if (v < 7) return { label: "Severe anemia", severity: "critical" };
  if (v < 10) return { label: "Anemia", severity: "warning" };
  if (v <= 13) return { label: "Normal / on target", severity: "normal" };
  return { label: "Elevated", severity: "normal" };
}

export function classifyFerritin(ferritin: string): {
  label: string;
  severity: "normal" | "warning" | "critical";
} {
  const v = sf(ferritin);
  if (v === 0) return { label: "—", severity: "normal" };
  // CKD non-dialysis: ferritin < 100 = absolute deficiency
  if (v < 100) return { label: "Absolute deficiency", severity: "critical" };
  if (v < 200) return { label: "Low stores", severity: "warning" };
  if (v > 800) return { label: "Overload", severity: "warning" };
  return { label: "Adequate", severity: "normal" };
}

export function classifyTSAT(tsat: string): {
  label: string;
  severity: "normal" | "warning" | "critical";
} {
  const v = sf(tsat);
  if (v === 0) return { label: "—", severity: "normal" };
  // CKD: TSAT < 20% = functional iron deficiency
  if (v < 20) return { label: "Functional deficiency", severity: "critical" };
  if (v > 50) return { label: "Oversaturation", severity: "warning" };
  return { label: "Adequate", severity: "normal" };
}

/** Assess if iron supplementation is needed (KDIGO criteria) */
export function needsIronSupplementation(
  ferritin: string,
  tsat: string,
): { needed: boolean; reason: string } {
  const f = sf(ferritin);
  const t = sf(tsat);
  if (f === 0 && t === 0) return { needed: false, reason: "" };
  if (f < 100 || t < 20) {
    return { needed: true, reason: "Absolute or functional iron deficiency" };
  }
  if (f < 200 && t < 30) {
    return { needed: true, reason: "Insufficient iron for erythropoiesis" };
  }
  return { needed: false, reason: "Adequate iron stores" };
}

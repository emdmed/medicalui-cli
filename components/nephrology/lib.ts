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

export function classifyLpa(lpa: string): {
  label: string;
  severity: "normal" | "warning" | "critical";
} {
  const v = sf(lpa);
  if (v === 0) return { label: "—", severity: "normal" };
  if (v < 30) return { label: "Normal", severity: "normal" };
  if (v < 50) return { label: "Elevated", severity: "warning" };
  return { label: "Very high", severity: "critical" };
}

export function classifyNonHDL(nonHdl: number): {
  label: string;
  severity: "normal" | "warning" | "critical";
} {
  if (nonHdl <= 0) return { label: "—", severity: "normal" };
  if (nonHdl < 100) return { label: "Optimal", severity: "normal" };
  if (nonHdl < 130) return { label: "Acceptable", severity: "normal" };
  if (nonHdl < 160) return { label: "Borderline", severity: "warning" };
  return { label: "Elevated", severity: "critical" };
}

export function classifyApoB(apoB: string): {
  label: string;
  severity: "normal" | "warning" | "critical";
} {
  const v = sf(apoB);
  if (v === 0) return { label: "—", severity: "normal" };
  if (v < 80) return { label: "Optimal", severity: "normal" };
  if (v < 100) return { label: "Acceptable", severity: "normal" };
  if (v < 120) return { label: "Borderline", severity: "warning" };
  return { label: "Elevated", severity: "critical" };
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

/**
 * Sex-specific anemia classification (KDIGO 2012).
 * Male: Hb <13 g/dL anemic; Female: Hb <12 g/dL anemic.
 * Severity: ≥threshold = none; <threshold & ≥10 = mild; <10 & ≥7 = moderate; <7 = severe.
 */
export function classifyAnemiaBySex(
  hb: string,
  sex: string,
): { label: string; severity: "normal" | "warning" | "critical"; anemic: boolean } {
  const v = sf(hb);
  if (v === 0) return { label: "—", severity: "normal", anemic: false };

  const isFemale = sex.toLowerCase() === "female" || sex.toLowerCase() === "f";
  const threshold = isFemale ? 12 : 13;

  if (v >= threshold) return { label: "Normal", severity: "normal", anemic: false };
  if (v >= 10) return { label: "Mild anemia", severity: "warning", anemic: true };
  if (v >= 7) return { label: "Moderate anemia", severity: "critical", anemic: true };
  return { label: "Severe anemia", severity: "critical", anemic: true };
}

/**
 * ESA eligibility: Hb <10 g/dL AND iron replete (ferritin ≥100, TSAT ≥20%).
 */
export function checkESAEligibility(
  hb: string,
  ferritin: string,
  tsat: string,
  sex: string,
): { eligible: boolean; reason: string } {
  const v = sf(hb);
  const f = sf(ferritin);
  const t = sf(tsat);
  if (v === 0) return { eligible: false, reason: "Invalid hemoglobin value" };

  const isFemale = sex.toLowerCase() === "female" || sex.toLowerCase() === "f";
  const threshold = isFemale ? 12 : 13;

  if (v >= threshold) return { eligible: false, reason: "Not anemic; ESA not indicated" };
  if (v >= 10) return { eligible: false, reason: "Hb ≥10 g/dL; ESA not yet indicated" };
  if (f < 100 || t < 20) return { eligible: false, reason: "Iron deficient; replete iron before ESA" };
  return { eligible: true, reason: "Hb <10 g/dL with adequate iron stores; ESA may be considered" };
}

// ═══════════════════════════════════════════════════════════════════
// PHOSPHO-CALCIC RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════

/** Phosphate recommendation based on GFR category. Target 2.5–4.5 mg/dL for G3a-G5. */
export function getPhosphateRecommendation(
  phosphorus: string,
  gfrCategory?: string,
): { status: string; recommendation: string } {
  const v = sf(phosphorus);
  if (v === 0) return { status: "unknown", recommendation: "" };

  const advanced = ["G3a", "G3b", "G4", "G5"].includes(gfrCategory ?? "");

  if (!advanced) {
    if (v >= 2.5 && v <= 4.5) return { status: "normal", recommendation: "Phosphate within normal range" };
    return {
      status: v < 2.5 ? "low" : "high",
      recommendation: v < 2.5 ? "Phosphate below normal range; evaluate cause" : "Phosphate above normal range; evaluate cause",
    };
  }

  if (v < 2.5) return { status: "low", recommendation: "Phosphate below target; evaluate cause" };
  if (v <= 4.5) return { status: "normal", recommendation: "Phosphate within target range (2.5–4.5 mg/dL)" };
  return { status: "high", recommendation: "Phosphate elevated; consider dietary restriction and phosphate binders" };
}

/** PTH recommendation by GFR category. Normal range for G1-G3b; 2–9× UNL for G4-G5. */
export function getPTHRecommendation(
  pth: string,
  gfrCategory?: string,
): { status: string; recommendation: string } {
  const v = sf(pth);
  if (v === 0) return { status: "unknown", recommendation: "" };

  const UNL = 65;

  if (gfrCategory === "G4" || gfrCategory === "G5") {
    const lower = 2 * UNL;
    const upper = 9 * UNL;
    if (v < lower) return { status: "low", recommendation: "PTH below 2× UNL; avoid over-suppression" };
    if (v <= upper) return { status: "acceptable", recommendation: `PTH within acceptable range for ${gfrCategory} (2–9× UNL)` };
    return { status: "high", recommendation: "PTH exceeds 9× UNL; consider active vitamin D or calcimimetics" };
  }

  if (v <= UNL) return { status: "normal", recommendation: "PTH within normal range" };
  return { status: "high", recommendation: "PTH elevated; evaluate for secondary hyperparathyroidism" };
}

/** Vitamin D recommendation. <20 deficient, 20-29 insufficient, ≥30 sufficient. */
export function getVitaminDRecommendation(
  vitaminD: string,
): { status: string; recommendation: string } {
  const v = sf(vitaminD);
  if (v === 0) return { status: "unknown", recommendation: "" };

  if (v < 20) return { status: "deficient", recommendation: "Vitamin D deficient; supplement with cholecalciferol" };
  if (v < 30) return { status: "insufficient", recommendation: "Vitamin D insufficient; consider supplementation" };
  return { status: "sufficient", recommendation: "Vitamin D sufficient; maintain current intake" };
}

/** CKD-MBD monitoring frequency by GFR category (KDIGO CKD-MBD 2017). */
export function getCKDMBDMonitoring(
  gfrCategory: string,
): { phosphate: string; calcium: string; pth: string; vitaminD: string } {
  if (gfrCategory === "G5") {
    return { phosphate: "Every 1–3 months", calcium: "Every 1–3 months", pth: "Every 3–6 months", vitaminD: "Baseline, then per clinical indication" };
  }
  if (gfrCategory === "G4") {
    return { phosphate: "Every 6–12 months", calcium: "Every 6–12 months", pth: "Every 6–12 months", vitaminD: "Baseline, then per clinical indication" };
  }
  if (gfrCategory === "G3a" || gfrCategory === "G3b") {
    return { phosphate: "Baseline, then per clinical indication", calcium: "Baseline, then per clinical indication", pth: "Baseline, then per clinical indication", vitaminD: "Baseline, then per clinical indication" };
  }
  return { phosphate: "Not routinely monitored", calcium: "Not routinely monitored", pth: "Not routinely monitored", vitaminD: "Per clinical indication" };
}

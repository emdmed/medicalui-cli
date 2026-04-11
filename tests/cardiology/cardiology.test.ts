import { describe, it, expect } from "vitest";
import {
  calculateASCVD,
  getASCVDCategory,
  getASCVDSeverity,
  calculateHEARTScore,
  getHEARTCategory,
  getHEARTAction,
  getHEARTSeverity,
  calculateCHADSVASc,
  getCHADSVAScCategory,
  getCHADSVAScAction,
  getCHADSVAScSeverity,
} from "../../components/cardiology/lib";
import type {
  ASCVDInputs,
  HEARTInputs,
  CHADSVAScInputs,
} from "../../components/cardiology/types/interfaces";

// ── Helper ─────────────────────────────────────────────

const baseASCVD: ASCVDInputs = {
  age: "55",
  sex: "male",
  race: "white",
  totalCholesterol: "213",
  hdlCholesterol: "50",
  systolicBP: "120",
  bpTreatment: false,
  diabetes: false,
  smoker: false,
};

const baseHEART: HEARTInputs = {
  history: 0,
  ecg: 0,
  age: 0,
  riskFactors: 0,
  troponin: 0,
};

const baseCHADS: CHADSVAScInputs = {
  chf: false,
  hypertension: false,
  age75: false,
  diabetes: false,
  stroke: false,
  vascularDisease: false,
  age65: false,
  sexFemale: false,
};

// ── ASCVD ──────────────────────────────────────────────

describe("calculateASCVD", () => {
  it("returns a numeric string for valid white male inputs", () => {
    const result = calculateASCVD(baseASCVD);
    expect(result).not.toBeNull();
    const risk = parseFloat(result!);
    expect(risk).toBeGreaterThan(0);
    expect(risk).toBeLessThan(100);
  });

  it("returns a numeric string for valid white female inputs", () => {
    const result = calculateASCVD({ ...baseASCVD, sex: "female" });
    expect(result).not.toBeNull();
    const risk = parseFloat(result!);
    expect(risk).toBeGreaterThan(0);
    expect(risk).toBeLessThan(100);
  });

  it("returns a numeric string for valid AA male inputs", () => {
    const result = calculateASCVD({ ...baseASCVD, race: "aa" });
    expect(result).not.toBeNull();
  });

  it("returns a numeric string for valid AA female inputs", () => {
    const result = calculateASCVD({ ...baseASCVD, sex: "female", race: "aa" });
    expect(result).not.toBeNull();
  });

  it("uses white coefficients for 'other' race", () => {
    const white = calculateASCVD({ ...baseASCVD, race: "white" });
    const other = calculateASCVD({ ...baseASCVD, race: "other" });
    expect(other).toBe(white);
  });

  it("returns null for age below 40", () => {
    expect(calculateASCVD({ ...baseASCVD, age: "39" })).toBeNull();
  });

  it("returns null for age above 79", () => {
    expect(calculateASCVD({ ...baseASCVD, age: "80" })).toBeNull();
  });

  it("returns valid result at age 40 (minimum)", () => {
    expect(calculateASCVD({ ...baseASCVD, age: "40" })).not.toBeNull();
  });

  it("returns valid result at age 79 (maximum)", () => {
    expect(calculateASCVD({ ...baseASCVD, age: "79" })).not.toBeNull();
  });

  it("returns null for zero total cholesterol", () => {
    expect(calculateASCVD({ ...baseASCVD, totalCholesterol: "0" })).toBeNull();
  });

  it("returns null for zero HDL", () => {
    expect(calculateASCVD({ ...baseASCVD, hdlCholesterol: "0" })).toBeNull();
  });

  it("returns null for zero systolic BP", () => {
    expect(calculateASCVD({ ...baseASCVD, systolicBP: "0" })).toBeNull();
  });

  it("returns null for empty age", () => {
    expect(calculateASCVD({ ...baseASCVD, age: "" })).toBeNull();
  });

  it("risk increases with smoking", () => {
    const noSmoke = parseFloat(calculateASCVD(baseASCVD)!);
    const smoke = parseFloat(calculateASCVD({ ...baseASCVD, smoker: true })!);
    expect(smoke).toBeGreaterThan(noSmoke);
  });

  it("risk increases with diabetes", () => {
    const noDM = parseFloat(calculateASCVD(baseASCVD)!);
    const dm = parseFloat(calculateASCVD({ ...baseASCVD, diabetes: true })!);
    expect(dm).toBeGreaterThan(noDM);
  });

  it("risk increases with BP treatment", () => {
    const noTx = parseFloat(calculateASCVD(baseASCVD)!);
    const tx = parseFloat(calculateASCVD({ ...baseASCVD, bpTreatment: true })!);
    expect(tx).toBeGreaterThan(noTx);
  });

  it("risk increases with age", () => {
    const young = parseFloat(calculateASCVD({ ...baseASCVD, age: "45" })!);
    const old = parseFloat(calculateASCVD({ ...baseASCVD, age: "70" })!);
    expect(old).toBeGreaterThan(young);
  });

  it("matches AHA reference range for 55yo white male baseline", () => {
    const result = parseFloat(calculateASCVD(baseASCVD)!);
    expect(result).toBeGreaterThan(3);
    expect(result).toBeLessThan(10);
  });

  it("returns high risk for high-burden patient", () => {
    const result = calculateASCVD({
      age: "65",
      sex: "female",
      race: "aa",
      totalCholesterol: "250",
      hdlCholesterol: "40",
      systolicBP: "160",
      bpTreatment: true,
      diabetes: true,
      smoker: true,
    });
    expect(result).not.toBeNull();
    expect(parseFloat(result!)).toBeGreaterThan(20);
  });
});

describe("getASCVDCategory", () => {
  it("returns Low for risk < 5%", () => {
    expect(getASCVDCategory("4.9")).toBe("Low");
  });

  it("returns Borderline for risk 5-7.4%", () => {
    expect(getASCVDCategory("5.0")).toBe("Borderline");
    expect(getASCVDCategory("7.4")).toBe("Borderline");
  });

  it("returns Intermediate for risk 7.5-19.9%", () => {
    expect(getASCVDCategory("7.5")).toBe("Intermediate");
    expect(getASCVDCategory("19.9")).toBe("Intermediate");
  });

  it("returns High for risk >= 20%", () => {
    expect(getASCVDCategory("20.0")).toBe("High");
    expect(getASCVDCategory("35.0")).toBe("High");
  });

  it("returns Unknown for null", () => {
    expect(getASCVDCategory(null)).toBe("Unknown");
  });
});

describe("getASCVDSeverity", () => {
  it("maps risk to correct severity keys", () => {
    expect(getASCVDSeverity("3.0")).toBe("low");
    expect(getASCVDSeverity("6.0")).toBe("borderline");
    expect(getASCVDSeverity("15.0")).toBe("intermediate");
    expect(getASCVDSeverity("25.0")).toBe("high");
    expect(getASCVDSeverity(null)).toBe("default");
  });
});

// ── HEART Score ────────────────────────────────────────

describe("calculateHEARTScore", () => {
  it("returns 0 for all zeros", () => {
    expect(calculateHEARTScore(baseHEART)).toBe(0);
  });

  it("returns 10 for all twos", () => {
    expect(
      calculateHEARTScore({ history: 2, ecg: 2, age: 2, riskFactors: 2, troponin: 2 })
    ).toBe(10);
  });

  it("returns 5 for all ones", () => {
    expect(
      calculateHEARTScore({ history: 1, ecg: 1, age: 1, riskFactors: 1, troponin: 1 })
    ).toBe(5);
  });

  it("correctly sums mixed values", () => {
    expect(
      calculateHEARTScore({ history: 2, ecg: 0, age: 1, riskFactors: 2, troponin: 1 })
    ).toBe(6);
  });
});

describe("getHEARTCategory", () => {
  it("returns Low for score 0-3", () => {
    expect(getHEARTCategory(0)).toBe("Low");
    expect(getHEARTCategory(3)).toBe("Low");
  });

  it("returns Moderate for score 4-6", () => {
    expect(getHEARTCategory(4)).toBe("Moderate");
    expect(getHEARTCategory(6)).toBe("Moderate");
  });

  it("returns High for score 7-10", () => {
    expect(getHEARTCategory(7)).toBe("High");
    expect(getHEARTCategory(10)).toBe("High");
  });
});

describe("getHEARTAction", () => {
  it("returns discharge recommendation for low score", () => {
    expect(getHEARTAction(2)).toContain("Discharge");
  });

  it("returns observation recommendation for moderate score", () => {
    expect(getHEARTAction(5)).toContain("Observation");
  });

  it("returns urgent recommendation for high score", () => {
    expect(getHEARTAction(8)).toContain("Urgent");
  });
});

describe("getHEARTSeverity", () => {
  it("maps scores to correct severity keys", () => {
    expect(getHEARTSeverity(2)).toBe("low");
    expect(getHEARTSeverity(5)).toBe("moderate");
    expect(getHEARTSeverity(8)).toBe("high");
  });
});

// ── CHA₂DS₂-VASc ──────────────────────────────────────

describe("calculateCHADSVASc", () => {
  it("returns 0 for all false", () => {
    expect(calculateCHADSVASc(baseCHADS)).toBe(0);
  });

  it("adds 1 for CHF", () => {
    expect(calculateCHADSVASc({ ...baseCHADS, chf: true })).toBe(1);
  });

  it("adds 1 for hypertension", () => {
    expect(calculateCHADSVASc({ ...baseCHADS, hypertension: true })).toBe(1);
  });

  it("adds 2 for age >= 75", () => {
    expect(calculateCHADSVASc({ ...baseCHADS, age75: true })).toBe(2);
  });

  it("adds 1 for diabetes", () => {
    expect(calculateCHADSVASc({ ...baseCHADS, diabetes: true })).toBe(1);
  });

  it("adds 2 for stroke/TIA/TE", () => {
    expect(calculateCHADSVASc({ ...baseCHADS, stroke: true })).toBe(2);
  });

  it("adds 1 for vascular disease", () => {
    expect(calculateCHADSVASc({ ...baseCHADS, vascularDisease: true })).toBe(1);
  });

  it("adds 1 for age 65-74", () => {
    expect(calculateCHADSVASc({ ...baseCHADS, age65: true })).toBe(1);
  });

  it("adds 1 for female sex", () => {
    expect(calculateCHADSVASc({ ...baseCHADS, sexFemale: true })).toBe(1);
  });

  it("age75 takes priority over age65 (mutual exclusivity)", () => {
    expect(calculateCHADSVASc({ ...baseCHADS, age75: true, age65: true })).toBe(2);
  });

  it("calculates maximum score of 9", () => {
    expect(
      calculateCHADSVASc({
        chf: true,
        hypertension: true,
        age75: true,
        diabetes: true,
        stroke: true,
        vascularDisease: true,
        age65: false,
        sexFemale: true,
      })
    ).toBe(9);
  });
});

describe("getCHADSVAScCategory", () => {
  it("returns Low for male score 0", () => {
    expect(getCHADSVAScCategory(0, false)).toBe("Low");
  });

  it("returns Low-Moderate for male score 1", () => {
    expect(getCHADSVAScCategory(1, false)).toBe("Low-Moderate");
  });

  it("returns Moderate-High for male score >= 2", () => {
    expect(getCHADSVAScCategory(2, false)).toBe("Moderate-High");
    expect(getCHADSVAScCategory(5, false)).toBe("Moderate-High");
  });

  it("returns Low for female score 0 or 1", () => {
    expect(getCHADSVAScCategory(0, true)).toBe("Low");
    expect(getCHADSVAScCategory(1, true)).toBe("Low");
  });

  it("returns Low-Moderate for female score 2", () => {
    expect(getCHADSVAScCategory(2, true)).toBe("Low-Moderate");
  });

  it("returns Moderate-High for female score >= 3", () => {
    expect(getCHADSVAScCategory(3, true)).toBe("Moderate-High");
  });
});

describe("getCHADSVAScAction", () => {
  it("returns no anticoagulation for male score 0", () => {
    expect(getCHADSVAScAction(0, false)).toContain("No anticoagulation");
  });

  it("returns consider for male score 1", () => {
    expect(getCHADSVAScAction(1, false)).toContain("Consider");
  });

  it("returns recommended for male score >= 2", () => {
    expect(getCHADSVAScAction(2, false)).toContain("recommended");
  });

  it("returns no anticoagulation for female score <= 1", () => {
    expect(getCHADSVAScAction(1, true)).toContain("No anticoagulation");
  });

  it("returns consider for female score 2", () => {
    expect(getCHADSVAScAction(2, true)).toContain("Consider");
  });

  it("returns recommended for female score >= 3", () => {
    expect(getCHADSVAScAction(3, true)).toContain("recommended");
  });
});

describe("getCHADSVAScSeverity", () => {
  it("maps male scores to correct severity keys", () => {
    expect(getCHADSVAScSeverity(0, false)).toBe("low");
    expect(getCHADSVAScSeverity(1, false)).toBe("moderate");
    expect(getCHADSVAScSeverity(2, false)).toBe("high");
  });

  it("maps female scores with shifted thresholds", () => {
    expect(getCHADSVAScSeverity(1, true)).toBe("low");
    expect(getCHADSVAScSeverity(2, true)).toBe("moderate");
    expect(getCHADSVAScSeverity(3, true)).toBe("high");
  });
});

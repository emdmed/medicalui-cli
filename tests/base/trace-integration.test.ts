import { describe, it, expect } from "vitest";
import { Trace } from "../../components/base/trace";
import {
  KDIGO_2021_LIPID, KDIGO_2021_BP, KDIGO_2012_ANEMIA,
  KDIGO_CKD_MBD_2017, CKD_EPI_2021, KDIGO_2024_CKD,
  ADA_2026_TABLE_2_1, ADA_2026_SECTION_2, ADA_2026_FIG_4_3,
  SEPSIS_3_2016, ADA_DKA_2024, IADPSG_2010, CARPENTER_COUSTAN,
} from "../../components/base/sources";

// Nephrology lib
import {
  classifyLDL, classifyHbA1c, classifyBPInCKD, classifyTriglycerides,
  classifyCalcium, classifyPhosphorus, classifyPTH, classifyVitaminD,
  calculateCaPhProduct, classifyCaPhProduct,
  classifyHemoglobin, classifyFerritin, classifyTSAT, classifyAnemiaBySex,
} from "../../components/nephrology/lib";

// CKD lib
import { calculateEGFR, classifyGFRCategory, classifyAlbuminuriaCategory } from "../../components/ckd/lib";

// Diabetes-Dx lib
import { classifyA1C, classifyFPG, classify2hPG, getDiagnosis } from "../../components/diabetes-dx/lib";

// Endocrine lib
import { classifyT1DStage, classifyT1vsT2, getT2DScreeningRecommendation, classifyGDM_OneStep, classifyGDM_TwoStep } from "../../components/endocrine/lib";

// Hepatology lib
import { calculateFIB4, getMASLDRiskStratification } from "../../components/hepatology/lib";

// Sepsis lib
import { calculateTotalSOFA, calculateQSOFA } from "../../components/sepsis/lib";

// DKA lib
import { classifyPotassium, classifyGCS } from "../../components/dka/lib";

describe("Trace integration — Nephrology cardio-metabolic", () => {
  it("traces classifyLDL and classifyBPInCKD", () => {
    const t = new Trace();
    const ldl = t.record("classifyLDL", { ldl: "190" }, classifyLDL("190"), KDIGO_2021_LIPID);
    const bp = t.record("classifyBPInCKD", { sbp: "150", dbp: "95" }, classifyBPInCKD("150", "95"), KDIGO_2021_BP);

    expect(t.entries).toHaveLength(2);
    expect(t.entries[0]).toMatchObject({ fn: "classifyLDL", source: KDIGO_2021_LIPID });
    expect(ldl.severity).toBeDefined();
    expect(bp.severity).toBeDefined();
  });
});

describe("Trace integration — Nephrology phospho-calcic", () => {
  it("traces calcium/phosphorus classify and Ca×P product", () => {
    const t = new Trace();
    t.record("classifyCalcium", { calcium: "10.5" }, classifyCalcium("10.5"), KDIGO_CKD_MBD_2017);
    t.record("classifyPhosphorus", { phosphorus: "5.0" }, classifyPhosphorus("5.0"), KDIGO_CKD_MBD_2017);
    const product = calculateCaPhProduct("10.5", "5.0");
    t.record("calculateCaPhProduct", { calcium: "10.5", phosphorus: "5.0" }, product, KDIGO_CKD_MBD_2017);
    if (product !== null) t.record("classifyCaPhProduct", { product }, classifyCaPhProduct(product), KDIGO_CKD_MBD_2017);

    expect(t.entries).toHaveLength(4);
    expect(t.entries[2].fn).toBe("calculateCaPhProduct");
    expect(t.entries[3].fn).toBe("classifyCaPhProduct");
    expect(t.entries.every(e => e.source === KDIGO_CKD_MBD_2017)).toBe(true);
  });
});

describe("Trace integration — Nephrology anemia", () => {
  it("traces hemoglobin and anemia by sex", () => {
    const t = new Trace();
    t.record("classifyHemoglobin", { hemoglobin: "9.5" }, classifyHemoglobin("9.5"), KDIGO_2012_ANEMIA);
    t.record("classifyFerritin", { ferritin: "80" }, classifyFerritin("80"), KDIGO_2012_ANEMIA);
    t.record("classifyTSAT", { tsat: "15" }, classifyTSAT("15"), KDIGO_2012_ANEMIA);
    t.record("classifyAnemiaBySex", { hemoglobin: "9.5", sex: "male" }, classifyAnemiaBySex("9.5", "male"), KDIGO_2012_ANEMIA);

    expect(t.entries).toHaveLength(4);
    expect(t.entries[3].fn).toBe("classifyAnemiaBySex");
    expect(t.entries[3].inputs).toEqual({ hemoglobin: "9.5", sex: "male" });
  });
});

describe("Trace integration — CKD evaluator", () => {
  it("traces eGFR calculation and category classification", () => {
    const t = new Trace();
    const egfr = t.record("calculateEGFR", { creatinine: "1.5", age: "65", sex: "male" }, calculateEGFR("1.5", "65", "male"), CKD_EPI_2021);
    const gfr = t.record("classifyGFRCategory", { egfr: String(egfr) }, classifyGFRCategory(String(egfr)), KDIGO_2024_CKD);
    const alb = t.record("classifyAlbuminuriaCategory", { acr: "45" }, classifyAlbuminuriaCategory("45"), KDIGO_2024_CKD);

    expect(t.entries).toHaveLength(3);
    expect(t.entries[0].source).toBe(CKD_EPI_2021);
    expect(t.entries[1].source).toBe(KDIGO_2024_CKD);
    expect(typeof egfr).toBe("number");
    expect(typeof gfr).toBe("string");
    expect(typeof alb).toBe("string");
  });
});

describe("Trace integration — Diabetes-Dx", () => {
  it("traces A1C, FPG, 2h-PG classify and getDiagnosis", () => {
    const t = new Trace();
    t.record("classifyA1C", { a1c: "7.0" }, classifyA1C("7.0"), ADA_2026_TABLE_2_1);
    t.record("classifyFPG", { fpg: "130" }, classifyFPG("130"), ADA_2026_TABLE_2_1);
    t.record("classify2hPG", { twohPG: "210" }, classify2hPG("210"), ADA_2026_TABLE_2_1);
    t.record("getDiagnosis", { a1c: "7.0", fpg: "130", twohPG: "210", randomPG: "", hasSymptoms: false }, getDiagnosis("7.0", "130", "210", "", false), ADA_2026_TABLE_2_1);

    expect(t.entries).toHaveLength(4);
    expect(t.entries[3].fn).toBe("getDiagnosis");
    const dx = t.entries[3].output as { category: string };
    expect(dx.category).toBe("diabetes");
  });
});

describe("Trace integration — Endocrine", () => {
  it("traces T1D staging", () => {
    const t = new Trace();
    const result = t.record("classifyT1DStage", { autoantibodyCount: "2", fpg: "95", twohPG: "140", a1c: "5.7", hasSymptoms: false }, classifyT1DStage("2", "95", "140", "5.7", false), ADA_2026_SECTION_2);

    expect(t.entries).toHaveLength(1);
    expect(result.stage).toBeDefined();
  });

  it("traces T1 vs T2 classification", () => {
    const t = new Trace();
    const result = t.record("classifyT1vsT2", { age: "12", bmi: "18", hasAutoantibodies: true, cPeptide: "100" }, classifyT1vsT2("12", "18", true, "100", false, false, true, false, true), ADA_2026_SECTION_2);

    expect(t.entries).toHaveLength(1);
    expect(result.classification).toBeDefined();
  });

  it("traces T2D screening recommendation", () => {
    const t = new Trace();
    const riskFactors = {
      firstDegreeRelative: true, highRiskEthnicity: false, cvdHistory: false,
      hypertension: true, dyslipidemia: false, pcos: false,
      physicalInactivity: false, insulinResistanceSigns: false,
      priorPrediabetes: false, priorGDM: false,
    };
    const result = t.record("getT2DScreeningRecommendation", { age: "50", bmi: "30" }, getT2DScreeningRecommendation("50", "30", "", riskFactors), ADA_2026_SECTION_2);

    expect(t.entries).toHaveLength(1);
    expect(result.action).toBeDefined();
  });

  it("traces GDM one-step classification", () => {
    const t = new Trace();
    const result = t.record("classifyGDM_OneStep", { fasting: "95", oneHour: "190", twoHour: "160" }, classifyGDM_OneStep("95", "190", "160"), IADPSG_2010);

    expect(t.entries).toHaveLength(1);
    expect(result.positive).toBe(true);
    expect(t.entries[0].source).toBe(IADPSG_2010);
  });

  it("traces GDM two-step classification", () => {
    const t = new Trace();
    const result = t.record("classifyGDM_TwoStep", { fasting: "100", oneHour: "190", twoHour: "160", threeHour: "145" }, classifyGDM_TwoStep("100", "190", "160", "145"), CARPENTER_COUSTAN);

    expect(t.entries).toHaveLength(1);
    expect(t.entries[0].source).toBe(CARPENTER_COUSTAN);
    expect(typeof result.positive).toBe("boolean");
  });
});

describe("Trace integration — Hepatology MASLD", () => {
  it("traces FIB-4 calculation and risk stratification", () => {
    const t = new Trace();
    const fib4 = t.record("calculateFIB4", { age: "55", ast: "45", alt: "35", platelets: "150" }, calculateFIB4("55", "45", "35", "150"), ADA_2026_FIG_4_3);
    t.record("getMASLDRiskStratification", { fib4Score: fib4.score, fib4Tier: fib4.tier, age: "55" }, getMASLDRiskStratification(fib4.score, fib4.tier, "55"), ADA_2026_FIG_4_3);

    expect(t.entries).toHaveLength(2);
    expect(t.entries[0].fn).toBe("calculateFIB4");
    expect(t.entries[1].fn).toBe("getMASLDRiskStratification");
  });
});

describe("Trace integration — Sepsis", () => {
  it("traces SOFA and qSOFA calculations", () => {
    const t = new Trace();
    const reading = {
      paO2: "80", fiO2: "40", onVentilation: false,
      platelets: "150", bilirubin: "1.0",
      map: "65", dopamine: "0", dobutamine: "0", epinephrine: "0", norepinephrine: "0",
      gcs: "14", creatinine: "1.0", urineOutput: "500",
      respiratoryRate: "22", sbp: "95",
      lactate: "2.5", suspectedInfection: true, infectionSource: "pneumonia",
    };
    t.record("calculateTotalSOFA", { weight: "70" }, calculateTotalSOFA(reading as any, "70", "1"), SEPSIS_3_2016);
    t.record("calculateQSOFA", { respiratoryRate: "22", sbp: "95", gcs: "14" }, calculateQSOFA("22", "95", "14"), SEPSIS_3_2016);

    expect(t.entries).toHaveLength(2);
    expect(t.entries[0].source).toBe(SEPSIS_3_2016);
    expect(typeof t.entries[0].output).toBe("number");
    expect(typeof t.entries[1].output).toBe("number");
  });
});

describe("Trace integration — DKA", () => {
  it("traces potassium and GCS classification", () => {
    const t = new Trace();
    const kResult = t.record("classifyPotassium", { potassium: "3.0" }, classifyPotassium("3.0"), ADA_DKA_2024);
    const gcsResult = t.record("classifyGCS", { gcs: "12" }, classifyGCS("12"), ADA_DKA_2024);

    expect(t.entries).toHaveLength(2);
    expect(t.entries[0].source).toBe(ADA_DKA_2024);
    expect(typeof kResult).toBe("string");
    expect(typeof gcsResult).toBe("string");
  });
});

import { safeFloat } from "./utils/safeFloat";
import { ExpectedValues } from "./types/interfaces";

export const analyze = ({ values, isChronic }) => {
  const pH = safeFloat(values.pH);
  const pCO2 = safeFloat(values.pCO2);
  const HCO3 = safeFloat(values.HCO3);
  const Na = safeFloat(values.Na);
  const Cl = safeFloat(values.Cl);
  const Alb = safeFloat(values.Albumin);

  if (pH === null || pCO2 === null || HCO3 === null) {
    return null;
  }

  const expectedValues: ExpectedValues = {};
  let primaryDisorder = "Normal";
  let compensatoryResponse = "";
  let additionalDisorders: string[] = [];
  let compensation = "N/A";
  const allDisorders: string[] = [];

  // Normal ranges
  const pH_LOW = 7.35;
  const pH_HIGH = 7.45;
  const pCO2_LOW = 36;
  const pCO2_HIGH = 44;
  const HCO3_LOW = 22;
  const HCO3_HIGH = 28;

  // Determine primary disorder based on pH and which parameter moved first/most
  const isAcidemic = pH < pH_LOW;
  const isAlkalemic = pH > pH_HIGH;
  const isNormalPH = pH >= pH_LOW && pH <= pH_HIGH;

  // Calculate how far each parameter has moved from normal
  const pCO2_midpoint = (pCO2_LOW + pCO2_HIGH) / 2; // 40
  const HCO3_midpoint = (HCO3_LOW + HCO3_HIGH) / 2; // 25
  
  // Primary disorder determination
  if (isAcidemic) {
    // pH < 7.35 - Acidemia present
    if (HCO3 < HCO3_LOW && pCO2 > pCO2_HIGH) {
      // Both indicate acidosis - determine primary
      const metabolicContribution = (HCO3_midpoint - HCO3) / HCO3_midpoint;
      const respiratoryContribution = (pCO2 - pCO2_midpoint) / pCO2_midpoint;
      if (metabolicContribution > respiratoryContribution) {
        primaryDisorder = "Metabolic Acidosis";
      } else {
        primaryDisorder = "Respiratory Acidosis";
      }
    } else if (HCO3 < HCO3_LOW) {
      primaryDisorder = "Metabolic Acidosis";
    } else if (pCO2 > pCO2_HIGH) {
      primaryDisorder = "Respiratory Acidosis";
    } else {
      primaryDisorder = "Mixed Disorder";
    }
  } else if (isAlkalemic) {
    // pH > 7.45 - Alkalemia present
    if (HCO3 > HCO3_HIGH && pCO2 < pCO2_LOW) {
      // Both indicate alkalosis - determine primary
      const metabolicContribution = (HCO3 - HCO3_midpoint) / HCO3_midpoint;
      const respiratoryContribution = (pCO2_midpoint - pCO2) / pCO2_midpoint;
      if (metabolicContribution > respiratoryContribution) {
        primaryDisorder = "Metabolic Alkalosis";
      } else {
        primaryDisorder = "Respiratory Alkalosis";
      }
    } else if (HCO3 > HCO3_HIGH) {
      primaryDisorder = "Metabolic Alkalosis";
    } else if (pCO2 < pCO2_LOW) {
      primaryDisorder = "Respiratory Alkalosis";
    } else {
      primaryDisorder = "Mixed Disorder";
    }
  } else {
    // Normal pH - check for compensated or mixed disorders
    if (pCO2 < pCO2_LOW && HCO3 < HCO3_LOW) {
      // Both low - determine primary based on compensation formulas
      // Check if HCO3 matches expected for respiratory alkalosis
      const expectedHCO3_acute = 24 - 0.2 * (40 - pCO2);
      const expectedHCO3_chronic = 24 - 0.5 * (40 - pCO2);
      
      if (Math.abs(HCO3 - expectedHCO3_chronic) < 2 || Math.abs(HCO3 - expectedHCO3_acute) < 2) {
        primaryDisorder = "Respiratory Alkalosis";
      } else {
        // Check if pCO2 matches expected for metabolic acidosis
        const expectedPCO2 = 1.5 * HCO3 + 8;
        if (Math.abs(pCO2 - expectedPCO2) < 2) {
          primaryDisorder = "Metabolic Acidosis";
        } else {
          primaryDisorder = "Mixed Disorder";
        }
      }
    } else if (pCO2 > pCO2_HIGH && HCO3 > HCO3_HIGH) {
      // Both high - determine primary based on compensation formulas
      // Check if HCO3 matches expected for respiratory acidosis
      const expectedHCO3_acute = 24 + 0.1 * (pCO2 - 40);
      const expectedHCO3_chronic = 24 + 0.35 * (pCO2 - 40);
      
      if (Math.abs(HCO3 - expectedHCO3_chronic) < 3 || Math.abs(HCO3 - expectedHCO3_acute) < 3) {
        primaryDisorder = "Respiratory Acidosis";
      } else {
        // Check if pCO2 matches expected for metabolic alkalosis
        const expectedPCO2 = 0.7 * (HCO3 - 24) + 40;
        if (Math.abs(pCO2 - expectedPCO2) < 2) {
          primaryDisorder = "Metabolic Alkalosis";
        } else {
          primaryDisorder = "Mixed Disorder";
        }
      }
    } else if (pCO2 > pCO2_HIGH) {
      primaryDisorder = "Respiratory Acidosis";
    } else if (pCO2 < pCO2_LOW) {
      primaryDisorder = "Respiratory Alkalosis";
    } else if (HCO3 > HCO3_HIGH) {
      primaryDisorder = "Metabolic Alkalosis";
    } else if (HCO3 < HCO3_LOW) {
      primaryDisorder = "Metabolic Acidosis";
    }
  }

  // Now calculate expected compensation based on primary disorder
  if (primaryDisorder === "Metabolic Acidosis") {
    // Winter's formula: Expected pCO2 = 1.5 × [HCO3-] + 8 ± 2
    const expectedPCO2 = 1.5 * HCO3 + 8;
    expectedValues.low = (expectedPCO2 - 2).toFixed(1);
    expectedValues.high = (expectedPCO2 + 2).toFixed(1);
    
    compensatoryResponse = "Respiratory Alkalosis";
    
    if (pCO2 < expectedPCO2 - 2) {
      compensation = "Overcompensated";
      additionalDisorders.push("Respiratory Alkalosis");
    } else if (pCO2 > expectedPCO2 + 2) {
      if (pCO2 > pCO2_HIGH) {
        compensation = "Inadequate compensation";
        additionalDisorders.push("Respiratory Acidosis");
      } else {
        compensation = "Inadequate compensation";
      }
    } else {
      compensation = "Compensated";
    }
  } else if (primaryDisorder === "Metabolic Alkalosis") {
    // Expected pCO2 = 0.7 × ΔHCO3 + 40 ± 2
    const expectedPCO2 = 0.7 * (HCO3 - 24) + 40;
    expectedValues.low = (expectedPCO2 - 2).toFixed(1);
    expectedValues.high = (expectedPCO2 + 2).toFixed(1);
    
    compensatoryResponse = "Respiratory Acidosis";
    
    if (pCO2 > expectedPCO2 + 2) {
      compensation = "Overcompensated";
      additionalDisorders.push("Respiratory Acidosis");
    } else if (pCO2 < expectedPCO2 - 2) {
      if (pCO2 < pCO2_LOW) {
        compensation = "Inadequate compensation";
        additionalDisorders.push("Respiratory Alkalosis");
      } else {
        compensation = "Inadequate compensation";
      }
    } else {
      compensation = "Compensated";
    }
  } else if (primaryDisorder === "Respiratory Acidosis") {
    if (isChronic) {
      // Chronic: ΔHCO3 = 0.35 × ΔpCO2
      const expectedHCO3 = 24 + 0.35 * (pCO2 - 40);
      expectedValues.low = (expectedHCO3 - 3).toFixed(1);
      expectedValues.high = (expectedHCO3 + 3).toFixed(1);
      
      compensatoryResponse = "Metabolic Alkalosis";
      
      if (HCO3 > expectedHCO3 + 3) {
        compensation = "Overcompensated";
        additionalDisorders.push("+ Metabolic Alkalosis");
      } else if (HCO3 < expectedHCO3 - 3) {
        if (HCO3 < HCO3_LOW) {
          compensation = "Inadequate compensation";
          additionalDisorders.push("+ Metabolic Acidosis");
        } else {
          compensation = "Inadequate compensation";
        }
      } else {
        compensation = "Compensated";
      }
    } else {
      // Acute: ΔHCO3 = 0.1 × ΔpCO2
      const expectedHCO3 = 24 + 0.1 * (pCO2 - 40);
      expectedValues.low = (expectedHCO3 - 3).toFixed(1);
      expectedValues.high = (expectedHCO3 + 3).toFixed(1);
      
      compensatoryResponse = "Metabolic Alkalosis";
      
      if (HCO3 > expectedHCO3 + 3) {
        compensation = "Overcompensated";
        additionalDisorders.push("+ Metabolic Alkalosis");
      } else if (HCO3 < expectedHCO3 - 3) {
        if (HCO3 < HCO3_LOW) {
          compensation = "Inadequate compensation";
          additionalDisorders.push("+ Metabolic Acidosis");
        } else {
          compensation = "Inadequate compensation";
        }
      } else {
        compensation = "Compensated";
      }
    }
  } else if (primaryDisorder === "Respiratory Alkalosis") {
    if (isChronic) {
      // Chronic: ΔHCO3 = 0.5 × ΔpCO2
      const expectedHCO3 = 24 - 0.5 * (40 - pCO2);
      expectedValues.low = (expectedHCO3 - 2).toFixed(1);
      expectedValues.high = (expectedHCO3 + 2).toFixed(1);
      
      compensatoryResponse = "Metabolic Acidosis";
      
      if (HCO3 < expectedHCO3 - 2) {
        compensation = "Overcompensated";
        additionalDisorders.push("+ Metabolic Acidosis");
      } else if (HCO3 > expectedHCO3 + 2) {
        if (HCO3 > HCO3_HIGH) {
          compensation = "Inadequate compensation";
          additionalDisorders.push("+ Metabolic Alkalosis");
        } else {
          compensation = "Inadequate compensation";
        }
      } else {
        compensation = "Compensated";
      }
    } else {
      // Acute: ΔHCO3 = 0.2 × ΔpCO2
      const expectedHCO3 = 24 - 0.2 * (40 - pCO2);
      expectedValues.low = (expectedHCO3 - 2).toFixed(1);
      expectedValues.high = (expectedHCO3 + 2).toFixed(1);
      
      compensatoryResponse = "Metabolic Acidosis";
      
      if (HCO3 < expectedHCO3 - 2) {
        compensation = "Overcompensated";
        additionalDisorders.push("Metabolic Acidosis");
      } else if (HCO3 > expectedHCO3 + 2) {
        if (HCO3 > HCO3_HIGH) {
          compensation = "Inadequate compensation";
          additionalDisorders.push("Metabolic Alkalosis");
        } else {
          compensation = "Inadequate compensation";
        }
      } else {
        compensation = "Compensated";
      }
    }
  }

  // Special handling for normal pH with compensated disorders
  if (isNormalPH && compensation === "Compensated") {
    compensation = "Compensated";
  }

  // Build allDisorders array
  if (primaryDisorder !== "Normal") {
    allDisorders.push(primaryDisorder);
  }
  if (compensatoryResponse) {
    allDisorders.push(compensatoryResponse);
  }
  allDisorders.push(...additionalDisorders);

  // ---- Anion gap calculation ----
  let anionGap: number | null = null;
  let agStatus: string | null = null;
  let correctedAG: number | null = null;
  let uncorrectedAG: number | null = null;
  
  if (Na !== null && Cl !== null && HCO3 !== null) {
    // Calculate basic anion gap
    uncorrectedAG = Na - (Cl + HCO3);
    anionGap = uncorrectedAG;
    
    // Albumin correction for anion gap (if albumin is provided)
    if (Alb !== null && Alb > 0) {
      // Corrected AG = Uncorrected AG + 2.5 × (4.0 - measured albumin)
      correctedAG = uncorrectedAG + 2.5 * (4.0 - Alb);
      // Use corrected AG for status determination
      agStatus = correctedAG > 12 ? "High" : correctedAG < 8 ? "Low" : "Normal";
      // Set anionGap to corrected value for display
      anionGap = correctedAG;
    } else {
      // No albumin correction - use uncorrected AG
      agStatus = uncorrectedAG > 12 ? "High" : uncorrectedAG < 8 ? "Low" : "Normal";
    }
  }

  // ---- Delta ratio (if high anion gap metabolic acidosis) ----
  let deltaRatio: number | null = null;
  let deltaRatioInterpretation: string | null = null;
  
  if (primaryDisorder === "Metabolic Acidosis" && agStatus === "High" && anionGap !== null) {
    const deltaAG = anionGap - 12;
    const deltaHCO3 = 24 - HCO3;
    
    if (deltaHCO3 > 0) {
      deltaRatio = deltaAG / deltaHCO3;
      
      if (deltaRatio < 1) {
        deltaRatioInterpretation = "Normal AG metabolic acidosis also present";
        additionalDisorders.push("Non-AG Metabolic Acidosis");
      } else if (deltaRatio >= 1 && deltaRatio < 2) {
        deltaRatioInterpretation = "Pure high AG metabolic acidosis";
      } else {
        deltaRatioInterpretation = "Metabolic alkalosis also present";
        additionalDisorders.push("Metabolic Alkalosis");
      }
    }
  }

  // Build comprehensive interpretation
  let interpretation = "";
  if (primaryDisorder !== "Normal" && primaryDisorder !== "Mixed Disorder") {
    // Check for high anion gap if metabolic acidosis
    if (primaryDisorder === "Metabolic Acidosis" && agStatus === "High") {
      interpretation = `Anion Gap Metabolic Acidosis. Primary ${primaryDisorder}`;
    } else {
      interpretation = `Primary ${primaryDisorder}`;
    }
    
    if (compensatoryResponse && compensation !== "N/A") {
      interpretation += `, with ${compensation} by ${compensatoryResponse}`;
    }
    
    if (additionalDisorders.length > 0) {
      interpretation += ` and ${additionalDisorders.join(" and ")}`;
    }
    
    interpretation += ".";
  } else if (primaryDisorder === "Mixed Disorder") {
    interpretation = "Complex Mixed Acid-Base Disorder.";
  } else {
    interpretation = "Normal acid-base status.";
  }

  const result = {
    disorder: primaryDisorder,
    compensatoryResponse,
    additionalDisorders,
    mixedDisorders: [...additionalDisorders], // for backward compatibility
    compensation,
    interpretation,
    expectedValues,
    anionGap: anionGap !== null ? anionGap.toFixed(1) : null,
    uncorrectedAG: uncorrectedAG !== null ? uncorrectedAG.toFixed(1) : null,
    correctedAG: correctedAG !== null ? correctedAG.toFixed(1) : null,
    agStatus,
    deltaRatio: deltaRatio !== null ? deltaRatio.toFixed(2) : null,
    deltaRatioInterpretation,
    allDisorders,
    debug: {
      Na,
      Cl,
      HCO3,
      Alb,
      calculatedAG: anionGap
    }
  };

  return result;
};
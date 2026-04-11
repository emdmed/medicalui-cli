import { describe, it, expect } from 'vitest';
import {
  calculateRespirationSOFA,
  calculateCoagulationSOFA,
  calculateLiverSOFA,
  calculateCardiovascularSOFA,
  calculateCNSSOFA,
  calculateRenalSOFA,
  calculateTotalSOFA,
  calculateSOFADelta,
  calculateQSOFA,
  isQSOFAPositive,
  assessSepsis,
  assessSepticShock,
  assessBundleCompliance,
  calculateLactateClearance,
  isLactateClearanceAdequate,
  getSOFASeverityLevel,
  getSOFASeverity,
  hasVasopressors,
} from '../../components/sepsis/lib';

// ─── Respiration SOFA ───────────────────────────────────────────────

describe('calculateRespirationSOFA', () => {
  it('returns 0 for PaO2/FiO2 >= 400', () => {
    expect(calculateRespirationSOFA('100', '21', false)).toBe(0);
  });

  it('returns 1 for PaO2/FiO2 300-399', () => {
    expect(calculateRespirationSOFA('80', '21', false)).toBe(1);
  });

  it('returns 2 for PaO2/FiO2 200-299', () => {
    expect(calculateRespirationSOFA('60', '21', false)).toBe(2);
  });

  it('returns 2 (not 3) for PaO2/FiO2 <200 without ventilation', () => {
    expect(calculateRespirationSOFA('40', '21', false)).toBe(2);
  });

  it('returns 3 for PaO2/FiO2 100-199 with ventilation', () => {
    expect(calculateRespirationSOFA('40', '21', true)).toBe(3);
  });

  it('returns 4 for PaO2/FiO2 <100 with ventilation', () => {
    expect(calculateRespirationSOFA('60', '80', true)).toBe(4);
  });

  it('returns 0 for empty inputs', () => {
    expect(calculateRespirationSOFA('', '', false)).toBe(0);
    expect(calculateRespirationSOFA('80', '', false)).toBe(0);
  });

  it('returns 0 for invalid FiO2 (out of range)', () => {
    expect(calculateRespirationSOFA('80', '15', false)).toBe(0);
    expect(calculateRespirationSOFA('80', '105', false)).toBe(0);
  });

  it('boundary: PaO2/FiO2 exactly 400', () => {
    expect(calculateRespirationSOFA('84', '21', false)).toBe(0);
  });

  it('boundary: PaO2/FiO2 exactly 300', () => {
    expect(calculateRespirationSOFA('63', '21', false)).toBe(1);
  });
});

// ─── Coagulation SOFA ───────────────────────────────────────────────

describe('calculateCoagulationSOFA', () => {
  it('returns 0 for platelets >= 150', () => {
    expect(calculateCoagulationSOFA('150')).toBe(0);
    expect(calculateCoagulationSOFA('300')).toBe(0);
  });

  it('returns 1 for platelets 100-149', () => {
    expect(calculateCoagulationSOFA('149')).toBe(1);
    expect(calculateCoagulationSOFA('100')).toBe(1);
  });

  it('returns 2 for platelets 50-99', () => {
    expect(calculateCoagulationSOFA('99')).toBe(2);
    expect(calculateCoagulationSOFA('50')).toBe(2);
  });

  it('returns 3 for platelets 20-49', () => {
    expect(calculateCoagulationSOFA('49')).toBe(3);
    expect(calculateCoagulationSOFA('20')).toBe(3);
  });

  it('returns 4 for platelets < 20', () => {
    expect(calculateCoagulationSOFA('19')).toBe(4);
    expect(calculateCoagulationSOFA('5')).toBe(4);
  });

  it('returns 0 for empty string', () => {
    expect(calculateCoagulationSOFA('')).toBe(0);
  });
});

// ─── Liver SOFA ─────────────────────────────────────────────────────

describe('calculateLiverSOFA', () => {
  it('returns 0 for bilirubin < 1.2', () => {
    expect(calculateLiverSOFA('0.5')).toBe(0);
    expect(calculateLiverSOFA('1.1')).toBe(0);
  });

  it('returns 1 for bilirubin 1.2-1.9', () => {
    expect(calculateLiverSOFA('1.2')).toBe(1);
    expect(calculateLiverSOFA('1.9')).toBe(1);
  });

  it('returns 2 for bilirubin 2.0-5.9', () => {
    expect(calculateLiverSOFA('2.0')).toBe(2);
    expect(calculateLiverSOFA('5.9')).toBe(2);
  });

  it('returns 3 for bilirubin 6.0-11.9', () => {
    expect(calculateLiverSOFA('6.0')).toBe(3);
    expect(calculateLiverSOFA('11.9')).toBe(3);
  });

  it('returns 4 for bilirubin >= 12', () => {
    expect(calculateLiverSOFA('12')).toBe(4);
    expect(calculateLiverSOFA('20')).toBe(4);
  });

  it('returns 0 for empty string', () => {
    expect(calculateLiverSOFA('')).toBe(0);
  });
});

// ─── Cardiovascular SOFA ────────────────────────────────────────────

describe('calculateCardiovascularSOFA', () => {
  it('returns 0 for MAP >= 70, no vasopressors', () => {
    expect(calculateCardiovascularSOFA('75', '', '', '', '')).toBe(0);
    expect(calculateCardiovascularSOFA('70', '0', '0', '0', '0')).toBe(0);
  });

  it('returns 1 for MAP < 70, no vasopressors', () => {
    expect(calculateCardiovascularSOFA('65', '', '', '', '')).toBe(1);
    expect(calculateCardiovascularSOFA('69', '0', '0', '0', '0')).toBe(1);
  });

  it('returns 2 for dopamine <= 5', () => {
    expect(calculateCardiovascularSOFA('65', '5', '', '', '')).toBe(2);
    expect(calculateCardiovascularSOFA('65', '3', '', '', '')).toBe(2);
  });

  it('returns 2 for any dobutamine', () => {
    expect(calculateCardiovascularSOFA('65', '', '5', '', '')).toBe(2);
  });

  it('returns 3 for dopamine > 5', () => {
    expect(calculateCardiovascularSOFA('65', '10', '', '', '')).toBe(3);
  });

  it('returns 3 for epinephrine <= 0.1', () => {
    expect(calculateCardiovascularSOFA('65', '', '', '0.05', '')).toBe(3);
    expect(calculateCardiovascularSOFA('65', '', '', '0.1', '')).toBe(3);
  });

  it('returns 3 for norepinephrine <= 0.1', () => {
    expect(calculateCardiovascularSOFA('65', '', '', '', '0.1')).toBe(3);
  });

  it('returns 4 for dopamine > 15', () => {
    expect(calculateCardiovascularSOFA('65', '20', '', '', '')).toBe(4);
  });

  it('returns 4 for epinephrine > 0.1', () => {
    expect(calculateCardiovascularSOFA('65', '', '', '0.2', '')).toBe(4);
  });

  it('returns 4 for norepinephrine > 0.1', () => {
    expect(calculateCardiovascularSOFA('65', '', '', '', '0.2')).toBe(4);
  });

  it('returns 0 for all empty', () => {
    expect(calculateCardiovascularSOFA('', '', '', '', '')).toBe(0);
  });
});

// ─── CNS SOFA ───────────────────────────────────────────────────────

describe('calculateCNSSOFA', () => {
  it('returns 0 for GCS 15', () => {
    expect(calculateCNSSOFA('15')).toBe(0);
  });

  it('returns 1 for GCS 13-14', () => {
    expect(calculateCNSSOFA('14')).toBe(1);
    expect(calculateCNSSOFA('13')).toBe(1);
  });

  it('returns 2 for GCS 10-12', () => {
    expect(calculateCNSSOFA('12')).toBe(2);
    expect(calculateCNSSOFA('10')).toBe(2);
  });

  it('returns 3 for GCS 6-9', () => {
    expect(calculateCNSSOFA('9')).toBe(3);
    expect(calculateCNSSOFA('6')).toBe(3);
  });

  it('returns 4 for GCS < 6', () => {
    expect(calculateCNSSOFA('5')).toBe(4);
    expect(calculateCNSSOFA('3')).toBe(4);
  });

  it('returns 0 for empty string', () => {
    expect(calculateCNSSOFA('')).toBe(0);
  });
});

// ─── Renal SOFA ─────────────────────────────────────────────────────

describe('calculateRenalSOFA', () => {
  it('returns 0 for creatinine < 1.2', () => {
    expect(calculateRenalSOFA('0.8', '', '70', '1')).toBe(0);
    expect(calculateRenalSOFA('1.1', '', '70', '1')).toBe(0);
  });

  it('returns 1 for creatinine 1.2-1.9', () => {
    expect(calculateRenalSOFA('1.2', '', '70', '1')).toBe(1);
    expect(calculateRenalSOFA('1.9', '', '70', '1')).toBe(1);
  });

  it('returns 2 for creatinine 2.0-3.4', () => {
    expect(calculateRenalSOFA('2.0', '', '70', '1')).toBe(2);
    expect(calculateRenalSOFA('3.4', '', '70', '1')).toBe(2);
  });

  it('returns 3 for creatinine 3.5-4.9', () => {
    expect(calculateRenalSOFA('3.5', '', '70', '1')).toBe(3);
    expect(calculateRenalSOFA('4.9', '', '70', '1')).toBe(3);
  });

  it('returns 4 for creatinine >= 5.0', () => {
    expect(calculateRenalSOFA('5.0', '', '70', '1')).toBe(4);
    expect(calculateRenalSOFA('7.0', '', '70', '1')).toBe(4);
  });

  it('returns 0 for empty creatinine', () => {
    expect(calculateRenalSOFA('', '', '70', '1')).toBe(0);
  });

  it('urine output score overrides creatinine when higher', () => {
    expect(calculateRenalSOFA('1.5', '10', '70', '1')).toBe(4);
  });

  it('urine output <0.5 mL/kg/hr → score 3', () => {
    expect(calculateRenalSOFA('0.8', '30', '70', '1')).toBe(3);
  });

  it('urine output >= 0.5 mL/kg/hr → no urine score override', () => {
    expect(calculateRenalSOFA('0.8', '40', '70', '1')).toBe(0);
  });

  it('returns creatinine score when weight is 0 (no UO calc)', () => {
    expect(calculateRenalSOFA('2.5', '10', '0', '1')).toBe(2);
  });
});

// ─── Total SOFA ─────────────────────────────────────────────────────

describe('calculateTotalSOFA', () => {
  it('returns 0 for all-normal values', () => {
    const reading = {
      paO2: '100', fiO2: '21', onVentilation: false,
      platelets: '200', bilirubin: '0.5',
      map: '80', dopamine: '', dobutamine: '', epinephrine: '', norepinephrine: '',
      gcs: '15', creatinine: '0.8', urineOutput: '',
    };
    expect(calculateTotalSOFA(reading, '70', '1')).toBe(0);
  });

  it('returns 24 for worst-case values', () => {
    const reading = {
      paO2: '50', fiO2: '80', onVentilation: true,
      platelets: '10',
      bilirubin: '15',
      map: '50', dopamine: '20', dobutamine: '', epinephrine: '', norepinephrine: '',
      gcs: '3',
      creatinine: '6.0', urineOutput: '5',
    };
    expect(calculateTotalSOFA(reading, '70', '1')).toBe(24);
  });

  it('sums individual organ scores correctly', () => {
    const reading = {
      paO2: '80', fiO2: '21', onVentilation: false,
      platelets: '120',
      bilirubin: '1.5',
      map: '65', dopamine: '', dobutamine: '', epinephrine: '', norepinephrine: '',
      gcs: '14',
      creatinine: '1.5', urineOutput: '',
    };
    expect(calculateTotalSOFA(reading, '70', '1')).toBe(6);
  });
});

// ─── SOFA Delta ─────────────────────────────────────────────────────

describe('calculateSOFADelta', () => {
  it('calculates positive delta', () => {
    expect(calculateSOFADelta(8, '2')).toBe(6);
  });

  it('calculates negative delta', () => {
    expect(calculateSOFADelta(2, '5')).toBe(-3);
  });

  it('calculates zero delta', () => {
    expect(calculateSOFADelta(3, '3')).toBe(0);
  });

  it('handles empty baseline as 0', () => {
    expect(calculateSOFADelta(5, '')).toBe(5);
  });
});

// ─── qSOFA ──────────────────────────────────────────────────────────

describe('calculateQSOFA', () => {
  it('returns 0 when no criteria met', () => {
    expect(calculateQSOFA('16', '120', '15')).toBe(0);
  });

  it('returns 1 for RR >= 22 only', () => {
    expect(calculateQSOFA('24', '120', '15')).toBe(1);
  });

  it('returns 1 for SBP <= 100 only', () => {
    expect(calculateQSOFA('16', '95', '15')).toBe(1);
  });

  it('returns 1 for GCS < 15 only', () => {
    expect(calculateQSOFA('16', '120', '14')).toBe(1);
  });

  it('returns 2 for RR + SBP', () => {
    expect(calculateQSOFA('22', '100', '15')).toBe(2);
  });

  it('returns 2 for RR + GCS', () => {
    expect(calculateQSOFA('22', '120', '13')).toBe(2);
  });

  it('returns 2 for SBP + GCS', () => {
    expect(calculateQSOFA('16', '90', '14')).toBe(2);
  });

  it('returns 3 for all criteria met', () => {
    expect(calculateQSOFA('25', '85', '12')).toBe(3);
  });

  it('boundary: RR exactly 22', () => {
    expect(calculateQSOFA('22', '120', '15')).toBe(1);
  });

  it('boundary: SBP exactly 100', () => {
    expect(calculateQSOFA('16', '100', '15')).toBe(1);
  });

  it('returns 0 for empty inputs', () => {
    expect(calculateQSOFA('', '', '')).toBe(0);
  });
});

describe('isQSOFAPositive', () => {
  it('returns true for score >= 2', () => {
    expect(isQSOFAPositive(2)).toBe(true);
    expect(isQSOFAPositive(3)).toBe(true);
  });

  it('returns false for score < 2', () => {
    expect(isQSOFAPositive(0)).toBe(false);
    expect(isQSOFAPositive(1)).toBe(false);
  });
});

// ─── Sepsis-3 Assessment ────────────────────────────────────────────

describe('assessSepsis', () => {
  it('returns true for infection + SOFA >= 2', () => {
    expect(assessSepsis(2, 0, true)).toBe(true);
    expect(assessSepsis(5, 0, true)).toBe(true);
  });

  it('returns true for infection + delta >= 2', () => {
    expect(assessSepsis(1, 2, true)).toBe(true);
    expect(assessSepsis(0, 3, true)).toBe(true);
  });

  it('returns false without infection', () => {
    expect(assessSepsis(5, 3, false)).toBe(false);
  });

  it('returns false for infection + SOFA < 2 and delta < 2', () => {
    expect(assessSepsis(1, 1, true)).toBe(false);
    expect(assessSepsis(0, 0, true)).toBe(false);
  });
});

// ─── Septic Shock ───────────────────────────────────────────────────

describe('assessSepticShock', () => {
  it('returns true for sepsis + vasopressors + lactate > 2', () => {
    expect(assessSepticShock(true, true, '2.5')).toBe(true);
    expect(assessSepticShock(true, true, '4.0')).toBe(true);
  });

  it('returns false without sepsis', () => {
    expect(assessSepticShock(false, true, '4.0')).toBe(false);
  });

  it('returns false without vasopressors', () => {
    expect(assessSepticShock(true, false, '4.0')).toBe(false);
  });

  it('returns false for lactate <= 2', () => {
    expect(assessSepticShock(true, true, '2.0')).toBe(false);
    expect(assessSepticShock(true, true, '1.5')).toBe(false);
  });

  it('returns false for empty lactate', () => {
    expect(assessSepticShock(true, true, '')).toBe(false);
  });
});

// ─── Bundle Compliance ──────────────────────────────────────────────

describe('assessBundleCompliance', () => {
  const fullBundle = {
    lactateMeasured: true,
    bloodCulturesObtained: true,
    antibioticsGiven: true,
    fluidBolusGiven: true,
    vasopressorsStarted: true,
    bundleStartTime: 1000,
  };

  it('returns complete when all items done within 60 min', () => {
    const result = assessBundleCompliance(fullBundle, 1000 + 3540);
    expect(result.complete).toBe(true);
    expect(result.allItemsDone).toBe(true);
    expect(result.withinTimeLimit).toBe(true);
  });

  it('returns complete at exactly 60 min', () => {
    const result = assessBundleCompliance(fullBundle, 1000 + 3600);
    expect(result.complete).toBe(true);
  });

  it('returns not complete when over 60 min', () => {
    const result = assessBundleCompliance(fullBundle, 1000 + 3601);
    expect(result.complete).toBe(false);
    expect(result.allItemsDone).toBe(true);
    expect(result.withinTimeLimit).toBe(false);
  });

  it('returns not complete when items missing', () => {
    const partial = { ...fullBundle, antibioticsGiven: false };
    const result = assessBundleCompliance(partial, 1000 + 1800);
    expect(result.complete).toBe(false);
    expect(result.allItemsDone).toBe(false);
    expect(result.withinTimeLimit).toBe(true);
  });

  it('returns not complete when no start time', () => {
    const noStart = { ...fullBundle, bundleStartTime: null };
    const result = assessBundleCompliance(noStart, 5000);
    expect(result.complete).toBe(false);
    expect(result.withinTimeLimit).toBe(false);
  });
});

// ─── Lactate Clearance ──────────────────────────────────────────────

describe('calculateLactateClearance', () => {
  it('calculates clearance: (4 - 2) / 4 * 100 = 50.0%', () => {
    expect(calculateLactateClearance('4', '2')).toBe('50.0');
  });

  it('calculates clearance: (5 - 4.5) / 5 * 100 = 10.0%', () => {
    expect(calculateLactateClearance('5', '4.5')).toBe('10.0');
  });

  it('calculates negative clearance (lactate increasing)', () => {
    expect(calculateLactateClearance('2', '4')).toBe('-100.0');
  });

  it('returns null for empty initial', () => {
    expect(calculateLactateClearance('', '2')).toBeNull();
  });

  it('returns null for empty repeat', () => {
    expect(calculateLactateClearance('4', '')).toBeNull();
  });

  it('returns null for zero initial', () => {
    expect(calculateLactateClearance('0', '2')).toBeNull();
  });
});

describe('isLactateClearanceAdequate', () => {
  it('returns true for clearance >= 10%', () => {
    expect(isLactateClearanceAdequate('10.0')).toBe(true);
    expect(isLactateClearanceAdequate('50.0')).toBe(true);
  });

  it('returns false for clearance < 10%', () => {
    expect(isLactateClearanceAdequate('9.9')).toBe(false);
    expect(isLactateClearanceAdequate('0.0')).toBe(false);
  });

  it('returns false for negative clearance', () => {
    expect(isLactateClearanceAdequate('-20.0')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isLactateClearanceAdequate(null)).toBe(false);
  });
});

// ─── Severity Utilities ─────────────────────────────────────────────

describe('getSOFASeverityLevel', () => {
  it('returns Low for 0-5', () => {
    expect(getSOFASeverityLevel(0)).toBe('Low');
    expect(getSOFASeverityLevel(5)).toBe('Low');
  });

  it('returns Moderate for 6-10', () => {
    expect(getSOFASeverityLevel(6)).toBe('Moderate');
    expect(getSOFASeverityLevel(10)).toBe('Moderate');
  });

  it('returns High for 11-15', () => {
    expect(getSOFASeverityLevel(11)).toBe('High');
    expect(getSOFASeverityLevel(15)).toBe('High');
  });

  it('returns Very High for 16-24', () => {
    expect(getSOFASeverityLevel(16)).toBe('Very High');
    expect(getSOFASeverityLevel(24)).toBe('Very High');
  });
});

describe('getSOFASeverity', () => {
  it('returns normal for 0-5', () => {
    expect(getSOFASeverity(0)).toBe('normal');
    expect(getSOFASeverity(5)).toBe('normal');
  });

  it('returns warning for 6-10', () => {
    expect(getSOFASeverity(6)).toBe('warning');
    expect(getSOFASeverity(10)).toBe('warning');
  });

  it('returns critical for > 10', () => {
    expect(getSOFASeverity(11)).toBe('critical');
    expect(getSOFASeverity(24)).toBe('critical');
  });
});

describe('hasVasopressors', () => {
  it('returns false for no vasopressors', () => {
    expect(hasVasopressors('', '', '', '')).toBe(false);
    expect(hasVasopressors('0', '0', '0', '0')).toBe(false);
  });

  it('returns true for any vasopressor', () => {
    expect(hasVasopressors('5', '', '', '')).toBe(true);
    expect(hasVasopressors('', '5', '', '')).toBe(true);
    expect(hasVasopressors('', '', '0.1', '')).toBe(true);
    expect(hasVasopressors('', '', '', '0.1')).toBe(true);
  });
});

// ─── Edge Cases ─────────────────────────────────────────────────────

describe('edge cases', () => {
  it('negative values are treated as 0 by safeParseFloat for scoring', () => {
    expect(calculateCoagulationSOFA('-5')).toBe(4);
  });

  it('extreme high values', () => {
    expect(calculateCoagulationSOFA('999')).toBe(0);
    expect(calculateLiverSOFA('100')).toBe(4);
    expect(calculateCNSSOFA('15')).toBe(0);
  });

  it('non-numeric strings parse to 0 and score accordingly', () => {
    expect(calculateCoagulationSOFA('abc')).toBe(4);
    expect(calculateLiverSOFA('xyz')).toBe(0);
  });
});

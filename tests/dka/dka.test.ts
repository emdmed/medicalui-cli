import { describe, it, expect } from 'vitest';
import {
  calculateGlucoseReductionRate,
  isGlucoseOnTarget,
  calculateKetoneReductionRate,
  isKetoneOnTarget,
  calculateBicarbonateIncreaseRate,
  isBicarbonateOnTarget,
  classifyPotassium,
  getPotassiumSeverity,
  calculateUrineOutputRate,
  isUrineOutputOnTarget,
  classifyGCS,
  isGCSDecreasing,
  assessDKAResolution,
  suggestInsulinAdjustment,
} from '../../components/dka/lib';

// ─── Glucose Reduction Rate ───────────────────────────────────────────

describe('calculateGlucoseReductionRate', () => {
  it('calculates rate: (460 - 400) / 2 = 30.0 mg/dL/hr', () => {
    expect(calculateGlucoseReductionRate('400', '460', '2')).toBe('30.0');
  });

  it('calculates rate: (25 - 20) / 1 = 5.0 mmol/L/hr', () => {
    expect(calculateGlucoseReductionRate('20', '25', '1')).toBe('5.0');
  });

  it('returns negative rate when glucose increases: (300 - 350) / 1 = -50.0', () => {
    expect(calculateGlucoseReductionRate('350', '300', '1')).toBe('-50.0');
  });

  it('returns null for zero hours', () => {
    expect(calculateGlucoseReductionRate('400', '460', '0')).toBeNull();
  });

  it('returns null for empty current', () => {
    expect(calculateGlucoseReductionRate('', '460', '1')).toBeNull();
  });

  it('returns null for empty previous', () => {
    expect(calculateGlucoseReductionRate('400', '', '1')).toBeNull();
  });
});

describe('isGlucoseOnTarget', () => {
  it('returns true for rate ≥ 54 mg/dL/hr (mgdl)', () => {
    expect(isGlucoseOnTarget('54', 'mgdl')).toBe(true);
    expect(isGlucoseOnTarget('60', 'mgdl')).toBe(true);
  });

  it('returns false for rate < 54 mg/dL/hr (mgdl)', () => {
    expect(isGlucoseOnTarget('53', 'mgdl')).toBe(false);
    expect(isGlucoseOnTarget('30', 'mgdl')).toBe(false);
  });

  it('returns true for rate ≥ 3.0 mmol/L/hr (mmol)', () => {
    expect(isGlucoseOnTarget('3.0', 'mmol')).toBe(true);
    expect(isGlucoseOnTarget('5.0', 'mmol')).toBe(true);
  });

  it('returns false for rate < 3.0 mmol/L/hr (mmol)', () => {
    expect(isGlucoseOnTarget('2.9', 'mmol')).toBe(false);
  });

  it('returns false for null rate', () => {
    expect(isGlucoseOnTarget(null, 'mmol')).toBe(false);
  });
});

// ─── Ketone Reduction Rate ────────────────────────────────────────────

describe('calculateKetoneReductionRate', () => {
  it('calculates rate: (5.0 - 4.0) / 2 = 0.50 mmol/L/hr', () => {
    expect(calculateKetoneReductionRate('4.0', '5.0', '2')).toBe('0.50');
  });

  it('calculates rate: (3.0 - 2.5) / 1 = 0.50 mmol/L/hr', () => {
    expect(calculateKetoneReductionRate('2.5', '3.0', '1')).toBe('0.50');
  });

  it('returns null for zero hours', () => {
    expect(calculateKetoneReductionRate('4.0', '5.0', '0')).toBeNull();
  });

  it('returns null for empty inputs', () => {
    expect(calculateKetoneReductionRate('', '5.0', '1')).toBeNull();
    expect(calculateKetoneReductionRate('4.0', '', '1')).toBeNull();
  });
});

describe('isKetoneOnTarget', () => {
  it('returns true for rate ≥ 0.5 mmol/L/hr', () => {
    expect(isKetoneOnTarget('0.5')).toBe(true);
    expect(isKetoneOnTarget('1.0')).toBe(true);
  });

  it('returns false for rate < 0.5 mmol/L/hr', () => {
    expect(isKetoneOnTarget('0.49')).toBe(false);
    expect(isKetoneOnTarget('0.1')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isKetoneOnTarget(null)).toBe(false);
  });
});

// ─── Bicarbonate Increase Rate ────────────────────────────────────────

describe('calculateBicarbonateIncreaseRate', () => {
  it('calculates rate: (14 - 8) / 2 = 3.0 mmol/L/hr', () => {
    expect(calculateBicarbonateIncreaseRate('14', '8', '2')).toBe('3.0');
  });

  it('calculates rate: (10 - 8) / 1 = 2.0 mmol/L/hr', () => {
    expect(calculateBicarbonateIncreaseRate('10', '8', '1')).toBe('2.0');
  });

  it('returns negative rate when bicarbonate decreases', () => {
    expect(calculateBicarbonateIncreaseRate('6', '10', '2')).toBe('-2.0');
  });

  it('returns null for zero hours', () => {
    expect(calculateBicarbonateIncreaseRate('14', '8', '0')).toBeNull();
  });
});

describe('isBicarbonateOnTarget', () => {
  it('returns true for rate ≥ 3.0 mmol/L/hr', () => {
    expect(isBicarbonateOnTarget('3.0')).toBe(true);
    expect(isBicarbonateOnTarget('4.0')).toBe(true);
  });

  it('returns false for rate < 3.0 mmol/L/hr', () => {
    expect(isBicarbonateOnTarget('2.9')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isBicarbonateOnTarget(null)).toBe(false);
  });
});

// ─── Potassium Classification ─────────────────────────────────────────

describe('classifyPotassium', () => {
  it('returns Critical Low for K+ < 3.0', () => {
    expect(classifyPotassium('2.5')).toBe('Critical Low');
    expect(classifyPotassium('2.9')).toBe('Critical Low');
  });

  it('returns Low for K+ 3.0-3.9', () => {
    expect(classifyPotassium('3.0')).toBe('Low');
    expect(classifyPotassium('3.5')).toBe('Low');
    expect(classifyPotassium('3.9')).toBe('Low');
  });

  it('returns Normal for K+ 4.0-5.0', () => {
    expect(classifyPotassium('4.0')).toBe('Normal');
    expect(classifyPotassium('4.5')).toBe('Normal');
    expect(classifyPotassium('5.0')).toBe('Normal');
  });

  it('returns High for K+ 5.1-6.0', () => {
    expect(classifyPotassium('5.1')).toBe('High');
    expect(classifyPotassium('5.5')).toBe('High');
    expect(classifyPotassium('6.0')).toBe('High');
  });

  it('returns Critical High for K+ > 6.0', () => {
    expect(classifyPotassium('6.1')).toBe('Critical High');
    expect(classifyPotassium('7.0')).toBe('Critical High');
  });

  it('returns Unknown for empty string', () => {
    expect(classifyPotassium('')).toBe('Unknown');
  });
});

describe('getPotassiumSeverity', () => {
  it('returns critical for K+ < 3.0', () => {
    expect(getPotassiumSeverity('2.5')).toBe('critical');
  });

  it('returns warning for K+ 3.0-3.9', () => {
    expect(getPotassiumSeverity('3.5')).toBe('warning');
  });

  it('returns normal for K+ 4.0-5.0', () => {
    expect(getPotassiumSeverity('4.5')).toBe('normal');
  });

  it('returns warning for K+ 5.1-6.0', () => {
    expect(getPotassiumSeverity('5.5')).toBe('warning');
  });

  it('returns critical for K+ > 6.0', () => {
    expect(getPotassiumSeverity('6.5')).toBe('critical');
  });

  it('returns default for empty string', () => {
    expect(getPotassiumSeverity('')).toBe('default');
  });
});

// ─── Urine Output Rate ───────────────────────────────────────────────

describe('calculateUrineOutputRate', () => {
  it('calculates rate: 70mL / (70kg × 1hr) = 1.00 mL/kg/hr', () => {
    expect(calculateUrineOutputRate('70', '70', '1')).toBe('1.00');
  });

  it('calculates rate: 35mL / (70kg × 1hr) = 0.50 mL/kg/hr', () => {
    expect(calculateUrineOutputRate('35', '70', '1')).toBe('0.50');
  });

  it('calculates rate: 100mL / (80kg × 2hr) = 0.63 mL/kg/hr', () => {
    const result = calculateUrineOutputRate('100', '80', '2');
    expect(result).not.toBeNull();
    expect(parseFloat(result!)).toBeCloseTo(0.63, 1);
  });

  it('returns null for zero weight', () => {
    expect(calculateUrineOutputRate('70', '0', '1')).toBeNull();
  });

  it('returns null for zero hours', () => {
    expect(calculateUrineOutputRate('70', '70', '0')).toBeNull();
  });
});

describe('isUrineOutputOnTarget', () => {
  it('returns true for rate ≥ 0.5 mL/kg/hr', () => {
    expect(isUrineOutputOnTarget('0.50')).toBe(true);
    expect(isUrineOutputOnTarget('1.00')).toBe(true);
  });

  it('returns false for rate < 0.5 mL/kg/hr', () => {
    expect(isUrineOutputOnTarget('0.49')).toBe(false);
    expect(isUrineOutputOnTarget('0.2')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isUrineOutputOnTarget(null)).toBe(false);
  });
});

// ─── GCS Classification ──────────────────────────────────────────────

describe('classifyGCS', () => {
  it('returns Normal for GCS 15', () => {
    expect(classifyGCS('15')).toBe('Normal');
  });

  it('returns Mild for GCS 13-14', () => {
    expect(classifyGCS('14')).toBe('Mild');
    expect(classifyGCS('13')).toBe('Mild');
  });

  it('returns Moderate for GCS 9-12', () => {
    expect(classifyGCS('12')).toBe('Moderate');
    expect(classifyGCS('9')).toBe('Moderate');
  });

  it('returns Severe for GCS 3-8', () => {
    expect(classifyGCS('8')).toBe('Severe');
    expect(classifyGCS('3')).toBe('Severe');
  });

  it('returns Invalid for GCS > 15', () => {
    expect(classifyGCS('16')).toBe('Invalid');
  });

  it('returns Invalid for GCS < 3', () => {
    expect(classifyGCS('2')).toBe('Invalid');
  });

  it('returns Unknown for empty string', () => {
    expect(classifyGCS('')).toBe('Unknown');
  });
});

describe('isGCSDecreasing', () => {
  it('returns true for drop ≥ 2 (15 to 13)', () => {
    expect(isGCSDecreasing('13', '15')).toBe(true);
  });

  it('returns true for drop ≥ 2 (14 to 10)', () => {
    expect(isGCSDecreasing('10', '14')).toBe(true);
  });

  it('returns false for drop < 2 (15 to 14)', () => {
    expect(isGCSDecreasing('14', '15')).toBe(false);
  });

  it('returns false for no drop (15 to 15)', () => {
    expect(isGCSDecreasing('15', '15')).toBe(false);
  });

  it('returns false for empty inputs', () => {
    expect(isGCSDecreasing('', '15')).toBe(false);
    expect(isGCSDecreasing('13', '')).toBe(false);
  });
});

// ─── DKA Resolution ──────────────────────────────────────────────────

describe('assessDKAResolution', () => {
  it('returns resolved when all 4 criteria met (mgdl)', () => {
    const result = assessDKAResolution('180', '0.3', '16', '7.35', 'mgdl');
    expect(result.resolved).toBe(true);
    expect(result.criteria.glucose).toBe(true);
    expect(result.criteria.ketones).toBe(true);
    expect(result.criteria.bicarbonate).toBe(true);
    expect(result.criteria.pH).toBe(true);
  });

  it('returns resolved when all 4 criteria met (mmol)', () => {
    const result = assessDKAResolution('10.0', '0.3', '16', '7.35', 'mmol');
    expect(result.resolved).toBe(true);
  });

  it('returns not resolved when glucose still high (mgdl)', () => {
    const result = assessDKAResolution('250', '0.3', '16', '7.35', 'mgdl');
    expect(result.resolved).toBe(false);
    expect(result.criteria.glucose).toBe(false);
  });

  it('returns not resolved when ketones still high', () => {
    const result = assessDKAResolution('180', '1.0', '16', '7.35', 'mgdl');
    expect(result.resolved).toBe(false);
    expect(result.criteria.ketones).toBe(false);
  });

  it('returns not resolved when bicarbonate still low', () => {
    const result = assessDKAResolution('180', '0.3', '12', '7.35', 'mgdl');
    expect(result.resolved).toBe(false);
    expect(result.criteria.bicarbonate).toBe(false);
  });

  it('returns not resolved when pH still low', () => {
    const result = assessDKAResolution('180', '0.3', '16', '7.25', 'mgdl');
    expect(result.resolved).toBe(false);
    expect(result.criteria.pH).toBe(false);
  });

  it('returns not resolved when all criteria fail', () => {
    const result = assessDKAResolution('350', '3.0', '8', '7.10', 'mgdl');
    expect(result.resolved).toBe(false);
    expect(Object.values(result.criteria).every(v => v === false)).toBe(true);
  });

  it('boundary: glucose at exactly 200 mg/dL is not resolved', () => {
    const result = assessDKAResolution('200', '0.3', '16', '7.35', 'mgdl');
    expect(result.criteria.glucose).toBe(false);
  });

  it('boundary: ketones at exactly 0.6 is not resolved', () => {
    const result = assessDKAResolution('180', '0.6', '16', '7.35', 'mgdl');
    expect(result.criteria.ketones).toBe(false);
  });

  it('boundary: bicarbonate at exactly 15 is resolved', () => {
    const result = assessDKAResolution('180', '0.3', '15', '7.35', 'mgdl');
    expect(result.criteria.bicarbonate).toBe(true);
  });

  it('boundary: pH at exactly 7.30 is not resolved', () => {
    const result = assessDKAResolution('180', '0.3', '16', '7.30', 'mgdl');
    expect(result.criteria.pH).toBe(false);
  });
});

// ─── Insulin Adjustment ──────────────────────────────────────────────

describe('suggestInsulinAdjustment', () => {
  it('suggests switching to subcutaneous when glucose < 200 mg/dL', () => {
    expect(suggestInsulinAdjustment('180', '60', '5', 'mgdl')).toBe(
      'Consider switching to subcutaneous insulin'
    );
  });

  it('suggests switching to subcutaneous when glucose < 11.1 mmol/L', () => {
    expect(suggestInsulinAdjustment('10.0', '4.0', '5', 'mmol')).toBe(
      'Consider switching to subcutaneous insulin'
    );
  });

  it('suggests reducing rate and adding dextrose when glucose < 252 mg/dL', () => {
    expect(suggestInsulinAdjustment('220', '60', '5', 'mgdl')).toBe(
      'Consider reducing insulin rate and adding dextrose'
    );
  });

  it('suggests reducing rate when glucose < 14 mmol/L', () => {
    expect(suggestInsulinAdjustment('13.0', '4.0', '5', 'mmol')).toBe(
      'Consider reducing insulin rate and adding dextrose'
    );
  });

  it('suggests increasing rate when glucose high but rate below target', () => {
    expect(suggestInsulinAdjustment('300', '40', '5', 'mgdl')).toBe(
      'Consider increasing insulin rate'
    );
  });

  it('suggests maintaining rate when glucose high and rate on target', () => {
    expect(suggestInsulinAdjustment('300', '60', '5', 'mgdl')).toBe(
      'Maintain current insulin rate'
    );
  });

  it('returns insufficient data for empty glucose', () => {
    expect(suggestInsulinAdjustment('', null, '5', 'mgdl')).toBe('Insufficient data');
  });

  it('returns insufficient data for zero insulin rate', () => {
    expect(suggestInsulinAdjustment('300', '60', '0', 'mgdl')).toBe('Insufficient data');
  });
});

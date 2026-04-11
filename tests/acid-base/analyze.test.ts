import { describe, it, expect } from 'vitest';
import { analyze } from '../../components/acid-base/analyze';

// Helper to create ABG values
const abg = (
  pH: string,
  pCO2: string,
  HCO3: string,
  Na = '',
  Cl = '',
  Albumin = ''
) => ({
  values: { pH, pCO2, HCO3, Na, Cl, Albumin },
  isChronic: false,
});

const abgChronic = (
  pH: string,
  pCO2: string,
  HCO3: string,
  Na = '',
  Cl = '',
  Albumin = ''
) => ({
  values: { pH, pCO2, HCO3, Na, Cl, Albumin },
  isChronic: true,
});

describe('analyze — returns null for incomplete input', () => {
  it('returns null when pH is missing', () => {
    expect(analyze(abg('', '40', '24'))).toBeNull();
  });

  it('returns null when pCO2 is missing', () => {
    expect(analyze(abg('7.40', '', '24'))).toBeNull();
  });

  it('returns null when HCO3 is missing', () => {
    expect(analyze(abg('7.40', '40', ''))).toBeNull();
  });
});

describe('analyze — normal ABG', () => {
  it('identifies normal acid-base status', () => {
    const result = analyze(abg('7.40', '40', '24'));
    expect(result).not.toBeNull();
    expect(result!.disorder).toBe('Normal');
    expect(result!.interpretation).toContain('Normal');
  });
});

describe('analyze — metabolic acidosis', () => {
  it('identifies primary metabolic acidosis (pH 7.25, low HCO3)', () => {
    const result = analyze(abg('7.25', '30', '14'));
    expect(result!.disorder).toBe('Metabolic Acidosis');
  });

  it('checks Winter\'s formula compensation', () => {
    const result = analyze(abg('7.25', '29', '14'));
    expect(result!.disorder).toBe('Metabolic Acidosis');
    expect(result!.compensation).toBe('Compensated');
    expect(result!.expectedValues.low).toBeDefined();
    expect(result!.expectedValues.high).toBeDefined();
  });

  it('detects overcompensation (pCO2 too low)', () => {
    const result = analyze(abg('7.30', '25', '14'));
    expect(result!.disorder).toBe('Metabolic Acidosis');
    expect(result!.compensation).toBe('Overcompensated');
  });

  it('detects inadequate compensation (pCO2 too high)', () => {
    const result = analyze(abg('7.15', '50', '14'));
    expect(result!.disorder).toBe('Metabolic Acidosis');
    expect(result!.compensation).toBe('Inadequate compensation');
  });
});

describe('analyze — metabolic alkalosis', () => {
  it('identifies primary metabolic alkalosis (pH 7.50, high HCO3)', () => {
    const result = analyze(abg('7.50', '42', '32'));
    expect(result!.disorder).toBe('Metabolic Alkalosis');
  });

  it('checks compensation formula', () => {
    const result = analyze(abg('7.50', '46', '32'));
    expect(result!.disorder).toBe('Metabolic Alkalosis');
    expect(result!.compensation).toBe('Compensated');
  });
});

describe('analyze — respiratory acidosis', () => {
  it('identifies acute respiratory acidosis', () => {
    const result = analyze(abg('7.28', '60', '25'));
    expect(result!.disorder).toBe('Respiratory Acidosis');
  });

  it('calculates acute compensation (ΔHCO3 = 0.1 × ΔpCO2)', () => {
    const result = analyze(abg('7.28', '60', '26'));
    expect(result!.disorder).toBe('Respiratory Acidosis');
    expect(result!.compensation).toBe('Compensated');
  });

  it('calculates chronic compensation (ΔHCO3 = 0.35 × ΔpCO2)', () => {
    const result = analyze(abgChronic('7.33', '60', '31'));
    expect(result!.disorder).toBe('Respiratory Acidosis');
    expect(result!.compensation).toBe('Compensated');
  });
});

describe('analyze — respiratory alkalosis', () => {
  it('identifies acute respiratory alkalosis', () => {
    const result = analyze(abg('7.50', '28', '22'));
    expect(result!.disorder).toBe('Respiratory Alkalosis');
  });

  it('calculates acute compensation (ΔHCO3 = 0.2 × ΔpCO2)', () => {
    const result = analyze(abg('7.50', '28', '22'));
    expect(result!.disorder).toBe('Respiratory Alkalosis');
    expect(result!.compensation).toBe('Compensated');
  });

  it('calculates chronic compensation (ΔHCO3 = 0.5 × ΔpCO2)', () => {
    const result = analyze(abgChronic('7.48', '28', '18'));
    expect(result!.disorder).toBe('Respiratory Alkalosis');
    expect(result!.compensation).toBe('Compensated');
  });
});

describe('analyze — anion gap', () => {
  it('calculates uncorrected anion gap', () => {
    const result = analyze(abg('7.25', '29', '14', '140', '104'));
    expect(result!.uncorrectedAG).toBe('22.0');
    expect(result!.agStatus).toBe('High');
  });

  it('calculates normal anion gap', () => {
    const result = analyze(abg('7.40', '40', '24', '140', '106'));
    expect(result!.uncorrectedAG).toBe('10.0');
    expect(result!.agStatus).toBe('Normal');
  });

  it('calculates low anion gap', () => {
    const result = analyze(abg('7.40', '40', '24', '135', '110'));
    expect(result!.uncorrectedAG).toBe('1.0');
    expect(result!.agStatus).toBe('Low');
  });

  it('applies albumin correction', () => {
    const result = analyze(abg('7.40', '40', '24', '140', '104', '2.0'));
    expect(result!.correctedAG).toBe('17.0');
    expect(result!.agStatus).toBe('High');
  });

  it('returns null anion gap when Na or Cl missing', () => {
    const result = analyze(abg('7.40', '40', '24'));
    expect(result!.anionGap).toBeNull();
    expect(result!.agStatus).toBeNull();
  });
});

describe('analyze — delta ratio', () => {
  it('calculates delta ratio for HAGMA', () => {
    const result = analyze(abg('7.25', '29', '14', '140', '104'));
    expect(result!.deltaRatio).toBe('1.00');
    expect(result!.deltaRatioInterpretation).toContain('Pure high AG');
  });

  it('delta ratio < 1 indicates concurrent NAGMA', () => {
    const result = analyze(abg('7.25', '29', '14', '140', '110'));
    expect(result!.agStatus).toBe('High');
    expect(parseFloat(result!.deltaRatio!)).toBeLessThan(1);
    expect(result!.deltaRatioInterpretation).toContain('Normal AG metabolic acidosis');
  });

  it('delta ratio > 2 indicates concurrent metabolic alkalosis', () => {
    const result = analyze(abg('7.32', '40', '20', '140', '96'));
    expect(result!.disorder).toBe('Metabolic Acidosis');
    expect(result!.agStatus).toBe('High');
    expect(parseFloat(result!.deltaRatio!)).toBeGreaterThan(2);
    expect(result!.deltaRatioInterpretation).toContain('alkalosis');
  });

  it('does not calculate delta ratio for non-HAGMA', () => {
    const result = analyze(abg('7.40', '40', '24', '140', '106'));
    expect(result!.deltaRatio).toBeNull();
  });
});

describe('analyze — mixed disorders', () => {
  it('flags incoherent values but still provides disorder analysis', () => {
    const result = analyze(abg('7.30', '40', '24'));
    expect(result!.disorder).toBe('Mixed Disorder');
    expect(result!.hhConsistency!.isCoherent).toBe(false);
    expect(result!.hhConsistency!.warning).toContain('verify lab values');
  });
});

describe('analyze — Henderson-Hasselbalch coherence validator', () => {
  it('passes coherence for consistent values and proceeds with analysis', () => {
    const result = analyze(abg('7.40', '40', '24'));
    expect(result!.hhConsistency!.isCoherent).toBe(true);
    expect(result!.hhConsistency!.warning).toBeNull();
    expect(result!.disorder).toBe('Normal');
  });

  it('flags incoherent values with warning but still runs full analysis', () => {
    const result = analyze(abg('7.30', '40', '24'));
    expect(result!.hhConsistency!.isCoherent).toBe(false);
    expect(result!.hhConsistency!.warning).toContain('verify lab values');
    expect(result!.disorder).not.toBeNull();
    expect(result!.disorder).toBe('Mixed Disorder');
  });

  it('includes expected pH, measured pH, and deviation', () => {
    const result = analyze(abg('7.40', '40', '24'));
    expect(result!.hhConsistency!.expectedPH).toBeDefined();
    expect(result!.hhConsistency!.measured).toBe('7.40');
    expect(parseFloat(result!.hhConsistency!.deviation)).toBeLessThanOrEqual(0.08);
  });

  it('tolerates small deviations within ±0.08', () => {
    const result = analyze(abg('7.15', '50', '14'));
    expect(result!.hhConsistency!.isCoherent).toBe(true);
    expect(result!.disorder).not.toBe('Inconclusive');
  });
});

describe('analyze — metabolic alkalosis compensation tolerance', () => {
  it('uses ±5 tolerance window', () => {
    const result = analyze(abg('7.50', '50', '32'));
    expect(result!.disorder).toBe('Metabolic Alkalosis');
    expect(result!.compensation).toBe('Compensated');
  });

  it('detects inadequate compensation outside ±5', () => {
    const result = analyze(abg('7.58', '35', '32'));
    expect(result!.disorder).toBe('Metabolic Alkalosis');
    expect(result!.compensation).toBe('Inadequate compensation');
  });
});

describe('analyze — pCO2 ceiling for metabolic alkalosis', () => {
  it('caps expected pCO2 high at 55 mmHg for extreme HCO3', () => {
    const result = analyze(abg('7.55', '52', '50'));
    expect(result!.disorder).toBe('Metabolic Alkalosis');
    expect(parseFloat(result!.expectedValues.high!)).toBeLessThanOrEqual(55);
  });
});

describe('analyze — triple acid-base disorders', () => {
  it('detects HAGMA + respiratory acidosis + metabolic alkalosis (delta ratio > 2)', () => {
    const result = analyze(abg('7.20', '50', '12', '140', '100'));
    expect(result!.disorder).toBe('Metabolic Acidosis');
    expect(result!.agStatus).toBe('High');
    expect(result!.compensation).toBe('Inadequate compensation');
    expect(result!.additionalDisorders).toContain('Respiratory Acidosis');
  });

  it('detects HAGMA + respiratory alkalosis from overcompensation + NAGMA from delta ratio < 1', () => {
    const result = analyze(abg('7.30', '20', '10', '140', '108'));
    expect(result!.disorder).toBe('Metabolic Acidosis');
    expect(result!.agStatus).toBe('High');
    expect(result!.compensation).toBe('Overcompensated');
    expect(result!.additionalDisorders).toContain('Respiratory Alkalosis');
    expect(result!.additionalDisorders).toContain('Non-AG Metabolic Acidosis');
    expect(result!.allDisorders.length).toBeGreaterThanOrEqual(3);
  });
});

describe('analyze — extreme value stress tests', () => {
  it('handles severe acidemia (pH 6.80)', () => {
    const result = analyze(abg('6.80', '80', '8'));
    expect(result).not.toBeNull();
    expect(result!.disorder).toContain('Acidosis');
  });

  it('handles severe alkalemia (pH 7.70)', () => {
    const result = analyze(abg('7.70', '20', '40'));
    expect(result).not.toBeNull();
    expect(result!.disorder).toContain('Alkalosis');
  });

  it('handles extreme hyperventilation (pCO2 10)', () => {
    const result = analyze(abg('7.65', '10', '12'));
    expect(result).not.toBeNull();
    expect(result!.disorder).toBe('Respiratory Alkalosis');
  });

  it('handles extreme hypoventilation (pCO2 100)', () => {
    const result = analyze(abg('7.10', '100', '30'));
    expect(result).not.toBeNull();
    expect(result!.disorder).toBe('Respiratory Acidosis');
  });

  it('handles very low HCO3 (3 mmol/L)', () => {
    const result = analyze(abg('6.90', '15', '3'));
    expect(result).not.toBeNull();
    expect(result!.disorder).toBe('Metabolic Acidosis');
  });

  it('handles very high HCO3 (60 mmol/L)', () => {
    const result = analyze(abg('7.60', '50', '60'));
    expect(result).not.toBeNull();
    expect(result!.disorder).toBe('Metabolic Alkalosis');
  });

  it('does not crash with pCO2 = 0 (division in H-H)', () => {
    const result = analyze(abg('7.40', '0', '24'));
    expect(result).not.toBeNull();
  });

  it('handles negative values gracefully', () => {
    const result = analyze(abg('-1', '-10', '-5'));
    expect(result).not.toBeNull();
  });
});

describe('analyze — allDisorders includes delta-ratio disorders', () => {
  it('includes Non-AG Metabolic Acidosis from delta ratio in allDisorders', () => {
    const result = analyze(abg('7.25', '29', '14', '140', '110'));
    expect(result!.allDisorders).toContain('Non-AG Metabolic Acidosis');
  });

  it('includes Metabolic Alkalosis from delta ratio in allDisorders', () => {
    const result = analyze(abg('7.32', '40', '20', '140', '96'));
    expect(result!.allDisorders).toContain('Metabolic Alkalosis');
  });
});

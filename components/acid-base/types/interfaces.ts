export interface Values {
  pH: string;
  pCO2: string;
  HCO3: string;
  Na: string;
  Cl: string;
  Albumin: string;
}

export interface ExpectedValues {
  low?: string;
  high?: string;
}

export interface Result {
  disorder: string;
  mixedDisorders: string[];
  compensation: string;
  expectedValues: ExpectedValues;
  anionGap: string | null;
  agStatus: string | null;
  allDisorders: string[];
  compensatoryResponse: string
}

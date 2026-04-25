// ─── MASLD/MASH Screening ────────────────────────────────────────

export interface MasldScreeningReading {
  id: string;
  date: string;
  age: string;
  ast: string;        // U/L
  alt: string;        // U/L
  platelets: string;  // 10^9/L
  lsm: string;        // kPa (optional — phase 2)
  elf: string;         // ELF score (optional — phase 2)
  riskFactors: {
    t2diabetes: boolean;
    prediabetes: boolean;
    obesity: boolean;
    overweightWithCVRisk: boolean;
    elevatedTransaminases: boolean;
    hepaticSteatosis: boolean;
  };
}

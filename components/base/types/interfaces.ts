// ─── Patient ──────────────────────────────────────────────────────

export interface PatientData {
  fullName: string; // patient full name
  dateOfBirth: string; // ISO date YYYY-MM-DD
  age: number | null; // calculated from dateOfBirth
  sex: string; // "male" | "female"
  weight: string; // kg
  height: string; // cm
}

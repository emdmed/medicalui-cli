export interface VitalSignsFhirProps {
  bloodPressureValue?: BloodPressureValue;
  heartRateValue?: number | null;
  respiratoryRateValue?: number | null;
  temperatureValue?: number | null;
  bloodOxygenValue?: number | null; 
  fio2Value?: number | null; 
  onFhirUpdate?: (bundle: FhirBundle) => void;
  useFahrenheit?: boolean;
  patientId?: string;
}


export interface IBloodOxygen {
  saturation: number | null;
  fiO2: number | null;
}

export interface IBloodPressureValue {
  systolic: number | null;
  diastolic: number | null;
}
export interface IVitalSignsData {
  bloodPressure: IBloodPressureValue;
  heartRate: number | null;
  respiratoryRate: number | null;
  temperature: number | null;
  bloodOxygen: IBloodOxygen;
  fhirBundle?: unknown;
  timestamp?: string;
}

export interface IVitalSignsProps {
  data?: IVitalSignsData;
  minimizedVertical?: boolean;
  onData?: (data: IVitalSignsData, fhir?: FhirBundle) => void;
  assistant?: boolean;
  useFahrenheit?: boolean;
  editable?: boolean;
  border?: boolean;
  assistantRoute?: string;
}

export interface BloodPressureValue {
  systolic: number | null;
  diastolic: number | null;
}

interface FhirCoding {
  system: string;
  code: string;
  display: string;
}

interface FhirCodeableConcept {
  coding: FhirCoding[];
  text?: string;
}

interface FhirQuantity {
  value: number | string;
  unit: string;
  system: string;
  code: string;
}

interface FhirObservationComponent {
  code: FhirCodeableConcept;
  valueQuantity: FhirQuantity;
}

interface FhirObservation {
  resourceType: "Observation";
  id?: string;
  code: FhirCodeableConcept;
  valueQuantity?: FhirQuantity;
  component?: FhirObservationComponent[];
  status:
    | "final"
    | "preliminary"
    | "registered"
    | "cancelled"
    | "entered-in-error"
    | "unknown";
  subject?: { reference: string }; 
  effectiveDateTime?: string;
}

export interface FhirBundleEntry {
  resource: FhirObservation;
}

export interface FhirBundle {
  resourceType: "Bundle";
  id?: string;
  type:
    | "collection"
    | "document"
    | "message"
    | "transaction"
    | "transaction-response"
    | "batch"
    | "batch-response"
    | "history"
    | "searchset";
  entry: FhirBundleEntry[];
}

export interface UseVitalSignsReturn {
  values: IVitalSignsData;
  handlers: {
    handleHeartRate: (value: string | number) => void;
    handleRespiratoryRate: (value: string | number) => void;
    handleTemperature: (value: string | number) => void;
    handleBloodOxygen: (value: string | number) => void;
    handleFio2: (value: string | number) => void;
    handleBloodPressure: (value: BloodPressureValue) => void;
    handleFhirUpdate: (bundle: FhirBundle) => void;
    resetValues: () => void;
    updateFromData: (data: Partial<IVitalSignsData>) => void;
  };
}
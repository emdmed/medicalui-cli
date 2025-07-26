import { ReactNode } from "react";

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


export type BloodOxygenValue = number | null;
export type Fio2Value = number | null;
export type ClickedComponent = string | null | undefined;

export interface Fio2Option {
  value: string;
  label: string;
}

export interface BloodOxygenProps {
  bloodOxygenValue: BloodOxygenValue;
  setBloodOxygenValue: (value: BloodOxygenValue) => void;
  fio2Value: Fio2Value;
  setFio2Value: (value: Fio2Value) => void;
  setClickedComponent: (component: ClickedComponent) => void;
  clickedComponent: ClickedComponent;
  editable: boolean;
}

export type InputChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => void;
export type KeyDownHandler = (e: React.KeyboardEvent<HTMLInputElement>) => void;
export type SelectChangeHandler = (value: string) => void;


export interface BloodPressureProps {
  bloodPressureValue: BloodPressureValue;
  setBloodPressureValue: (value: BloodPressureValue) => void;
  setClickedComponent: (component: string) => void;
  clickedComponent: string;
  editable: boolean;
}

export interface BloodPressureCategory {
  category: "High" | "Low" | "Normal";
}

export interface TemperatureProps {
  temperatureValue: string | number;
  setTemperatureValue: (value: string | number) => void;
  useFahrenheit?: boolean;
  setClickedComponent: (component: string) => void;
  clickedComponent: string;
  editable: boolean;
}

export interface RespiratoryRateProps {
  respiratoryRateValue: number;
  setRespiratoryRateValue: (value: string | number) => void;
  setClickedComponent: (component: string) => void;
  clickedComponent: string;
  editable: boolean;
}

export interface HeartRateProps {
  heartRateValue: number;
  setHeartRateValue: (value: number) => void;
  setClickedComponent: (component: string) => void;
  clickedComponent: string;
  editable: boolean;
}

export interface EditSectionProps {
  children: ReactNode;
  clickedComponent: string | number | null;
  parentComponent: string | number;
  editable: boolean;
  handleCancel: () => void;
  handleDelete: () => void;
  nextComponent?: () => void;
}
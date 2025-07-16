import { useEffect } from "react";

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

interface FhirBundleEntry {
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

// Component Props Types
interface BloodPressureValue {
  systolic: number | null;
  diastolic: number | null;
}

interface VitalSignsFhirProps {
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

const VitalSignsFhir = ({
  bloodPressureValue,
  heartRateValue,
  respiratoryRateValue,
  temperatureValue,
  bloodOxygenValue,
  fio2Value,
  onFhirUpdate,
  useFahrenheit = true,
  patientId = "Patient/example",
}: VitalSignsFhirProps) => {
  const generateId = (type: string): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${type}-${timestamp}-${random}`;
  };

  const getCurrentTimestamp = (): string => {
    return new Date().toISOString();
  };

  const convertToFhir = (): FhirBundle => {
    const entries: FhirBundleEntry[] = [];
    const currentTime = getCurrentTimestamp();

    if (
      bloodPressureValue &&
      bloodPressureValue?.systolic !== null &&
      bloodPressureValue?.diastolic !== null
    ) {
      entries.push({
        resource: {
          resourceType: "Observation",
          id: generateId("bp"),
          subject: { reference: patientId },
          effectiveDateTime: currentTime,
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "85354-9",
                display: "Blood pressure panel with all children optional",
              },
            ],
            text: "Blood Pressure",
          },
          component: [
            {
              code: {
                coding: [
                  {
                    system: "http://loinc.org",
                    code: "8480-6",
                    display: "Systolic blood pressure",
                  },
                ],
              },
              valueQuantity: {
                value: bloodPressureValue.systolic!,
                unit: "mmHg",
                system: "http://unitsofmeasure.org",
                code: "mm[Hg]",
              },
            },
            {
              code: {
                coding: [
                  {
                    system: "http://loinc.org",
                    code: "8462-4",
                    display: "Diastolic blood pressure",
                  },
                ],
              },
              valueQuantity: {
                value: bloodPressureValue.diastolic!,
                unit: "mmHg",
                system: "http://unitsofmeasure.org",
                code: "mm[Hg]",
              },
            },
          ],
          status: "final",
        },
      });
    }

    // Heart Rate
    if (heartRateValue !== null && heartRateValue !== undefined) {
      entries.push({
        resource: {
          resourceType: "Observation",
          id: generateId("hr"),
          subject: { reference: patientId },
          effectiveDateTime: currentTime,
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "8867-4",
                display: "Heart rate",
              },
            ],
          },
          valueQuantity: {
            value: heartRateValue,
            unit: "beats/minute",
            system: "http://unitsofmeasure.org",
            code: "/min",
          },
          status: "final",
        },
      });
    }

    // Respiratory Rate
    if (respiratoryRateValue !== null && respiratoryRateValue !== undefined) {
      entries.push({
        resource: {
          resourceType: "Observation",
          id: generateId("rr"),
          subject: { reference: patientId },
          effectiveDateTime: currentTime,
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "9279-1",
                display: "Respiratory rate",
              },
            ],
          },
          valueQuantity: {
            value: respiratoryRateValue,
            unit: "breaths/minute",
            system: "http://unitsofmeasure.org",
            code: "/min",
          },
          status: "final",
        },
      });
    }

    // Temperature
    if (temperatureValue !== null && temperatureValue !== undefined) {
      const tempUnit = useFahrenheit ? "°F" : "°C";
      const tempCode = useFahrenheit ? "°F" : "°C";

      entries.push({
        resource: {
          resourceType: "Observation",
          id: generateId("temp"),
          subject: { reference: patientId },
          effectiveDateTime: currentTime,
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "8310-5",
                display: "Body temperature",
              },
            ],
          },
          valueQuantity: {
            value: temperatureValue,
            unit: tempUnit,
            system: "http://unitsofmeasure.org",
            code: tempCode,
          },
          status: "final",
        },
      });
    }

    // Blood Oxygen Saturation
    if (bloodOxygenValue !== null && bloodOxygenValue !== undefined) {
      entries.push({
        resource: {
          resourceType: "Observation",
          id: generateId("spo2"),
          subject: { reference: patientId },
          effectiveDateTime: currentTime,
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "59408-5",
                display:
                  "Oxygen saturation in Arterial blood by Pulse oximetry",
              },
            ],
          },
          valueQuantity: {
            value: bloodOxygenValue,
            unit: "%",
            system: "http://unitsofmeasure.org",
            code: "%",
          },
          status: "final",
        },
      });
    }

    // FiO2
    if (fio2Value !== null && fio2Value !== undefined) {
      entries.push({
        resource: {
          resourceType: "Observation",
          id: generateId("fio2"),
          subject: { reference: patientId },
          effectiveDateTime: currentTime,
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "3151-8",
                display: "Fraction of inspired oxygen (FiO2)",
              },
            ],
          },
          valueQuantity: {
            value: fio2Value,
            unit: "%",
            system: "http://unitsofmeasure.org",
            code: "%",
          },
          status: "final",
        },
      });
    }

    return {
      resourceType: "Bundle",
      id: generateId("bundle"),
      type: "collection",
      entry: entries,
    };
  };

  useEffect(() => {
    const newFhirBundle = convertToFhir();

    if (onFhirUpdate) {
      onFhirUpdate(newFhirBundle);
    }
  }, [
    bloodPressureValue,
    heartRateValue,
    respiratoryRateValue,
    temperatureValue,
    bloodOxygenValue,
    fio2Value,
    onFhirUpdate,
    useFahrenheit,
    patientId,
  ]);

  return null;
};

export default VitalSignsFhir;

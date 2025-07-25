import { useEffect } from "react";
import { VitalSignsFhirProps } from "../types/vital-signs";
import { FhirBundle } from "../types/vital-signs";
import {FhirBundleEntry} from "../types/vital-signs" 

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

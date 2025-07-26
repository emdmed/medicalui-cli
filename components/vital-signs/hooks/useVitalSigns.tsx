// hooks/useVitalSigns.ts
import { useState, useCallback } from "react";
import {
  IVitalSignsData,
  IBloodPressureValue,
  IBloodOxygen,
  FhirBundle,
  BloodPressureValue,
  UseVitalSignsReturn
} from "../types/vital-signs";

export const useVitalSigns = (
  initialData?: Partial<IVitalSignsData>,
): UseVitalSignsReturn => {
  
  const [heartRate, setHeartRate] = useState<number | null>(
    initialData?.heartRate ?? null,
  );
  const [respiratoryRate, setRespiratoryRate] = useState<number | null>(
    initialData?.respiratoryRate ?? null,
  );
  const [temperature, setTemperature] = useState<number | null>(
    initialData?.temperature ?? null,
  );
  const [bloodOxygen, setBloodOxygen] = useState<IBloodOxygen>(
    initialData?.bloodOxygen ?? { saturation: null, fiO2: 21 },
  );
  const [bloodPressure, setBloodPressure] = useState<IBloodPressureValue>(
    initialData?.bloodPressure ?? { systolic: null, diastolic: null },
  );
  const [fhirBundle, setFhirBundle] = useState<unknown>(
    initialData?.fhirBundle,
  );
  const [timestamp, setTimestamp] = useState<string>(
    initialData?.timestamp ?? new Date().toISOString(),
  );

  const parseNumericValue = useCallback(
    (value: string | number): number | null => {
      if (value === null || value === undefined || value === "") return null;
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      return isNaN(numValue) ? null : numValue;
    },
    [],
  );

  const createNumericHandler = useCallback(
    (setter: (value: number | null) => void) => (value: string | number) => {
      const parsedValue = parseNumericValue(value);
      setter(parsedValue);
      setTimestamp(new Date().toISOString());
    },
    [parseNumericValue],
  );

  const handleHeartRate = createNumericHandler(setHeartRate);
  const handleRespiratoryRate = createNumericHandler(setRespiratoryRate);
  const handleTemperature = createNumericHandler(setTemperature);

  const handleBloodOxygen = useCallback(
    (value: string | number) => {
      const parsedValue = parseNumericValue(value);
      setBloodOxygen((prev) => ({ ...prev, saturation: parsedValue }));
      setTimestamp(new Date().toISOString());
    },
    [parseNumericValue],
  );

  const handleFio2 = useCallback(
    (value: string | number) => {
      const parsedValue = parseNumericValue(value);
      setBloodOxygen((prev) => ({ ...prev, fiO2: parsedValue }));
      setTimestamp(new Date().toISOString());
    },
    [parseNumericValue],
  );

  const handleBloodPressure = useCallback(
    (value: BloodPressureValue) => {
      const convertedValue: IBloodPressureValue = {
        systolic: parseNumericValue(value.systolic ?? ""),
        diastolic: parseNumericValue(value.diastolic ?? ""),
      };
      setBloodPressure(convertedValue);
      setTimestamp(new Date().toISOString());
    },
    [parseNumericValue],
  );

  const handleFhirUpdate = useCallback((bundle: FhirBundle) => {
    setFhirBundle(bundle);
    setTimestamp(new Date().toISOString());
  }, []);

  const resetValues = useCallback(() => {
    setHeartRate(null);
    setRespiratoryRate(null);
    setTemperature(null);
    setBloodOxygen({ saturation: null, fiO2: 21 });
    setBloodPressure({ systolic: null, diastolic: null });
    setFhirBundle(undefined);
    setTimestamp(new Date().toISOString());
  }, []);

  const updateFromData = useCallback((data: Partial<IVitalSignsData>) => {
    if (data.heartRate !== undefined) setHeartRate(data.heartRate);
    if (data.respiratoryRate !== undefined)
      setRespiratoryRate(data.respiratoryRate);
    if (data.temperature !== undefined) setTemperature(data.temperature);
    if (data.bloodOxygen !== undefined) setBloodOxygen(data.bloodOxygen);
    if (data.bloodPressure !== undefined) setBloodPressure(data.bloodPressure);
    if (data.fhirBundle !== undefined) setFhirBundle(data.fhirBundle);
    if (data.timestamp !== undefined) setTimestamp(data.timestamp);
    else setTimestamp(new Date().toISOString());
  }, []);

  const values: IVitalSignsData = {
    heartRate,
    respiratoryRate,
    temperature,
    bloodOxygen,
    bloodPressure,
    fhirBundle,
    timestamp,
  };

  return {
    values,
    handlers: {
      handleHeartRate,
      handleRespiratoryRate,
      handleTemperature,
      handleBloodOxygen,
      handleFio2,
      handleBloodPressure,
      handleFhirUpdate,
      resetValues,
      updateFromData,
    },
  };
};

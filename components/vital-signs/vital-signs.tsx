"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircleQuestionIcon, X } from "lucide-react";
import BloodPressure from "@/components/vital-signs/signs/blood-pressure";
import HeartRate from "@/components/vital-signs/signs/heart-rate";
import RespiratoryRate from "@/components/vital-signs/signs/respiratory-rate";
import Temperature from "@/components/vital-signs/signs/temperature";

import BloodOxygen from "@/components/vital-signs/signs/blood-oxygen";
import { Button } from "@/components/ui/button";
import VitalSignsFhir from "@/components/vital-signs/components/vital-signs-fhir";
import { FhirBundle } from "@/components/vital-signs/components/vital-signs-fhir";
import { useAnalyzeVitalSigns } from "@/components/vital-signs/hooks/useAnalyze";

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
  onData?: (data: IVitalSignsData, fhir: FhirBundle) => void;
  assistant?: boolean;
  useFahrenheit?: boolean;
  editable?: boolean;
  border?: boolean;
  assistantRoute?: string;
}

const VitalSigns = ({
  data,
  minimizedVertical = false,
  onData,
  assistant = true,
  useFahrenheit = true,
  editable = true,
  border = true,
  assistantRoute = "",
}: IVitalSignsProps) => {
  const [bloodPressureValue, setBloodPressureValue] = useState({
    systolic: data?.bloodPressure?.systolic || null,
    diastolic: data?.bloodPressure?.diastolic || null,
  });
  const [heartRateValue, setHeartRateValue] = useState(data?.heartRate || null);
  const [respiratoryRateValue, setRespiratoryRateValue] = useState(
    data?.respiratoryRate || null,
  );
  const [temperatureValue, setTemperatureValue] = useState(
    data?.temperature || null,
  );
  const [bloodOxygenValue, setBloodOxygenValue] = useState(
    data?.bloodOxygen?.saturation || null,
  );
  const [fio2Value, setFio2Value] = useState(data?.bloodOxygen?.fiO2 || null);

  const [clickedComponent, setClickedComponent] = useState(null);
  const [currentFhirBundle, setCurrentFhirBundle] = useState(null);

  // Wrapper functions to handle type conversion
  const handleHeartRateChange = useCallback((value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    setHeartRateValue(isNaN(numValue) ? null : numValue);
  }, []);

  const handleRespiratoryRateChange = useCallback((value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    setRespiratoryRateValue(isNaN(numValue) ? null : numValue);
  }, []);

  const handleTemperatureChange = useCallback((value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    setTemperatureValue(isNaN(numValue) ? null : numValue);
  }, []);

  const handleBloodOxygenChange = useCallback((value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    setBloodOxygenValue(isNaN(numValue) ? null : numValue);
  }, []);

  const handleFio2Change = useCallback((value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    setFio2Value(isNaN(numValue) ? null : numValue);
  }, []);

  // Add wrapper function for blood pressure to handle type conversion
  const handleBloodPressureChange = useCallback((value: { systolic: string | number | null; diastolic: string | number | null }) => {
    const convertedValue = {
      systolic: value.systolic ? (typeof value.systolic === "string" ? parseFloat(value.systolic) : value.systolic) : null,
      diastolic: value.diastolic ? (typeof value.diastolic === "string" ? parseFloat(value.diastolic) : value.diastolic) : null,
    };
    
    // Convert NaN to null for safety
    if (convertedValue.systolic !== null && isNaN(convertedValue.systolic)) {
      convertedValue.systolic = null;
    }
    if (convertedValue.diastolic !== null && isNaN(convertedValue.diastolic)) {
      convertedValue.diastolic = null;
    }
    
    setBloodPressureValue(convertedValue);
  }, []);

  const handleFhirUpdate = useCallback((fhirBundle) => {
    setCurrentFhirBundle(fhirBundle);
  }, []);

  const getCurrentVitalSignsData = useCallback(() => {
    return {
      bloodPressure: bloodPressureValue,
      heartRate: heartRateValue,
      respiratoryRate: respiratoryRateValue,
      temperature: temperatureValue,
      bloodOxygen: {
        saturation: bloodOxygenValue,
        fiO2: fio2Value,
      },
      timestamp: new Date().toISOString(),
    };
  }, [
    bloodPressureValue,
    heartRateValue,
    respiratoryRateValue,
    temperatureValue,
    bloodOxygenValue,
    fio2Value,
   // currentFhirBundle,
  ]);

  const {
    analysis,
    analyzeVitalSigns,
    error,
    isLoading,
    resetAnalysis,
    showAnalysis,
  } = useAnalyzeVitalSigns({ route: assistantRoute, getCurrentVitalSignsData });

  useEffect(() => {
    if (onData && typeof onData === "function") {
      const vitalSignsData: IVitalSignsData = getCurrentVitalSignsData();
      onData(vitalSignsData, currentFhirBundle);
    }
  }, [
    bloodPressureValue,
    heartRateValue,
    respiratoryRateValue,
    temperatureValue,
    bloodOxygenValue,
    fio2Value,
    currentFhirBundle,
  ]);

  const closeAnalysis = () => {
    resetAnalysis();
  };

  return (
    <div className="relative animate-in fade-in-1 duration-200">
      <VitalSignsFhir
        bloodPressureValue={bloodPressureValue}
        heartRateValue={heartRateValue}
        respiratoryRateValue={respiratoryRateValue}
        temperatureValue={temperatureValue}
        bloodOxygenValue={bloodOxygenValue}
        fio2Value={fio2Value}
        onFhirUpdate={handleFhirUpdate}
        useFahrenheit={useFahrenheit}
      />

      <Card
        className={`p-1 px-0 transition-all duration-200 flex w-fit ${border ? "" : "border-none shadow-none"}`}
      >
        <CardContent
          className={
            minimizedVertical
              ? "flex flex-col px-1 py-2"
              : "flex items-center px-1"
          }
        >
          <BloodPressure
            bloodPressureValue={bloodPressureValue}
            setBloodPressureValue={handleBloodPressureChange}
            setClickedComponent={setClickedComponent}
            clickedComponent={clickedComponent}
            editable={editable}
          />
          <HeartRate
            heartRateValue={heartRateValue}
            setHeartRateValue={handleHeartRateChange}
            setClickedComponent={setClickedComponent}
            clickedComponent={clickedComponent}
            editable={editable}
          />
          <RespiratoryRate
            respiratoryRateValue={respiratoryRateValue}
            setRespiratoryRateValue={handleRespiratoryRateChange}
            setClickedComponent={setClickedComponent}
            clickedComponent={clickedComponent}
            editable={editable}
          />
          <Temperature
            temperatureValue={temperatureValue}
            setTemperatureValue={handleTemperatureChange}
            setClickedComponent={setClickedComponent}
            clickedComponent={clickedComponent}
            useFahrenheit={useFahrenheit}
            editable={editable}
          />
          <BloodOxygen
            bloodOxygenValue={bloodOxygenValue}
            setBloodOxygenValue={handleBloodOxygenChange}
            fio2Value={fio2Value}
            setFio2Value={handleFio2Change}
            setClickedComponent={setClickedComponent}
            clickedComponent={clickedComponent}
            editable={editable}
          />

          {assistant && (
            <Button
              onClick={assistant ? analyzeVitalSigns : () => {}}
              variant="ghost"
              size="sm"
              disabled={isLoading}
            >
              <MessageCircleQuestionIcon />
            </Button>
          )}
        </CardContent>
      </Card>

      {showAnalysis && analysis && (
        <Card className="absolute top-12 mt-4 py-2 left-0 max-full z-50 animate-in slide-in-from-top-2 duration-300">
          <CardContent className="p-2">
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm font-semibold">Assistant</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeAnalysis}
                className="h-6 w-6 -mt-1 -mr-1"
              >
                <X size={14} />
              </Button>
            </div>
            <div className="text-xs whitespace-pre-wrap max-h-48 overflow-y-auto">
              {analysis}
            </div>
            {error && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-xs">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="absolute top-full left-0 z-50 mt-4">
          <Card className="p-2">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 text-foreground"></div>
              <p className="text-xs">Analyzing...</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VitalSigns;
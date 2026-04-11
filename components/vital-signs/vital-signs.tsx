/**
 * VitalSigns — Editable vital signs panel (BP, HR, RR, Temp, SpO2/FiO2).
 *
 * @props  See IVitalSignsProps in ./types/vital-signs.ts
 *   data?            — IVitalSignsData to hydrate initial values
 *   onData?          — (data: IVitalSignsData, fhir?: FhirBundle) => void — called on every change
 *   editable?        — enable click-to-edit overlays (default true)
 *   useFahrenheit?   — temperature unit (default true)
 *   assistant?       — show AI analysis button (default true)
 *   border?          — render card border (default true)
 *   assistantRoute?  — API route for AI analysis
 *
 * @usage
 *   <VitalSigns data={vitalData} onData={(d, fhir) => save(d)} editable />
 *
 * @dataflow
 *   Parent passes `data` → useVitalSigns hook manages local state →
 *   individual sign components render + accept edits →
 *   VitalSignsFhir converts to FHIR bundle →
 *   onData(data, fhir) reports changes back to parent.
 *
 * @note Add `overflow-visible` to any parent Card wrapping this component
 *       so that edit popups (absolutely positioned) are not clipped.
 */
"use client";

import { useState, useCallback, useEffect, memo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { MessageCircleQuestionIcon, X } from "lucide-react";

import BloodPressure from "@/components/vital-signs/signs/blood-pressure";
import HeartRate from "@/components/vital-signs/signs/heart-rate";
import RespiratoryRate from "@/components/vital-signs/signs/respiratory-rate";
import Temperature from "@/components/vital-signs/signs/temperature";
import BloodOxygen from "@/components/vital-signs/signs/blood-oxygen";
import VitalSignsFhir from "@/components/vital-signs/components/vital-signs-fhir";

import { useAnalyzeVitalSigns } from "@/components/vital-signs/hooks/useAnalyze";
import { useClickOutside } from "./hooks/useClickOutside";
import { useVitalSigns } from "./hooks/useVitalSigns";
import {
  IVitalSignsProps,
  IVitalSignsData,
  FhirBundle,
} from "./types/vital-signs";

import { useIsMobile } from "@/hooks/use-mobile";

const VitalSigns = ({
  data,
  onData,
  assistant = true,
  useFahrenheit = true,
  editable = true,
  border = true,
  assistantRoute = "",
}: IVitalSignsProps) => {
  const [clickedComponent, setClickedComponent] = useState(null);

  const componentRef = useClickOutside(() => {
    setClickedComponent("");
  });

  const { values, handlers } = useVitalSigns(data);
  const isMobile = useIsMobile()

  useEffect(() => {
    if (data) {
      handlers.updateFromData(data);
    }
  }, [data, handlers.updateFromData]);

  const getCurrentVitalSignsData = useCallback((): IVitalSignsData => {
    return values;
  }, [values]);

  const {
    analysis,
    analyzeVitalSigns,
    error,
    isLoading,
    resetAnalysis,
    showAnalysis,
    clearAnalysis,
  } = useAnalyzeVitalSigns({ route: assistantRoute, getCurrentVitalSignsData });

  useEffect(() => {
    if (onData && typeof onData === "function") {
      //quick fix until next refactor
      const fhirBundle = values.fhirBundle;
      delete values.fhirBundle;
      onData(values, fhirBundle as FhirBundle);
    }
  }, [values, onData]);

  const closeAnalysis = () => {
    resetAnalysis();
  };

  if (isMobile) {
    return <div
      ref={componentRef}
      className="relative animate-in fade-in-1 duration-200"
    >
      <VitalSignsFhir
        bloodPressureValue={values.bloodPressure}
        heartRateValue={values.heartRate}
        respiratoryRateValue={values.respiratoryRate}
        temperatureValue={values.temperature}
        bloodOxygenValue={values.bloodOxygen.saturation}
        fio2Value={values.bloodOxygen.fiO2}
        onFhirUpdate={handlers.handleFhirUpdate}
        useFahrenheit={useFahrenheit}
      />

      <Card
        className={`p-0 px-0 transition-all duration-200 flex w-fit ${border ? "" : "border-none shadow-none"}`}
      >
        <CardContent
          className="flex flex-col items-end gap-2 p-1"
        >
          <BloodPressure
            bloodPressureValue={values.bloodPressure}
            setBloodPressureValue={handlers.handleBloodPressure}
            setClickedComponent={setClickedComponent}
            clickedComponent={clickedComponent}
            editable={editable}
          />
          <HeartRate
            heartRateValue={values.heartRate}
            setHeartRateValue={handlers.handleHeartRate}
            setClickedComponent={setClickedComponent}
            clickedComponent={clickedComponent}
            editable={editable}
          />
          <RespiratoryRate
            respiratoryRateValue={values.respiratoryRate}
            setRespiratoryRateValue={handlers.handleRespiratoryRate}
            setClickedComponent={setClickedComponent}
            clickedComponent={clickedComponent}
            editable={editable}
          />
          <Temperature
            temperatureValue={values.temperature}
            setTemperatureValue={handlers.handleTemperature}
            setClickedComponent={setClickedComponent}
            clickedComponent={clickedComponent}
            useFahrenheit={useFahrenheit}
            editable={editable}
          />
          <BloodOxygen
            bloodOxygenValue={values.bloodOxygen.saturation}
            setBloodOxygenValue={handlers.handleBloodOxygen}
            fio2Value={values.bloodOxygen.fiO2}
            setFio2Value={handlers.handleFio2}
            setClickedComponent={setClickedComponent}
            clickedComponent={clickedComponent}
            editable={editable}
          />

          {assistant && (
            <Button
              onClick={assistant ? analyzeVitalSigns : () => { }}
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
              <Button
                onClick={() => clearAnalysis()}
                variant="ghost"
                size="icon"
              >
                <X />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  }

  return (
    <div
      ref={componentRef}
      className="relative animate-in fade-in-1 duration-200"
    >
      <VitalSignsFhir
        bloodPressureValue={values.bloodPressure}
        heartRateValue={values.heartRate}
        respiratoryRateValue={values.respiratoryRate}
        temperatureValue={values.temperature}
        bloodOxygenValue={values.bloodOxygen.saturation}
        fio2Value={values.bloodOxygen.fiO2}
        onFhirUpdate={handlers.handleFhirUpdate}
        useFahrenheit={useFahrenheit}
      />

      <Card
        className={`p-0 px-0 transition-all duration-200 flex w-fit ${border ? "" : "border-none shadow-none"}`}
      >
        <CardContent
          className="flex items-center px-1"
        >
          <BloodPressure
            bloodPressureValue={values.bloodPressure}
            setBloodPressureValue={handlers.handleBloodPressure}
            setClickedComponent={setClickedComponent}
            clickedComponent={clickedComponent}
            editable={editable}
          />
          <HeartRate
            heartRateValue={values.heartRate}
            setHeartRateValue={handlers.handleHeartRate}
            setClickedComponent={setClickedComponent}
            clickedComponent={clickedComponent}
            editable={editable}
          />
          <RespiratoryRate
            respiratoryRateValue={values.respiratoryRate}
            setRespiratoryRateValue={handlers.handleRespiratoryRate}
            setClickedComponent={setClickedComponent}
            clickedComponent={clickedComponent}
            editable={editable}
          />
          <Temperature
            temperatureValue={values.temperature}
            setTemperatureValue={handlers.handleTemperature}
            setClickedComponent={setClickedComponent}
            clickedComponent={clickedComponent}
            useFahrenheit={useFahrenheit}
            editable={editable}
          />
          <BloodOxygen
            bloodOxygenValue={values.bloodOxygen.saturation}
            setBloodOxygenValue={handlers.handleBloodOxygen}
            fio2Value={values.bloodOxygen.fiO2}
            setFio2Value={handlers.handleFio2}
            setClickedComponent={setClickedComponent}
            clickedComponent={clickedComponent}
            editable={editable}
          />

          {assistant && (
            <Button
              onClick={assistant ? analyzeVitalSigns : () => { }}
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
              <Button
                onClick={() => clearAnalysis()}
                variant="ghost"
                size="icon"
              >
                <X />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

//TODO
export default memo(VitalSigns, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
});

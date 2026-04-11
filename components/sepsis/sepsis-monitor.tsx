/**
 * SepsisMonitor — Sepsis-3/SOFA tracking with qSOFA screening, hour-1 bundle, lactate clearance.
 *
 * @props
 *   data?   — SepsisPatientData — initial patient data with readings
 *   onData? — (data: SepsisPatientData) => void — fires on every change
 *
 * @usage
 *   <SepsisMonitor />
 *   <SepsisMonitor data={patientData} onData={setPatientData} />
 *
 * @behavior
 *   Header: patient weight + baseline SOFA (editable on click).
 *   Current status: qSOFA, total SOFA, SOFA delta, sepsis/shock badges.
 *   SOFA breakdown: 6 inline organ score badges.
 *   Hour-1 bundle: start button, 5 checkboxes, elapsed timer, compliance badge.
 *   Lactate clearance: initial vs latest, % clearance badge.
 *   Add reading: click to add reading with all SOFA parameter inputs.
 *   Reading history: compact table with sticky header, horizontal scroll.
 *
 * @positioning
 *   All results render inline below inputs — no absolute positioning.
 */
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Check,
  X,
  Activity,
  Play,
} from "lucide-react";
import {
  calculateRespirationSOFA,
  calculateCoagulationSOFA,
  calculateLiverSOFA,
  calculateCardiovascularSOFA,
  calculateCNSSOFA,
  calculateRenalSOFA,
  calculateTotalSOFA,
  calculateSOFADelta,
  calculateQSOFA,
  isQSOFAPositive,
  assessSepsis,
  assessSepticShock,
  assessBundleCompliance,
  calculateLactateClearance,
  isLactateClearanceAdequate,
  getSOFASeverityLevel,
  getSOFASeverity,
  hasVasopressors,
} from "./lib";
import type {
  SepsisPatientData,
  SepsisReading,
  SepsisProps,
  Hour1Bundle,
} from "./types/sepsis";

const severityColor = (level: string): string => {
  switch (level) {
    case "normal":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "warning":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "critical":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "";
  }
};

const emptyBundle: Hour1Bundle = {
  lactateMeasured: false,
  bloodCulturesObtained: false,
  antibioticsGiven: false,
  fluidBolusGiven: false,
  vasopressorsStarted: false,
  bundleStartTime: null,
};

const emptyReading = {
  paO2: "", fiO2: "", onVentilation: false,
  platelets: "", bilirubin: "",
  map: "", dopamine: "", dobutamine: "", epinephrine: "", norepinephrine: "",
  gcs: "", creatinine: "", urineOutput: "",
  respiratoryRate: "", sbp: "",
  lactate: "",
  suspectedInfection: false, infectionSource: "",
};

const SepsisMonitor = ({ data, onData }: SepsisProps) => {
  const [patientData, setPatientData] = useState<SepsisPatientData>(
    data ?? { weight: "", baselineSOFA: "0", readings: [], hour1Bundle: { ...emptyBundle } },
  );
  const [isAddingReading, setIsAddingReading] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [tempWeight, setTempWeight] = useState("");
  const [tempBaseline, setTempBaseline] = useState("");
  const [newReading, setNewReading] = useState(emptyReading);

  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  const prevDataRef = useRef<string>("");

  useEffect(() => {
    const serialized = JSON.stringify(patientData);
    if (serialized !== prevDataRef.current) {
      prevDataRef.current = serialized;
      onDataRef.current?.(patientData);
    }
  }, [patientData]);

  const latest = patientData.readings[patientData.readings.length - 1];
  const previous =
    patientData.readings.length >= 2
      ? patientData.readings[patientData.readings.length - 2]
      : null;

  const hoursBetween = (a: SepsisReading, b: SepsisReading): number => {
    const diff = (a.timestamp - b.timestamp) / 3600;
    return diff > 0 ? diff : 1;
  };

  const hours = latest && previous ? hoursBetween(latest, previous) : null;

  // SOFA calculations
  const totalSOFA = latest
    ? calculateTotalSOFA(latest, patientData.weight, hours ? String(hours) : "1")
    : null;
  const sofaDelta = totalSOFA !== null
    ? calculateSOFADelta(totalSOFA, patientData.baselineSOFA)
    : null;

  // qSOFA
  const qsofa = latest
    ? calculateQSOFA(latest.respiratoryRate, latest.sbp, latest.gcs)
    : null;

  // Sepsis assessment
  const hasSepsisFlag = latest && totalSOFA !== null && sofaDelta !== null
    ? assessSepsis(totalSOFA, sofaDelta, latest.suspectedInfection)
    : false;

  const vasopressorsUsed = latest
    ? hasVasopressors(latest.dopamine, latest.dobutamine, latest.epinephrine, latest.norepinephrine)
    : false;

  const hasShock = latest
    ? assessSepticShock(hasSepsisFlag, vasopressorsUsed, latest.lactate)
    : false;

  // Lactate clearance (first reading vs latest)
  const firstReading = patientData.readings[0];
  const lactateClearance =
    firstReading && latest && firstReading !== latest
      ? calculateLactateClearance(firstReading.lactate, latest.lactate)
      : null;

  // Bundle compliance
  const bundleStatus = assessBundleCompliance(
    patientData.hour1Bundle,
    Math.floor(Date.now() / 1000),
  );

  // Organ scores for breakdown
  const organScores = latest
    ? {
        respiration: calculateRespirationSOFA(latest.paO2, latest.fiO2, latest.onVentilation),
        coagulation: calculateCoagulationSOFA(latest.platelets),
        liver: calculateLiverSOFA(latest.bilirubin),
        cardiovascular: calculateCardiovascularSOFA(
          latest.map, latest.dopamine, latest.dobutamine,
          latest.epinephrine, latest.norepinephrine,
        ),
        cns: calculateCNSSOFA(latest.gcs),
        renal: calculateRenalSOFA(
          latest.creatinine, latest.urineOutput,
          patientData.weight, hours ? String(hours) : "1",
        ),
      }
    : null;

  const saveHeader = () => {
    const w = parseFloat(tempWeight);
    const b = parseInt(tempBaseline);
    if (tempWeight && (isNaN(w) || w <= 0)) return;
    if (tempBaseline && (isNaN(b) || b < 0 || b > 24)) return;
    setPatientData((prev) => ({
      ...prev,
      weight: tempWeight || prev.weight,
      baselineSOFA: tempBaseline || prev.baselineSOFA,
    }));
    setIsEditingHeader(false);
  };

  const validateReading = (): boolean => {
    // At least one SOFA parameter must be filled
    const hasAny =
      newReading.paO2 || newReading.platelets || newReading.bilirubin ||
      newReading.map || newReading.gcs || newReading.creatinine ||
      newReading.lactate || newReading.respiratoryRate || newReading.sbp;
    if (!hasAny) return false;

    const ph = parseFloat(newReading.fiO2);
    if (newReading.fiO2 && (isNaN(ph) || ph < 21 || ph > 100)) return false;

    const gcs = parseFloat(newReading.gcs);
    if (newReading.gcs && (isNaN(gcs) || gcs < 3 || gcs > 15)) return false;

    const map = parseFloat(newReading.map);
    if (newReading.map && (isNaN(map) || map < 0 || map > 300)) return false;

    const plt = parseFloat(newReading.platelets);
    if (newReading.platelets && (isNaN(plt) || plt < 0)) return false;

    const cr = parseFloat(newReading.creatinine);
    if (newReading.creatinine && (isNaN(cr) || cr < 0)) return false;

    const lac = parseFloat(newReading.lactate);
    if (newReading.lactate && (isNaN(lac) || lac < 0)) return false;

    return true;
  };

  const addReading = () => {
    const reading: SepsisReading = {
      id: Date.now().toString(),
      timestamp: Math.floor(Date.now() / 1000),
      paO2: newReading.paO2,
      fiO2: newReading.fiO2,
      onVentilation: newReading.onVentilation,
      platelets: newReading.platelets,
      bilirubin: newReading.bilirubin,
      map: newReading.map,
      dopamine: newReading.dopamine,
      dobutamine: newReading.dobutamine,
      epinephrine: newReading.epinephrine,
      norepinephrine: newReading.norepinephrine,
      gcs: newReading.gcs,
      creatinine: newReading.creatinine,
      urineOutput: newReading.urineOutput,
      respiratoryRate: newReading.respiratoryRate,
      sbp: newReading.sbp,
      lactate: newReading.lactate,
      suspectedInfection: newReading.suspectedInfection,
      infectionSource: newReading.infectionSource,
    };

    setPatientData((prev) => ({
      ...prev,
      readings: [...prev.readings, reading],
    }));

    setNewReading({ ...emptyReading });
    setIsAddingReading(false);
  };

  const startBundle = () => {
    setPatientData((prev) => ({
      ...prev,
      hour1Bundle: {
        ...prev.hour1Bundle,
        bundleStartTime: Math.floor(Date.now() / 1000),
      },
    }));
  };

  const toggleBundleItem = (key: keyof Omit<Hour1Bundle, "bundleStartTime">) => {
    setPatientData((prev) => ({
      ...prev,
      hour1Bundle: {
        ...prev.hour1Bundle,
        [key]: !prev.hour1Bundle[key],
      },
    }));
  };

  const organBadge = (label: string, score: number) => {
    const color =
      score === 0
        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        : score <= 2
          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    return (
      <Badge key={label} className={`text-[10px] ${color}`}>
        {label}: {score}
      </Badge>
    );
  };

  const labelClass = "text-xs opacity-60";
  const bundle = patientData.hour1Bundle;
  const bundleElapsed = bundle.bundleStartTime
    ? Math.floor((Date.now() / 1000 - bundle.bundleStartTime) / 60)
    : null;

  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      <Card className="overflow-visible">
        <CardContent className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="font-semibold text-sm">Sepsis Monitor</span>
            </div>
          </div>

          {/* Weight + Baseline SOFA */}
          {isEditingHeader ? (
            <div className="flex items-center gap-2 mb-2">
              <Label className={labelClass}>Weight (kg)</Label>
              <Input
                value={tempWeight}
                onChange={(e) => setTempWeight(e.target.value)}
                className="text-end w-[70px] h-7"
                placeholder="kg"
                aria-label="Patient weight in kg"
              />
              <Label className={labelClass}>Baseline SOFA</Label>
              <Input
                value={tempBaseline}
                onChange={(e) => setTempBaseline(e.target.value)}
                className="text-end w-[50px] h-7"
                placeholder="0"
                aria-label="Baseline SOFA score"
              />
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={saveHeader}>
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsEditingHeader(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div
              className="text-xs opacity-60 mb-2 cursor-pointer hover:opacity-100"
              onClick={() => {
                setTempWeight(patientData.weight);
                setTempBaseline(patientData.baselineSOFA);
                setIsEditingHeader(true);
              }}
            >
              Weight: {patientData.weight || "—"} kg | Baseline SOFA: {patientData.baselineSOFA}
            </div>
          )}

          <Separator className="my-2" />

          {/* Current Status */}
          {latest ? (
            <div className="space-y-2">
              {/* qSOFA + SOFA + Sepsis status */}
              <div className="text-xs font-medium opacity-70">Status</div>
              <div className="flex flex-wrap gap-1">
                {qsofa !== null && (
                  <Badge
                    className={`text-[10px] ${
                      isQSOFAPositive(qsofa)
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    }`}
                  >
                    qSOFA: {qsofa}/3
                  </Badge>
                )}
                {totalSOFA !== null && (
                  <Badge className={`text-[10px] ${severityColor(getSOFASeverity(totalSOFA))}`}>
                    SOFA: {totalSOFA}/24 ({getSOFASeverityLevel(totalSOFA)})
                  </Badge>
                )}
                {sofaDelta !== null && sofaDelta !== 0 && (
                  <Badge
                    className={`text-[10px] ${
                      sofaDelta >= 2
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    }`}
                  >
                    Delta: {sofaDelta > 0 ? "+" : ""}{sofaDelta}
                  </Badge>
                )}
                {latest.suspectedInfection && (
                  <Badge className="text-[10px] bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    Infection: {latest.infectionSource || "suspected"}
                  </Badge>
                )}
                {hasSepsisFlag && !hasShock && (
                  <Badge className="text-[10px] bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    SEPSIS
                  </Badge>
                )}
                {hasShock && (
                  <Badge className="text-[10px] bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100 font-semibold">
                    SEPTIC SHOCK
                  </Badge>
                )}
              </div>

              {/* SOFA Breakdown */}
              {organScores && (
                <>
                  <div className="text-xs font-medium opacity-70 mt-2">SOFA Breakdown</div>
                  <div className="flex flex-wrap gap-1">
                    {organBadge("Resp", organScores.respiration)}
                    {organBadge("Coag", organScores.coagulation)}
                    {organBadge("Liver", organScores.liver)}
                    {organBadge("CV", organScores.cardiovascular)}
                    {organBadge("CNS", organScores.cns)}
                    {organBadge("Renal", organScores.renal)}
                  </div>
                </>
              )}

              {/* Lactate */}
              {latest.lactate && (
                <>
                  <div className="text-xs font-medium opacity-70 mt-2">Lactate</div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-[10px]">
                      Current: {latest.lactate} mmol/L
                    </Badge>
                    {lactateClearance && (
                      <Badge
                        className={`text-[10px] ${
                          isLactateClearanceAdequate(lactateClearance)
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        Clearance: {lactateClearance}%
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-xs opacity-50 text-center py-4">
              No readings yet. Add the first reading.
            </div>
          )}

          <Separator className="my-2" />

          {/* Hour-1 Bundle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium opacity-70">Hour-1 Bundle</div>
              {!bundle.bundleStartTime && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={startBundle}
                >
                  <Play className="h-3 w-3 mr-1" /> Start
                </Button>
              )}
              {bundleElapsed !== null && (
                <Badge
                  className={`text-[10px] ${
                    bundleElapsed <= 60
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {bundleElapsed} min elapsed
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 gap-1">
              {([
                ["lactateMeasured", "Measure lactate"],
                ["bloodCulturesObtained", "Obtain blood cultures"],
                ["antibioticsGiven", "Give broad-spectrum antibiotics"],
                ["fluidBolusGiven", "30 mL/kg crystalloid bolus"],
                ["vasopressorsStarted", "Start vasopressors (if MAP <65)"],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    checked={bundle[key]}
                    onCheckedChange={() => toggleBundleItem(key)}
                    id={`bundle-${key}`}
                    aria-label={label}
                  />
                  <Label
                    htmlFor={`bundle-${key}`}
                    className={`text-[10px] cursor-pointer ${bundle[key] ? "line-through opacity-50" : ""}`}
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </div>

            {bundleStatus.allItemsDone && (
              <Badge
                className={`text-[10px] ${
                  bundleStatus.complete
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                {bundleStatus.complete ? "Bundle Complete" : "Bundle Complete (>60 min)"}
              </Badge>
            )}
          </div>

          <Separator className="my-2" />

          {/* Add Reading */}
          {isAddingReading ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">New reading</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={addReading}
                    disabled={!validateReading()}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsAddingReading(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Screening */}
              <div className="text-[10px] font-medium opacity-50 uppercase tracking-wide">Screening</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className={labelClass}>RR (breaths/min)</Label>
                  <Input
                    value={newReading.respiratoryRate}
                    onChange={(e) => setNewReading(prev => ({ ...prev, respiratoryRate: e.target.value }))}
                    className="text-end h-7"
                    placeholder="16"
                  />
                </div>
                <div>
                  <Label className={labelClass}>SBP (mmHg)</Label>
                  <Input
                    value={newReading.sbp}
                    onChange={(e) => setNewReading(prev => ({ ...prev, sbp: e.target.value }))}
                    className="text-end h-7"
                    placeholder="120"
                  />
                </div>
                <div>
                  <Label className={labelClass}>GCS (3-15)</Label>
                  <Input
                    value={newReading.gcs}
                    onChange={(e) => setNewReading(prev => ({ ...prev, gcs: e.target.value }))}
                    className="text-end h-7"
                    placeholder="15"
                  />
                </div>
                <div>
                  <Label className={labelClass}>Lactate (mmol/L)</Label>
                  <Input
                    value={newReading.lactate}
                    onChange={(e) => setNewReading(prev => ({ ...prev, lactate: e.target.value }))}
                    className="text-end h-7"
                    placeholder="1.0"
                  />
                </div>
              </div>

              {/* Respiration */}
              <div className="text-[10px] font-medium opacity-50 uppercase tracking-wide">Respiration</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className={labelClass}>PaO2 (mmHg)</Label>
                  <Input
                    value={newReading.paO2}
                    onChange={(e) => setNewReading(prev => ({ ...prev, paO2: e.target.value }))}
                    className="text-end h-7"
                    placeholder="90"
                  />
                </div>
                <div>
                  <Label className={labelClass}>FiO2 (%)</Label>
                  <Input
                    value={newReading.fiO2}
                    onChange={(e) => setNewReading(prev => ({ ...prev, fiO2: e.target.value }))}
                    className="text-end h-7"
                    placeholder="21"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={newReading.onVentilation}
                  onCheckedChange={(c) => setNewReading(prev => ({ ...prev, onVentilation: !!c }))}
                  id="vent"
                  aria-label="On mechanical ventilation"
                />
                <Label htmlFor="vent" className="text-[10px] cursor-pointer">
                  On mechanical ventilation
                </Label>
              </div>

              {/* Coagulation + Liver */}
              <div className="text-[10px] font-medium opacity-50 uppercase tracking-wide">Coagulation / Liver</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className={labelClass}>Platelets (x10³/µL)</Label>
                  <Input
                    value={newReading.platelets}
                    onChange={(e) => setNewReading(prev => ({ ...prev, platelets: e.target.value }))}
                    className="text-end h-7"
                    placeholder="200"
                  />
                </div>
                <div>
                  <Label className={labelClass}>Bilirubin (mg/dL)</Label>
                  <Input
                    value={newReading.bilirubin}
                    onChange={(e) => setNewReading(prev => ({ ...prev, bilirubin: e.target.value }))}
                    className="text-end h-7"
                    placeholder="0.5"
                  />
                </div>
              </div>

              {/* Cardiovascular */}
              <div className="text-[10px] font-medium opacity-50 uppercase tracking-wide">Cardiovascular</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className={labelClass}>MAP (mmHg)</Label>
                  <Input
                    value={newReading.map}
                    onChange={(e) => setNewReading(prev => ({ ...prev, map: e.target.value }))}
                    className="text-end h-7"
                    placeholder="70"
                  />
                </div>
                <div>
                  <Label className={labelClass}>Dopamine (µg/kg/min)</Label>
                  <Input
                    value={newReading.dopamine}
                    onChange={(e) => setNewReading(prev => ({ ...prev, dopamine: e.target.value }))}
                    className="text-end h-7"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className={labelClass}>Dobutamine (µg/kg/min)</Label>
                  <Input
                    value={newReading.dobutamine}
                    onChange={(e) => setNewReading(prev => ({ ...prev, dobutamine: e.target.value }))}
                    className="text-end h-7"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className={labelClass}>Epinephrine (µg/kg/min)</Label>
                  <Input
                    value={newReading.epinephrine}
                    onChange={(e) => setNewReading(prev => ({ ...prev, epinephrine: e.target.value }))}
                    className="text-end h-7"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className={labelClass}>Norepinephrine (µg/kg/min)</Label>
                  <Input
                    value={newReading.norepinephrine}
                    onChange={(e) => setNewReading(prev => ({ ...prev, norepinephrine: e.target.value }))}
                    className="text-end h-7"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Renal */}
              <div className="text-[10px] font-medium opacity-50 uppercase tracking-wide">Renal</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className={labelClass}>Creatinine (mg/dL)</Label>
                  <Input
                    value={newReading.creatinine}
                    onChange={(e) => setNewReading(prev => ({ ...prev, creatinine: e.target.value }))}
                    className="text-end h-7"
                    placeholder="0.8"
                  />
                </div>
                <div>
                  <Label className={labelClass}>Urine Output (mL)</Label>
                  <Input
                    value={newReading.urineOutput}
                    onChange={(e) => setNewReading(prev => ({ ...prev, urineOutput: e.target.value }))}
                    className="text-end h-7"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Infection */}
              <div className="text-[10px] font-medium opacity-50 uppercase tracking-wide">Infection</div>
              <div className="flex items-center gap-2 mb-1">
                <Checkbox
                  checked={newReading.suspectedInfection}
                  onCheckedChange={(c) => setNewReading(prev => ({ ...prev, suspectedInfection: !!c }))}
                  id="infection"
                  aria-label="Suspected infection"
                />
                <Label htmlFor="infection" className="text-[10px] cursor-pointer">
                  Suspected infection
                </Label>
              </div>
              {newReading.suspectedInfection && (
                <div>
                  <Label className={labelClass}>Source</Label>
                  <Input
                    value={newReading.infectionSource}
                    onChange={(e) => setNewReading(prev => ({ ...prev, infectionSource: e.target.value }))}
                    className="h-7 text-xs"
                    placeholder="e.g., pneumonia, UTI, abdominal"
                  />
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs"
              onClick={() => setIsAddingReading(true)}
            >
              <Plus className="h-3 w-3 mr-1" /> Add reading
            </Button>
          )}

          {/* Reading History */}
          {patientData.readings.length > 0 && (
            <>
              <Separator className="my-2" />
              <div className="text-xs font-medium opacity-70 mb-1">
                History ({patientData.readings.length} readings)
              </div>
              <div className="overflow-x-auto max-h-48 overflow-y-auto">
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr className="border-b text-left opacity-70">
                      <th className="py-1 pr-2 font-medium sticky top-0 bg-background">Time</th>
                      <th className="py-1 px-1 font-medium sticky top-0 bg-background text-end">SOFA</th>
                      <th className="py-1 px-1 font-medium sticky top-0 bg-background text-end">qSOFA</th>
                      <th className="py-1 px-1 font-medium sticky top-0 bg-background text-end">MAP</th>
                      <th className="py-1 px-1 font-medium sticky top-0 bg-background text-end">Lac</th>
                      <th className="py-1 px-1 font-medium sticky top-0 bg-background text-end">GCS</th>
                      <th className="py-1 px-1 font-medium sticky top-0 bg-background text-end">Plt</th>
                      <th className="py-1 px-1 font-medium sticky top-0 bg-background text-end">Cr</th>
                      <th className="py-1 px-1 font-medium sticky top-0 bg-background text-end">Bil</th>
                      <th className="py-1 pl-1 font-medium sticky top-0 bg-background text-end">PaFi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...patientData.readings].reverse().map((r) => {
                      const rSOFA = calculateTotalSOFA(r, patientData.weight, "1");
                      const rQSOFA = calculateQSOFA(r.respiratoryRate, r.sbp, r.gcs);
                      const pafi =
                        r.paO2 && r.fiO2
                          ? Math.round(safeFloat(r.paO2) / (safeFloat(r.fiO2) / 100))
                          : null;
                      return (
                        <tr key={r.id} className="border-b border-muted opacity-70 hover:opacity-100">
                          <td className="py-1 pr-2 whitespace-nowrap">
                            {new Date(r.timestamp * 1000).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-1 px-1 text-end">{rSOFA}</td>
                          <td className="py-1 px-1 text-end">{rQSOFA}</td>
                          <td className="py-1 px-1 text-end">{r.map || "—"}</td>
                          <td className="py-1 px-1 text-end">{r.lactate || "—"}</td>
                          <td className="py-1 px-1 text-end">{r.gcs || "—"}</td>
                          <td className="py-1 px-1 text-end">{r.platelets || "—"}</td>
                          <td className="py-1 px-1 text-end">{r.creatinine || "—"}</td>
                          <td className="py-1 px-1 text-end">{r.bilirubin || "—"}</td>
                          <td className="py-1 pl-1 text-end">{pafi || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const safeFloat = (v: string): number => {
  const p = parseFloat(v);
  return isNaN(p) ? 0 : p;
};

export default SepsisMonitor;

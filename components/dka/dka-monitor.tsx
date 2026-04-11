/**
 * DKAMonitor — Hourly DKA tracking with glucose, ketones, potassium, insulin, GCS, urine output.
 *
 * @props
 *   data?   — DKAPatientData — initial patient data with readings
 *   onData? — (data: DKAPatientData) => void — fires on every change
 *
 * @usage
 *   <DKAMonitor />
 *   <DKAMonitor data={patientData} onData={setPatientData} />
 *
 * @behavior
 *   Header: patient weight + glucose unit toggle (mg/dL or mmol/L).
 *   Current status: latest reading badges (Glucose, Ketones, K+, GCS, Urine Output).
 *   Rate badges: inline showing reduction/increase rates vs targets.
 *   Resolution status: inline badges for each DKA criterion.
 *   Add reading: click to add hourly reading with all parameter inputs.
 *   Reading history: compact list of previous readings.
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
import {
  Plus,
  Check,
  X,
  Activity,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  calculateGlucoseReductionRate,
  isGlucoseOnTarget,
  calculateKetoneReductionRate,
  isKetoneOnTarget,
  calculateBicarbonateIncreaseRate,
  isBicarbonateOnTarget,
  classifyPotassium,
  getPotassiumSeverity,
  calculateUrineOutputRate,
  isUrineOutputOnTarget,
  classifyGCS,
  isGCSDecreasing,
  assessDKAResolution,
  suggestInsulinAdjustment,
} from "./lib";
import { analyze } from "../acid-base/analyze";
import Popup from "../acid-base/components/popup";
import type { DKAPatientData, DKAReading, DKAProps } from "./types/dka";

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

const targetBadge = (onTarget: boolean, label: string) => (
  <Badge
    className={`text-[10px] ${onTarget ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}`}
  >
    {label}
  </Badge>
);

const DKAMonitor = ({ data, onData }: DKAProps) => {
  const [patientData, setPatientData] = useState<DKAPatientData>(
    data ?? { weight: "", glucoseUnit: "mgdl", readings: [] },
  );
  const [isAddingReading, setIsAddingReading] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [tempWeight, setTempWeight] = useState("");

  // New reading form
  const emptyReading = {
    glucose: "", ketones: "", bicarbonate: "", pH: "", potassium: "",
    insulinRate: "", gcs: "", urineOutput: "", pCO2: "", sodium: "",
    chloride: "", albumin: "",
  };
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

  const hoursBetween = (a: DKAReading, b: DKAReading): number => {
    const diff = (a.timestamp - b.timestamp) / 3600;
    return diff > 0 ? diff : 1;
  };

  // Rate calculations
  const hours = latest && previous ? hoursBetween(latest, previous) : null;
  const glucoseRate =
    latest && previous && hours
      ? calculateGlucoseReductionRate(latest.glucose, previous.glucose, String(hours))
      : null;
  const ketoneRate =
    latest && previous && hours
      ? calculateKetoneReductionRate(latest.ketones, previous.ketones, String(hours))
      : null;
  const bicarbRate =
    latest && previous && hours
      ? calculateBicarbonateIncreaseRate(
          latest.bicarbonate,
          previous.bicarbonate,
          String(hours),
        )
      : null;
  const urineRate =
    latest && patientData.weight && hours
      ? calculateUrineOutputRate(latest.urineOutput, patientData.weight, String(hours))
      : null;

  // Resolution
  const resolution = latest
    ? assessDKAResolution(
        latest.glucose,
        latest.ketones,
        latest.bicarbonate,
        latest.pH,
        patientData.glucoseUnit,
      )
    : null;

  // Insulin suggestion
  const insulinSuggestion =
    latest
      ? suggestInsulinAdjustment(
          latest.glucose,
          glucoseRate,
          latest.insulinRate,
          patientData.glucoseUnit,
        )
      : null;

  // Blood gas analysis on latest reading
  const abgResult = latest
    ? analyze({
        values: {
          pH: latest.pH,
          pCO2: latest.pCO2,
          HCO3: latest.bicarbonate,
          Na: latest.sodium,
          Cl: latest.chloride,
          Albumin: latest.albumin,
        },
        isChronic: false,
      })
    : null;

  const toggleUnit = () => {
    setPatientData((prev) => ({
      ...prev,
      glucoseUnit: prev.glucoseUnit === "mgdl" ? "mmol" : "mgdl",
    }));
  };

  const saveWeight = () => {
    const w = parseFloat(tempWeight);
    if (w > 0) {
      setPatientData((prev) => ({ ...prev, weight: tempWeight }));
      setIsEditingHeader(false);
    }
  };

  const validateReading = (): boolean => {
    const g = parseFloat(newReading.glucose);
    if (isNaN(g) || g <= 0) return false;

    const ph = parseFloat(newReading.pH);
    if (newReading.pH && (isNaN(ph) || ph < 6.0 || ph > 8.0)) return false;

    const gcs = parseFloat(newReading.gcs);
    if (newReading.gcs && (isNaN(gcs) || gcs < 3 || gcs > 15)) return false;

    const k = parseFloat(newReading.potassium);
    if (newReading.potassium && (isNaN(k) || k < 0.5 || k > 10)) return false;

    const ket = parseFloat(newReading.ketones);
    if (newReading.ketones && (isNaN(ket) || ket < 0)) return false;

    const bic = parseFloat(newReading.bicarbonate);
    if (newReading.bicarbonate && (isNaN(bic) || bic < 0 || bic > 50)) return false;

    const ins = parseFloat(newReading.insulinRate);
    if (newReading.insulinRate && (isNaN(ins) || ins < 0)) return false;

    const uo = parseFloat(newReading.urineOutput);
    if (newReading.urineOutput && (isNaN(uo) || uo < 0)) return false;

    const pco2 = parseFloat(newReading.pCO2);
    if (newReading.pCO2 && (isNaN(pco2) || pco2 < 5 || pco2 > 120)) return false;

    const na = parseFloat(newReading.sodium);
    if (newReading.sodium && (isNaN(na) || na < 100 || na > 180)) return false;

    const cl = parseFloat(newReading.chloride);
    if (newReading.chloride && (isNaN(cl) || cl < 60 || cl > 140)) return false;

    const alb = parseFloat(newReading.albumin);
    if (newReading.albumin && (isNaN(alb) || alb < 0 || alb > 10)) return false;

    return true;
  };

  const addReading = () => {
    const reading: DKAReading = {
      id: Date.now().toString(),
      timestamp: Math.floor(Date.now() / 1000),
      glucose: newReading.glucose,
      ketones: newReading.ketones,
      bicarbonate: newReading.bicarbonate,
      pH: newReading.pH,
      potassium: newReading.potassium,
      insulinRate: newReading.insulinRate,
      gcs: newReading.gcs,
      urineOutput: newReading.urineOutput,
      pCO2: newReading.pCO2,
      sodium: newReading.sodium,
      chloride: newReading.chloride,
      albumin: newReading.albumin,
    };

    setPatientData((prev) => ({
      ...prev,
      readings: [...prev.readings, reading],
    }));

    // Reset form
    setNewReading(emptyReading);
    setIsAddingReading(false);
  };

  const glucoseUnitLabel =
    patientData.glucoseUnit === "mgdl" ? "mg/dL" : "mmol/L";
  const labelClass = "text-xs opacity-60";

  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      <Card className="overflow-visible">
        <CardContent className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="font-semibold text-sm">DKA Monitor</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className={`text-[10px] ${patientData.glucoseUnit === "mgdl" ? "font-semibold" : "opacity-50"}`}
              >
                mg/dL
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleUnit}
                className="h-5 w-8 p-0 hover:bg-transparent"
              >
                {patientData.glucoseUnit === "mmol" ? (
                  <ToggleRight className="h-4 w-4" />
                ) : (
                  <ToggleLeft className="h-4 w-4" />
                )}
              </Button>
              <span
                className={`text-[10px] ${patientData.glucoseUnit === "mmol" ? "font-semibold" : "opacity-50"}`}
              >
                mmol/L
              </span>
            </div>
          </div>

          {/* Weight */}
          {isEditingHeader ? (
            <div className="flex items-center gap-2 mb-2">
              <Label className={labelClass}>Weight (kg)</Label>
              <Input
                value={tempWeight}
                onChange={(e) => setTempWeight(e.target.value)}
                className="text-end w-[70px] h-7"
                placeholder="kg"
              />
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={saveWeight}>
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
                setIsEditingHeader(true);
              }}
            >
              Weight: {patientData.weight || "—"} kg
            </div>
          )}

          <Separator className="my-2" />

          {/* Current Status */}
          {latest ? (
            <div className="space-y-2">
              <div className="text-xs font-medium opacity-70">
                Latest reading
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[10px]">
                  Glucose: {latest.glucose} {glucoseUnitLabel}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  Ketones: {latest.ketones} mmol/L
                </Badge>
                <Badge
                  className={`text-[10px] ${severityColor(getPotassiumSeverity(latest.potassium))}`}
                >
                  K+: {latest.potassium} mEq/L (
                  {classifyPotassium(latest.potassium)})
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  GCS: {latest.gcs} ({classifyGCS(latest.gcs)})
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  pH: {latest.pH}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  HCO3: {latest.bicarbonate} mEq/L
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  Insulin: {latest.insulinRate} U/hr
                </Badge>
              </div>

              {/* GCS Warning */}
              {previous && isGCSDecreasing(latest.gcs, previous.gcs) && (
                <Badge className="text-[10px] bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  ⚠ GCS drop ≥2 — consider cerebral edema
                </Badge>
              )}

              {/* Rate badges */}
              {hours && (
                <>
                  <div className="text-xs font-medium opacity-70 mt-2">
                    Rates
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {glucoseRate &&
                      targetBadge(
                        isGlucoseOnTarget(glucoseRate, patientData.glucoseUnit),
                        `Glucose: ${glucoseRate} ${glucoseUnitLabel}/hr`,
                      )}
                    {ketoneRate &&
                      targetBadge(
                        isKetoneOnTarget(ketoneRate),
                        `Ketones: ${ketoneRate} mmol/L/hr`,
                      )}
                    {bicarbRate &&
                      targetBadge(
                        isBicarbonateOnTarget(bicarbRate),
                        `HCO3: +${bicarbRate} mmol/L/hr`,
                      )}
                    {urineRate &&
                      targetBadge(
                        isUrineOutputOnTarget(urineRate),
                        `Urine: ${urineRate} mL/kg/hr`,
                      )}
                  </div>
                </>
              )}

              {/* Insulin suggestion */}
              {insulinSuggestion && (
                <div className="text-[10px] opacity-70 italic">
                  {insulinSuggestion}
                </div>
              )}

              {/* Resolution */}
              {resolution && (
                <>
                  <div className="text-xs font-medium opacity-70 mt-2">
                    Resolution criteria
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {targetBadge(
                      resolution.criteria.glucose,
                      `Glucose <${patientData.glucoseUnit === "mgdl" ? "200" : "11.1"}`,
                    )}
                    {targetBadge(
                      resolution.criteria.ketones,
                      "Ketones <0.6",
                    )}
                    {targetBadge(
                      resolution.criteria.bicarbonate,
                      "HCO3 ≥15",
                    )}
                    {targetBadge(resolution.criteria.pH, "pH >7.30")}
                  </div>
                  {resolution.resolved && (
                    <Badge className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mt-1">
                      DKA Resolved
                    </Badge>
                  )}
                </>
              )}

              {/* Blood Gas Analysis */}
              <Popup visible={!!abgResult}>
                {abgResult && (
                  <div className="w-full space-y-1 mt-1">
                    <div className="text-xs font-medium opacity-70">
                      Blood Gas Analysis
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {abgResult.allDisorders.map((d: string, i: number) => (
                        <Badge
                          key={i}
                          className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {d}
                        </Badge>
                      ))}
                      {abgResult.compensation !== "N/A" && (
                        <Badge
                          className={`text-[10px] ${
                            abgResult.compensation === "Compensated"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }`}
                        >
                          {abgResult.compensation}
                        </Badge>
                      )}
                      {abgResult.anionGap && (
                        <Badge
                          className={`text-[10px] ${
                            abgResult.agStatus === "High"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}
                        >
                          AG: {abgResult.anionGap}{" "}
                          {abgResult.correctedAG ? "(corrected)" : ""}
                        </Badge>
                      )}
                      {abgResult.deltaRatioInterpretation && (
                        <Badge className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          ΔΔ {abgResult.deltaRatio}: {abgResult.deltaRatioInterpretation}
                        </Badge>
                      )}
                    </div>
                    {abgResult.hhConsistency && !abgResult.hhConsistency.isCoherent && (
                      <div className="text-[10px] text-red-600 dark:text-red-400 italic">
                        ⚠ {abgResult.hhConsistency.warning}
                      </div>
                    )}
                  </div>
                )}
              </Popup>
            </div>
          ) : (
            <div className="text-xs opacity-50 text-center py-4">
              No readings yet. Add the first hourly reading.
            </div>
          )}

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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className={labelClass}>
                    Glucose ({glucoseUnitLabel})
                  </Label>
                  <Input
                    value={newReading.glucose}
                    onChange={(e) => setNewReading(prev => ({ ...prev, glucose: e.target.value }))}
                    className="text-end h-7"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className={labelClass}>Ketones (mmol/L)</Label>
                  <Input
                    value={newReading.ketones}
                    onChange={(e) => setNewReading(prev => ({ ...prev, ketones: e.target.value }))}
                    className="text-end h-7"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className={labelClass}>HCO3 (mEq/L)</Label>
                  <Input
                    value={newReading.bicarbonate}
                    onChange={(e) => setNewReading(prev => ({ ...prev, bicarbonate: e.target.value }))}
                    className="text-end h-7"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className={labelClass}>pH</Label>
                  <Input
                    value={newReading.pH}
                    onChange={(e) => setNewReading(prev => ({ ...prev, pH: e.target.value }))}
                    className="text-end h-7"
                    placeholder="7.00"
                  />
                </div>
                <div>
                  <Label className={labelClass}>K+ (mEq/L)</Label>
                  <Input
                    value={newReading.potassium}
                    onChange={(e) => setNewReading(prev => ({ ...prev, potassium: e.target.value }))}
                    className="text-end h-7"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className={labelClass}>Insulin (U/hr)</Label>
                  <Input
                    value={newReading.insulinRate}
                    onChange={(e) => setNewReading(prev => ({ ...prev, insulinRate: e.target.value }))}
                    className="text-end h-7"
                    placeholder="0"
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
                  <Label className={labelClass}>Urine (mL)</Label>
                  <Input
                    value={newReading.urineOutput}
                    onChange={(e) => setNewReading(prev => ({ ...prev, urineOutput: e.target.value }))}
                    className="text-end h-7"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className={labelClass}>pCO2 (mmHg)</Label>
                  <Input
                    value={newReading.pCO2}
                    onChange={(e) => setNewReading(prev => ({ ...prev, pCO2: e.target.value }))}
                    className="text-end h-7"
                    placeholder="40"
                  />
                </div>
                <div>
                  <Label className={labelClass}>Na+ (mEq/L)</Label>
                  <Input
                    value={newReading.sodium}
                    onChange={(e) => setNewReading(prev => ({ ...prev, sodium: e.target.value }))}
                    className="text-end h-7"
                    placeholder="140"
                  />
                </div>
                <div>
                  <Label className={labelClass}>Cl- (mEq/L)</Label>
                  <Input
                    value={newReading.chloride}
                    onChange={(e) => setNewReading(prev => ({ ...prev, chloride: e.target.value }))}
                    className="text-end h-7"
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label className={labelClass}>Albumin (g/dL)</Label>
                  <Input
                    value={newReading.albumin}
                    onChange={(e) => setNewReading(prev => ({ ...prev, albumin: e.target.value }))}
                    className="text-end h-7"
                    placeholder="4.0"
                  />
                </div>
              </div>
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

          {/* Reading history table */}
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
                      <th className="py-1 px-1 font-medium sticky top-0 bg-background text-end">Glu</th>
                      <th className="py-1 px-1 font-medium sticky top-0 bg-background text-end">Ket</th>
                      <th className="py-1 px-1 font-medium sticky top-0 bg-background text-end">pH</th>
                      <th className="py-1 px-1 font-medium sticky top-0 bg-background text-end">HCO3</th>
                      <th className="py-1 px-1 font-medium sticky top-0 bg-background text-end">pCO2</th>
                      <th className="py-1 px-1 font-medium sticky top-0 bg-background text-end">K+</th>
                      <th className="py-1 px-1 font-medium sticky top-0 bg-background text-end">GCS</th>
                      <th className="py-1 px-1 font-medium sticky top-0 bg-background text-end">Ins</th>
                      <th className="py-1 pl-1 font-medium sticky top-0 bg-background text-end">UO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...patientData.readings].reverse().map((r) => (
                      <tr key={r.id} className="border-b border-muted opacity-70 hover:opacity-100">
                        <td className="py-1 pr-2 whitespace-nowrap">
                          {new Date(r.timestamp * 1000).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-1 px-1 text-end">{r.glucose || "—"}</td>
                        <td className="py-1 px-1 text-end">{r.ketones || "—"}</td>
                        <td className="py-1 px-1 text-end">{r.pH || "—"}</td>
                        <td className="py-1 px-1 text-end">{r.bicarbonate || "—"}</td>
                        <td className="py-1 px-1 text-end">{r.pCO2 || "—"}</td>
                        <td className="py-1 px-1 text-end">{r.potassium || "—"}</td>
                        <td className="py-1 px-1 text-end">{r.gcs || "—"}</td>
                        <td className="py-1 px-1 text-end">{r.insulinRate || "—"}</td>
                        <td className="py-1 pl-1 text-end">{r.urineOutput || "—"}</td>
                      </tr>
                    ))}
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

export default DKAMonitor;

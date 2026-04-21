/**
 * CKDEvaluator — CKD staging, KFRE risk prediction, treatment eligibility, eGFR progression.
 *
 * @props
 *   data?   — CKDPatientData — initial patient data with readings
 *   onData? — (data: CKDPatientData) => void — fires on every change
 *
 * @usage
 *   <CKDEvaluator />
 *   <CKDEvaluator data={patientData} onData={setPatientData} />
 *
 * @behavior
 *   Header: age, sex, comorbidities (editable on click).
 *   Current status: eGFR, GFR category, albuminuria, risk heatmap color, monitoring frequency.
 *   KFRE: 2-year and 5-year kidney failure risk + referral recommendation.
 *   Treatment: RASi, SGLT2i, finerenone eligibility badges.
 *   Progression: eGFR slope, rapid decline alert, significant change alert.
 *   Add reading: click to add reading with creatinine + ACR.
 *   Reading history: compact table with eGFR trend.
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
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import {
  calculateEGFR,
  classifyGFRCategory,
  classifyAlbuminuriaCategory,
  getGFRCategoryLabel,
  getAlbuminuriaCategoryLabel,
  getCKDRiskLevel,
  getMonitoringFrequency,
  calculateKFRE,
  assessReferralNeed,
  getReferralLabel,
  checkRASiEligibility,
  checkSGLT2iEligibility,
  checkFinerenoneEligibility,
  calculateEGFRSlope,
  isRapidDecline,
  hasSignificantEGFRChange,
  hasACRDoubling,
  getCKDSeverity,
} from "./lib";
import type { CKDPatientData, CKDReading, CKDProps } from "./types/ckd";

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

const riskColor = (risk: string): string => {
  switch (risk) {
    case "green":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "yellow":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "orange":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "red":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "deep-red":
      return "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100";
    default:
      return "";
  }
};

const emptyPatient: CKDPatientData = {
  age: "",
  sex: "",
  hasDiabetes: false,
  hasHeartFailure: false,
  onMaxRASi: false,
  potassiumNormal: true,
  readings: [],
};

const CKDEvaluator = ({ data, onData }: CKDProps) => {
  const [patientData, setPatientData] = useState<CKDPatientData>(
    data ?? { ...emptyPatient },
  );
  const [isAddingReading, setIsAddingReading] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [tempAge, setTempAge] = useState("");
  const [tempSex, setTempSex] = useState("");
  const [newCreatinine, setNewCreatinine] = useState("");
  const [newACR, setNewACR] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));

  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  const prevDataRef = useRef<string>("");

  // Sync inbound data prop changes (e.g. age/sex from Patient card)
  useEffect(() => {
    if (!data) return;
    const s = JSON.stringify(data);
    if (s !== prevDataRef.current) {
      prevDataRef.current = s;
      setPatientData(data);
    }
  }, [data]);

  // Emit outbound data changes
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

  // Current staging
  const gfrLabel = latest ? getGFRCategoryLabel(latest.gfrCategory) : null;
  const albLabel = latest ? getAlbuminuriaCategoryLabel(latest.albCategory) : null;
  const risk = latest ? getCKDRiskLevel(latest.gfrCategory, latest.albCategory) : null;
  const monitoring = latest ? getMonitoringFrequency(latest.gfrCategory, latest.albCategory) : null;
  const severity = latest ? getCKDSeverity(latest.gfrCategory) : null;

  // KFRE
  const kfre =
    latest && patientData.age && patientData.sex
      ? calculateKFRE(patientData.age, patientData.sex, String(latest.egfr), latest.acr)
      : null;
  const referral = kfre ? assessReferralNeed(String(kfre.fiveYear)) : null;

  // Treatment eligibility
  const rasi = latest
    ? checkRASiEligibility(latest.gfrCategory, latest.albCategory, patientData.hasDiabetes)
    : null;
  const sglt2i = latest
    ? checkSGLT2iEligibility(String(latest.egfr), latest.acr, patientData.hasHeartFailure)
    : null;
  const finerenone = latest
    ? checkFinerenoneEligibility(
        String(latest.egfr), latest.acr, patientData.hasDiabetes,
        patientData.onMaxRASi, patientData.potassiumNormal,
      )
    : null;

  // Progression
  const slope =
    patientData.readings.length >= 2
      ? calculateEGFRSlope(patientData.readings.map((r) => ({ egfr: r.egfr, date: r.date })))
      : null;
  const rapidDecline = slope !== null ? isRapidDecline(slope) : false;
  const significantChange =
    latest && previous ? hasSignificantEGFRChange(previous.egfr, latest.egfr) : false;
  const acrDoubled =
    latest && previous ? hasACRDoubling(previous.acr, latest.acr) : false;

  const saveHeader = () => {
    const a = parseFloat(tempAge);
    if (tempAge && (isNaN(a) || a <= 0 || a > 120)) return;
    const validSex = tempSex.toLowerCase();
    if (tempSex && validSex !== "male" && validSex !== "female") return;
    setPatientData((prev) => ({
      ...prev,
      age: tempAge || prev.age,
      sex: tempSex || prev.sex,
    }));
    setIsEditingHeader(false);
  };

  const validateReading = (): boolean => {
    if (!newCreatinine) return false;
    const cr = parseFloat(newCreatinine);
    if (isNaN(cr) || cr <= 0) return false;
    if (!patientData.age || !patientData.sex) return false;
    return true;
  };

  const addReading = () => {
    const egfr = calculateEGFR(newCreatinine, patientData.age, patientData.sex);
    const gfrCategory = classifyGFRCategory(String(egfr));
    const albCategory = classifyAlbuminuriaCategory(newACR || "0");

    const reading: CKDReading = {
      id: Date.now().toString(),
      date: newDate,
      creatinine: newCreatinine,
      acr: newACR || "0",
      egfr,
      gfrCategory,
      albCategory,
    };

    setPatientData((prev) => ({
      ...prev,
      readings: [...prev.readings, reading],
    }));

    setNewCreatinine("");
    setNewACR("");
    setNewDate(new Date().toISOString().slice(0, 10));
    setIsAddingReading(false);
  };

  const labelClass = "text-xs opacity-60";

  const eligibilityBadge = (
    label: string,
    result: { eligible: boolean; grade: string } | null,
  ) => {
    if (!result) return null;
    return (
      <Badge
        className={`text-xs ${
          result.eligible
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        }`}
      >
        {label}: {result.eligible ? `Yes (${result.grade})` : "No"}
      </Badge>
    );
  };

  return (
    <div className="w-full space-y-2">
      <Card className="overflow-visible">
        <CardContent className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="font-semibold text-sm">CKD Evaluator</span>
            </div>
          </div>

          {/* Demographics */}
          {isEditingHeader ? (
            <div className="space-y-2 mb-2">
              <div className="flex items-center gap-2">
                <Label className={labelClass}>Age</Label>
                <Input
                  value={tempAge}
                  onChange={(e) => setTempAge(e.target.value)}
                  className="text-end w-[70px] h-7"
                  placeholder="55"
                  aria-label="Patient age"
                />
                <Label className={labelClass}>Sex</Label>
                <Input
                  value={tempSex}
                  onChange={(e) => setTempSex(e.target.value)}
                  className="text-end w-[80px] h-7"
                  placeholder="male"
                  aria-label="Patient sex"
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
              {/* Comorbidities */}
              <div className="grid grid-cols-2 gap-1">
                {([
                  ["hasDiabetes", "Diabetes"],
                  ["hasHeartFailure", "Heart failure"],
                  ["onMaxRASi", "On max RASi"],
                  ["potassiumNormal", "K+ normal"],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      checked={patientData[key]}
                      onCheckedChange={(c) =>
                        setPatientData((prev) => ({ ...prev, [key]: !!c }))
                      }
                      id={`comorbid-${key}`}
                      aria-label={label}
                    />
                    <Label
                      htmlFor={`comorbid-${key}`}
                      className="text-xs cursor-pointer"
                    >
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="text-xs opacity-60 mb-2 cursor-pointer hover:opacity-100"
              onClick={() => {
                setTempAge(patientData.age);
                setTempSex(patientData.sex);
                setIsEditingHeader(true);
              }}
            >
              Age: {patientData.age || "—"} | Sex: {patientData.sex || "—"}
              {patientData.hasDiabetes && " | DM"}
              {patientData.hasHeartFailure && " | HF"}
              {patientData.onMaxRASi && " | RASi"}
            </div>
          )}

          <Separator className="my-2" />

          {/* Current Status + History side by side */}
          {latest ? (
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Left: Status */}
              <div className="shrink-0 space-y-2">
                {/* CGA Staging as aligned grid */}
                <div className="text-sm font-medium opacity-70">CGA Staging</div>
                <div className="inline-grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-sm items-center">
                  <span className="font-medium opacity-60">eGFR</span>
                  <Badge className={`text-xs ${severityColor(severity!)}`}>
                    {latest.egfr} mL/min/1.73m²
                  </Badge>
                  <span className="font-medium opacity-60">GFR Category</span>
                  <Badge className={`text-xs ${severityColor(severity!)}`}>
                    {latest.gfrCategory} — {gfrLabel}
                  </Badge>
                  <span className="font-medium opacity-60">ACR</span>
                  <span className="font-semibold">{latest.acr} mg/g</span>
                  <span className="font-medium opacity-60">Albuminuria</span>
                  <span className="font-semibold">{latest.albCategory} — {albLabel}</span>
                  <span className="font-medium opacity-60">Risk</span>
                  <Badge className={`text-xs ${riskColor(risk!)}`}>{risk}</Badge>
                  <span className="font-medium opacity-60">Monitoring</span>
                  <span className="font-semibold">{monitoring}×/year</span>
                </div>

                {/* KFRE */}
                {kfre && kfre.fiveYear > 0 && (
                  <>
                    <div className="text-sm font-medium opacity-70 mt-1">KFRE</div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        2-yr: {kfre.twoYear}%
                      </Badge>
                      <Badge
                        className={`text-xs ${
                          kfre.fiveYear >= 10
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : kfre.fiveYear >= 3
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        }`}
                      >
                        5-yr: {kfre.fiveYear}%
                      </Badge>
                      {referral && referral !== "none" && (
                        <Badge
                          className={`text-xs ${
                            referral === "krt-planning"
                              ? "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100 font-semibold"
                              : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                          }`}
                        >
                          {getReferralLabel(referral)}
                        </Badge>
                      )}
                    </div>
                  </>
                )}

                {/* Treatment Eligibility */}
                <div className="text-sm font-medium opacity-70 mt-1">Treatment</div>
                <div className="flex flex-wrap gap-1">
                  {eligibilityBadge("ACEi/ARB", rasi)}
                  {eligibilityBadge("SGLT2i", sglt2i)}
                  {eligibilityBadge("Finerenone", finerenone)}
                </div>

                {/* Progression */}
                {patientData.readings.length >= 2 && (
                  <>
                    <div className="text-sm font-medium opacity-70 mt-1">Progression</div>
                    <div className="flex flex-wrap gap-1">
                      {slope !== null && (
                        <Badge
                          className={`text-xs ${
                            rapidDecline
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : slope < 0
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}
                        >
                          <TrendingDown className="h-3 w-3 mr-1 inline" />
                          Slope: {slope > 0 ? "+" : ""}{slope} mL/min/yr
                        </Badge>
                      )}
                      {rapidDecline && (
                        <Badge className="text-xs bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100 font-semibold">
                          <AlertTriangle className="h-3 w-3 mr-1 inline" />
                          Rapid decline
                        </Badge>
                      )}
                      {significantChange && (
                        <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          &gt;20% eGFR drop
                        </Badge>
                      )}
                      {acrDoubled && (
                        <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          ACR doubled
                        </Badge>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Right: History */}
              {patientData.readings.length > 0 && (
                <div className="flex-1 min-w-0 sm:border-l sm:pl-3 border-border/30">
                  <div className="text-sm font-medium opacity-70 mb-1">
                    History ({patientData.readings.length})
                  </div>
                  <div className="overflow-x-auto max-h-48 overflow-y-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b text-left opacity-70">
                          <th className="py-1 pr-2 font-medium sticky top-0 bg-background">Date</th>
                          <th className="py-1 px-1 font-medium sticky top-0 bg-background text-end">Cr</th>
                          <th className="py-1 px-1 font-medium sticky top-0 bg-background text-end">ACR</th>
                          <th className="py-1 px-1 font-medium sticky top-0 bg-background text-end">eGFR</th>
                          <th className="py-1 px-1 font-medium sticky top-0 bg-background text-end">GFR</th>
                          <th className="py-1 pl-1 font-medium sticky top-0 bg-background text-end">Alb</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...patientData.readings].reverse().map((r) => (
                          <tr
                            key={r.id}
                            className="border-b border-muted opacity-70 hover:opacity-100"
                          >
                            <td className="py-1 pr-2 whitespace-nowrap">{r.date}</td>
                            <td className="py-1 px-1 text-end">{r.creatinine}</td>
                            <td className="py-1 px-1 text-end">{r.acr}</td>
                            <td className="py-1 px-1 text-end">{r.egfr}</td>
                            <td className="py-1 px-1 text-end">{r.gfrCategory}</td>
                            <td className="py-1 pl-1 text-end">{r.albCategory}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm opacity-50 text-center py-4">
              {patientData.age && patientData.sex
                ? "No readings yet. Add the first reading."
                : "Click above to set age and sex, then add a reading."}
            </div>
          )}

          <Separator className="my-2" />

          {/* Add Reading */}
          {isAddingReading ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">New reading</span>
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

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className={labelClass}>Creatinine (mg/dL)</Label>
                  <Input
                    value={newCreatinine}
                    onChange={(e) => setNewCreatinine(e.target.value)}
                    className="text-end h-7"
                    placeholder="1.2"
                  />
                </div>
                <div>
                  <Label className={labelClass}>ACR (mg/g)</Label>
                  <Input
                    value={newACR}
                    onChange={(e) => setNewACR(e.target.value)}
                    className="text-end h-7"
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label className={labelClass}>Date</Label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="h-7"
                  />
                </div>
              </div>

              {!patientData.age || !patientData.sex ? (
                <div className="text-xs text-red-500">
                  Set age and sex first (click the header above).
                </div>
              ) : null}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default CKDEvaluator;

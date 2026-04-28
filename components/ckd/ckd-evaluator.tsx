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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Check,
  X,

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
import type { CKDPatientData, CKDReading, CKDProps, CKDCauseCategory } from "./types/ckd";
import { Trace } from "../base/trace";
import { CKD_EPI_2021, KDIGO_2024_CKD } from "../base/sources";
import { useContainerNarrow, ViewToggle } from "@/components/nephrology/ui-helpers";

const severityColor = (level: string): string => {
  switch (level) {
    case "normal":
      return "severity-normal";
    case "warning":
      return "severity-warning";
    case "critical":
      return "severity-critical";
    default:
      return "";
  }
};

const riskColor = (risk: string): string => {
  switch (risk) {
    case "green":
      return "severity-normal";
    case "yellow":
      return "severity-watch";
    case "orange":
      return "severity-warning";
    case "red":
      return "severity-critical";
    case "deep-red":
      return "severity-urgent";
    default:
      return "";
  }
};

const CAUSE_CATEGORIES: { value: CKDCauseCategory; label: string }[] = [
  { value: "glomerular", label: "Glomerular" },
  { value: "tubulointerstitial", label: "Tubulointerstitial" },
  { value: "vascular", label: "Vascular" },
  { value: "cystic-congenital", label: "Cystic / Congenital" },
  { value: "systemic", label: "Systemic" },
  { value: "unknown", label: "Unknown" },
];

const getCauseCategoryLabel = (cat: CKDCauseCategory): string =>
  CAUSE_CATEGORIES.find((c) => c.value === cat)?.label ?? "";

const emptyPatient: CKDPatientData = {
  age: "",
  sex: "",
  causeCategory: "",
  causeDetail: "",
  hasDiabetes: false,
  hasHeartFailure: false,
  hasPriorCVD: false,
  hasKidneyTransplant: false,
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
  const { containerRef, isNarrow } = useContainerNarrow();
  const [view, setView] = useState<"latest" | "history">("latest");
  const [tempAge, setTempAge] = useState("");
  const [tempSex, setTempSex] = useState("");
  const [newCreatinine, setNewCreatinine] = useState("");
  const [newACR, setNewACR] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));

  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  const prevDataRef = useRef<string>("");

  // Sync inbound data prop changes
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
    const t = new Trace();
    const egfr = t.record("calculateEGFR", { creatinine: newCreatinine, age: patientData.age, sex: patientData.sex }, calculateEGFR(newCreatinine, patientData.age, patientData.sex), CKD_EPI_2021);
    const gfrCategory = t.record("classifyGFRCategory", { egfr: String(egfr) }, classifyGFRCategory(String(egfr)), KDIGO_2024_CKD);
    const albCategory = t.record("classifyAlbuminuriaCategory", { acr: newACR || "0" }, classifyAlbuminuriaCategory(newACR || "0"), KDIGO_2024_CKD);

    const reading: CKDReading = {
      id: Date.now().toString(),
      date: newDate,
      creatinine: newCreatinine,
      acr: newACR || "0",
      egfr,
      gfrCategory,
      albCategory,
      trace: t.toJSON(),
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

  const labelClass = "text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none";

  const eligibilityBadge = (
    label: string,
    result: { eligible: boolean; grade: string } | null,
  ) => {
    if (!result) return null;
    return (
      <Badge
        className={`text-xs ${
          result.eligible
            ? "severity-normal"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {label}: {result.eligible ? `Yes (${result.grade})` : "No"}
      </Badge>
    );
  };

  return (
    <div className="w-full space-y-2">
      <div className="border border-border rounded-sm p-2" ref={containerRef}>
        {/* Header */}
        <div className="flex items-center justify-between -mx-2 -mt-2 mb-1 px-2 py-1.5 bg-secondary rounded-t-sm">
          <span className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">CKD Evaluator</span>
          <div className="flex items-center gap-1">
            {isNarrow && patientData.readings.length > 0 && latest && <ViewToggle view={view} onViewChange={setView} />}
            {!isAddingReading && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsAddingReading(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Demographics — single compact row */}
        {isEditingHeader ? (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Input
              value={tempAge}
              onChange={(e) => setTempAge(e.target.value)}
              className="text-end w-14 h-6 text-xs"
              placeholder="Age"
              aria-label="Patient age"
            />
            <Input
              value={tempSex}
              onChange={(e) => setTempSex(e.target.value)}
              className="text-end w-16 h-6 text-xs"
              placeholder="Sex"
              aria-label="Patient sex"
            />
            <span className="text-border">|</span>
            {([
              ["hasDiabetes", "DM"],
              ["hasHeartFailure", "HF"],
              ["hasPriorCVD", "CVD"],
              ["hasKidneyTransplant", "Tx"],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1">
                <Checkbox
                  checked={patientData[key]}
                  onCheckedChange={(c) =>
                    setPatientData((prev) => ({ ...prev, [key]: !!c }))
                  }
                  id={`comorbid-${key}`}
                  className="h-3.5 w-3.5"
                  aria-label={label}
                />
                <Label htmlFor={`comorbid-${key}`} className="text-xs cursor-pointer">
                  {label}
                </Label>
              </div>
            ))}
            <div className="flex gap-0.5 ml-auto">
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={saveHeader}>
                <Check className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setIsEditingHeader(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="text-xs text-muted-foreground mb-1.5 cursor-pointer hover:text-foreground"
            onClick={() => {
              setTempAge(patientData.age);
              setTempSex(patientData.sex);
              setIsEditingHeader(true);
            }}
          >
            {patientData.age || "—"}y {patientData.sex ? patientData.sex.charAt(0).toUpperCase() : "—"}
            {patientData.hasDiabetes && " · DM"}
            {patientData.hasHeartFailure && " · HF"}
            {patientData.hasPriorCVD && " · CVD"}
            {patientData.hasKidneyTransplant && " · Tx"}
          </div>
        )}

        {/* ═══ HERO: Stage + Cause (compact) ═══ */}
        {latest ? (
          <div className={`-mx-2 px-2 py-1.5 mb-2 border-b border-border/40 ${riskColor(risk!)}`}>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-lg font-heading font-bold tracking-tight">
                {latest.gfrCategory}-{latest.albCategory}
              </span>
              <span className="text-xs text-muted-foreground">
                eGFR {latest.egfr} · ACR {latest.acr} mg/g · {monitoring}×/yr
              </span>
              <div className="flex flex-wrap gap-1 ml-auto">
                {CAUSE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() =>
                      setPatientData((prev) => ({
                        ...prev,
                        causeCategory: prev.causeCategory === cat.value ? "" : cat.value,
                      }))
                    }
                    className={`text-[11px] px-1.5 py-0.5 rounded-sm border transition-colors ${
                      patientData.causeCategory === cat.value
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border/60 hover:border-primary/40 text-muted-foreground"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-2">
            <div className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground mb-1">CKD Cause</div>
            <div className="flex flex-wrap gap-1">
              {CAUSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() =>
                    setPatientData((prev) => ({
                      ...prev,
                      causeCategory: prev.causeCategory === cat.value ? "" : cat.value,
                    }))
                  }
                  className={`text-xs px-2 py-1 rounded-sm border transition-colors ${
                    patientData.causeCategory === cat.value
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border hover:border-primary/40 text-muted-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-b border-border/30 my-2" />

        {/* Current Status + History side by side */}
        {latest ? (
          <div className={isNarrow ? "" : "flex flex-row gap-3"}>
            {/* Left: Status */}
            {(!isNarrow || view === "latest") && <div className="shrink-0 space-y-2">
              {/* KFRE */}
              {kfre && kfre.fiveYear > 0 && (
                <>
                  <div className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground mt-1">KFRE</div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      2-yr: {kfre.twoYear}%
                    </Badge>
                    <Badge
                      className={`text-xs ${
                        kfre.fiveYear >= 10
                          ? "severity-critical"
                          : kfre.fiveYear >= 3
                            ? "severity-warning"
                            : "severity-normal"
                      }`}
                    >
                      5-yr: {kfre.fiveYear}%
                    </Badge>
                    {referral && referral !== "none" && (
                      <Badge
                        className={`text-xs ${
                          referral === "krt-planning"
                            ? "severity-urgent font-semibold"
                            : "severity-warning"
                        }`}
                      >
                        {getReferralLabel(referral)}
                      </Badge>
                    )}
                  </div>
                </>
              )}

              {/* Treatment Eligibility */}
              <div className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground mt-1">Suggested Treatment</div>
              <div className="flex flex-wrap gap-1">
                {eligibilityBadge("ACEi/ARB", rasi)}
                {eligibilityBadge("SGLT2i", sglt2i)}
                {eligibilityBadge("Finerenone", finerenone)}
              </div>

              {/* Progression */}
              {patientData.readings.length >= 2 && (
                <>
                  <div className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground mt-1">Progression</div>
                  <div className="flex flex-wrap gap-1">
                    {slope !== null && (
                      <Badge
                        className={`text-xs ${
                          rapidDecline
                            ? "severity-critical"
                            : slope < 0
                              ? "severity-warning"
                              : "severity-normal"
                        }`}
                      >
                        <TrendingDown className="h-3 w-3 mr-1 inline" />
                        Slope: {slope > 0 ? "+" : ""}{slope} mL/min/yr
                      </Badge>
                    )}
                    {rapidDecline && (
                      <Badge className="text-xs severity-urgent font-semibold">
                        <AlertTriangle className="h-3 w-3 mr-1 inline" />
                        Rapid decline
                      </Badge>
                    )}
                    {significantChange && (
                      <Badge className="text-xs severity-critical">
                        &gt;20% eGFR drop
                      </Badge>
                    )}
                    {acrDoubled && (
                      <Badge className="text-xs severity-critical">
                        ACR doubled
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>}

            {/* Right: History */}
            {patientData.readings.length > 0 && (!isNarrow || view === "history") && (
              <div className={`flex-1 min-w-0 ${!isNarrow ? "border-l pl-3 border-border/30" : ""}`}>
                {!isNarrow && <div className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground mb-1">
                  History ({patientData.readings.length})
                </div>}
                <div className="overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-xs border-collapse tabular-nums">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-1 pr-2 font-heading font-medium uppercase tracking-wider text-muted-foreground text-[11px] sticky top-0 bg-background">Date</th>
                        <th className="py-1 px-1 font-heading font-medium uppercase tracking-wider text-muted-foreground text-[11px] sticky top-0 bg-background text-end">Cr</th>
                        <th className="py-1 px-1 font-heading font-medium uppercase tracking-wider text-muted-foreground text-[11px] sticky top-0 bg-background text-end">ACR</th>
                        <th className="py-1 px-1 font-heading font-medium uppercase tracking-wider text-muted-foreground text-[11px] sticky top-0 bg-background text-end">eGFR</th>
                        <th className="py-1 px-1 font-heading font-medium uppercase tracking-wider text-muted-foreground text-[11px] sticky top-0 bg-background text-end">GFR</th>
                        <th className="py-1 pl-1 font-heading font-medium uppercase tracking-wider text-muted-foreground text-[11px] sticky top-0 bg-background text-end">Alb</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...patientData.readings].reverse().map((r, i) => (
                        <tr
                          key={r.id}
                          className={`border-b border-border/30 ${i % 2 === 1 ? "bg-muted/10" : ""}`}
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
          <>
            {!latest && (
              <div className="text-xs text-muted-foreground text-center py-2">
                {patientData.age && patientData.sex
                  ? "No readings yet. Add the first reading."
                  : "Click above to set age and sex, then add a reading."}
              </div>
            )}
          </>
        )}

        {/* Add Reading — inline form */}
        {isAddingReading && (
          <>
            <div className="border-b border-border/30 my-2" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">New reading</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={addReading}
                    disabled={!validateReading()}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => setIsAddingReading(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground">Creatinine (mg/dL)</Label>
                  <Input
                    value={newCreatinine}
                    onChange={(e) => setNewCreatinine(e.target.value)}
                    className="text-end h-6 text-xs"
                    placeholder="1.2"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground">ACR (mg/g)</Label>
                  <Input
                    value={newACR}
                    onChange={(e) => setNewACR(e.target.value)}
                    className="text-end h-6 text-xs"
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground">Date</Label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="h-6 text-xs"
                  />
                </div>
              </div>

              {!patientData.age || !patientData.sex ? (
                <div className="text-xs severity-critical-text">
                  Set age and sex first (click the header above).
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CKDEvaluator;

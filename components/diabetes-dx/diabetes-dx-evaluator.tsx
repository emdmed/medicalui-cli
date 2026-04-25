/**
 * DiabetesDxEvaluator — Diabetes Diagnosis Classifier based on ADA Table 2.1.
 *
 * @props
 *   data?   — DiabetesDxPatientData — initial patient data with readings
 *   onData? — (data: DiabetesDxPatientData) => void — fires on every change
 *
 * @behavior
 *   Header: age, sex, hasSymptoms (editable on click).
 *   Hero: Shows diagnosis classification + confirmation badge.
 *   History: Table with A1C, FPG, 2h-PG columns.
 *   Logic: Table 2.1 thresholds. Confirmation: 2 abnormal results across readings = confirmed.
 */
import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Check, X } from "lucide-react";
import {
  classifyA1C,
  classifyFPG,
  classify2hPG,
  classifyRandomPG,
  getDiagnosis,
  checkConfirmation,
} from "./lib";
import type { DiabetesDxPatientData, DiabetesDxReading, DiabetesDxProps } from "./types/diabetes-dx";
import { useContainerNarrow, ViewToggle } from "@/components/endocrine/ui-helpers";

const severityColor = (s: string): string => {
  switch (s) {
    case "normal": return "severity-normal";
    case "warning": return "severity-warning";
    case "critical": return "severity-critical";
    default: return "";
  }
};

const diagnosisSeverity = (cat: string): "normal" | "warning" | "critical" => {
  if (cat === "diabetes") return "critical";
  if (cat.startsWith("prediabetes")) return "warning";
  return "normal";
};

const emptyPatient: DiabetesDxPatientData = {
  age: "",
  sex: "",
  hasSymptoms: false,
  readings: [],
};

const DiabetesDxEvaluator = ({ data, onData }: DiabetesDxProps) => {
  const [patientData, setPatientData] = useState<DiabetesDxPatientData>(
    data ?? { ...emptyPatient },
  );
  const [isAddingReading, setIsAddingReading] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const { containerRef, isNarrow } = useContainerNarrow();
  const [view, setView] = useState<"latest" | "history">("latest");
  const [tempAge, setTempAge] = useState("");
  const [tempSex, setTempSex] = useState("");
  const [newA1c, setNewA1c] = useState("");
  const [newFpg, setNewFpg] = useState("");
  const [new2hPG, setNew2hPG] = useState("");
  const [newRandomPG, setNewRandomPG] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));

  const onDataRef = useRef(onData);
  onDataRef.current = onData;
  const prevDataRef = useRef<string>("");

  useEffect(() => {
    if (!data) return;
    const s = JSON.stringify(data);
    if (s !== prevDataRef.current) { prevDataRef.current = s; setPatientData(data); }
  }, [data]);

  useEffect(() => {
    const s = JSON.stringify(patientData);
    if (s !== prevDataRef.current) { prevDataRef.current = s; onDataRef.current?.(patientData); }
  }, [patientData]);

  const latest = patientData.readings[patientData.readings.length - 1];

  // Diagnosis from latest reading
  const diagnosis = latest
    ? getDiagnosis(latest.a1c, latest.fpg, latest.twohPG, latest.randomPG, patientData.hasSymptoms)
    : null;

  // Confirmation across all readings
  const confirmation = checkConfirmation(patientData.readings, patientData.hasSymptoms);

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

  const addReading = () => {
    if (!newA1c && !newFpg && !new2hPG && !newRandomPG) return;
    const reading: DiabetesDxReading = {
      id: Date.now().toString(),
      date: newDate,
      a1c: newA1c,
      fpg: newFpg,
      twohPG: new2hPG,
      randomPG: newRandomPG,
    };
    setPatientData((prev) => ({
      ...prev,
      readings: [...prev.readings, reading],
    }));
    setNewA1c("");
    setNewFpg("");
    setNew2hPG("");
    setNewRandomPG("");
    setNewDate(new Date().toISOString().slice(0, 10));
    setIsAddingReading(false);
  };

  const labelClass = "text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none";

  return (
    <div className="w-full space-y-2">
      <div className="border border-border rounded-sm p-2" ref={containerRef}>
        {/* Header */}
        <div className="flex items-center justify-between -mx-2 -mt-2 mb-1 px-2 py-1.5 bg-secondary rounded-t-sm">
          <span className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">Diabetes Dx</span>
          <div className="flex items-center gap-1">
            {isNarrow && patientData.readings.length > 0 && latest && <ViewToggle view={view} onViewChange={setView} />}
            {!isAddingReading && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsAddingReading(true)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Demographics */}
        {isEditingHeader ? (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Input value={tempAge} onChange={(e) => setTempAge(e.target.value)} className="text-end w-14 h-6 text-xs" placeholder="Age" />
            <Input value={tempSex} onChange={(e) => setTempSex(e.target.value)} className="text-end w-16 h-6 text-xs" placeholder="Sex" />
            <span className="text-border">|</span>
            <div className="flex items-center gap-1">
              <Checkbox
                checked={patientData.hasSymptoms}
                onCheckedChange={(c) => setPatientData((prev) => ({ ...prev, hasSymptoms: !!c }))}
                id="has-symptoms"
                className="h-3.5 w-3.5"
              />
              <Label htmlFor="has-symptoms" className="text-xs cursor-pointer">Symptomatic</Label>
            </div>
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
            {patientData.hasSymptoms && " · Symptomatic"}
          </div>
        )}

        {/* Hero: Diagnosis */}
        {latest && diagnosis ? (
          <div className={`-mx-2 px-2 py-1.5 mb-2 border-b border-border/40 ${severityColor(diagnosisSeverity(diagnosis.category))}`}>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-lg font-heading font-bold tracking-tight">{diagnosis.label}</span>
              {confirmation.confirmed && (
                <Badge className="text-xs severity-critical">Confirmed — {confirmation.method}</Badge>
              )}
              {!confirmation.confirmed && diagnosis.category === "diabetes" && (
                <Badge variant="outline" className="text-xs">Unconfirmed — needs 2nd test</Badge>
              )}
              <div className="flex flex-wrap gap-1 ml-auto text-xs text-muted-foreground">
                {latest.a1c && <span>A1C {latest.a1c}%</span>}
                {latest.fpg && <span>· FPG {latest.fpg}</span>}
                {latest.twohPG && <span>· 2h-PG {latest.twohPG}</span>}
              </div>
            </div>
          </div>
        ) : null}

        <div className="border-b border-border/30 my-2" />

        {/* Status + History */}
        {latest ? (
          <div className={isNarrow ? "" : "flex flex-row gap-3"}>
            {(!isNarrow || view === "latest") && (
              <div className="shrink-0 space-y-1">
                <div className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">Test Results</div>
                <div className="inline-grid grid-cols-[auto_auto_auto] gap-x-2 text-sm items-center tabular-nums">
                  {[
                    { label: "A1C", value: latest.a1c, unit: "%", cls: classifyA1C(latest.a1c) },
                    { label: "FPG", value: latest.fpg, unit: "mg/dL", cls: classifyFPG(latest.fpg) },
                    { label: "2h-PG", value: latest.twohPG, unit: "mg/dL", cls: classify2hPG(latest.twohPG) },
                    { label: "Random PG", value: latest.randomPG, unit: "mg/dL", cls: classifyRandomPG(latest.randomPG, patientData.hasSymptoms) },
                  ].map((item) => (
                    <React.Fragment key={item.label}>
                      <span className="font-medium text-muted-foreground whitespace-nowrap py-0.5 border-b border-border/20">{item.label}</span>
                      <span className="font-semibold whitespace-nowrap text-right py-0.5 border-b border-border/20">
                        <span className={item.cls.severity === "critical" ? "severity-critical-text font-medium" : item.cls.severity === "warning" ? "severity-warning-text font-medium" : ""}>
                          {item.value || "—"}
                        </span>
                        <span className="text-xs text-muted-foreground ml-0.5">{item.unit}</span>
                      </span>
                      <span className="py-0.5 border-b border-border/20">
                        {item.cls.label ? <Badge className={`text-xs px-1.5 py-0 ${severityColor(item.cls.severity)}`}>{item.cls.label}</Badge> : null}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            {patientData.readings.length > 0 && (!isNarrow || view === "history") && (
              <div className={`flex-1 min-w-0 ${!isNarrow ? "border-l pl-3 border-border/30" : ""}`}>
                {!isNarrow && <div className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground mb-1">History ({patientData.readings.length})</div>}
                <div className="overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-xs border-collapse tabular-nums">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-1 pr-2 font-heading font-medium uppercase tracking-wider text-muted-foreground text-[11px] sticky top-0 bg-background">Date</th>
                        <th className="py-1 px-1 font-heading font-medium uppercase tracking-wider text-muted-foreground text-[11px] sticky top-0 bg-background text-end">A1C</th>
                        <th className="py-1 px-1 font-heading font-medium uppercase tracking-wider text-muted-foreground text-[11px] sticky top-0 bg-background text-end">FPG</th>
                        <th className="py-1 px-1 font-heading font-medium uppercase tracking-wider text-muted-foreground text-[11px] sticky top-0 bg-background text-end">2h-PG</th>
                        <th className="py-1 pl-1 font-heading font-medium uppercase tracking-wider text-muted-foreground text-[11px] sticky top-0 bg-background text-end">RPG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...patientData.readings].reverse().map((r, i) => {
                        const a = classifyA1C(r.a1c);
                        const f = classifyFPG(r.fpg);
                        const t = classify2hPG(r.twohPG);
                        return (
                          <tr key={r.id} className={`border-b border-border/30 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                            <td className="py-1 pr-2 whitespace-nowrap">{r.date}</td>
                            <td className={`py-1 px-1 text-end ${a.severity !== "normal" ? `severity-${a.severity}-text` : ""}`}>{r.a1c || "—"}</td>
                            <td className={`py-1 px-1 text-end ${f.severity !== "normal" ? `severity-${f.severity}-text` : ""}`}>{r.fpg || "—"}</td>
                            <td className={`py-1 px-1 text-end ${t.severity !== "normal" ? `severity-${t.severity}-text` : ""}`}>{r.twohPG || "—"}</td>
                            <td className="py-1 pl-1 text-end">{r.randomPG || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-2">
            No readings yet. Add the first reading.
          </div>
        )}

        {/* Add Reading */}
        {isAddingReading && (
          <>
            <div className="border-b border-border/30 my-2" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">New reading</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={addReading} disabled={!newA1c && !newFpg && !new2hPG && !newRandomPG}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setIsAddingReading(false)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <Label className={labelClass}>A1C (%)</Label>
                  <Input value={newA1c} onChange={(e) => setNewA1c(e.target.value)} className="text-end h-6 text-xs" placeholder="6.5" />
                </div>
                <div>
                  <Label className={labelClass}>FPG (mg/dL)</Label>
                  <Input value={newFpg} onChange={(e) => setNewFpg(e.target.value)} className="text-end h-6 text-xs" placeholder="126" />
                </div>
                <div>
                  <Label className={labelClass}>2h-PG (mg/dL)</Label>
                  <Input value={new2hPG} onChange={(e) => setNew2hPG(e.target.value)} className="text-end h-6 text-xs" placeholder="200" />
                </div>
                <div>
                  <Label className={labelClass}>Random PG (mg/dL)</Label>
                  <Input value={newRandomPG} onChange={(e) => setNewRandomPG(e.target.value)} className="text-end h-6 text-xs" placeholder="200" />
                </div>
                <div>
                  <Label className={labelClass}>Date</Label>
                  <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-6 text-xs" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DiabetesDxEvaluator;

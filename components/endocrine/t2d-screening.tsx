/**
 * T2D Screening Eligibility — ADA risk-factor based screening recommendation.
 * @props data? — T2dScreeningReading[], onData? — callback on change
 */
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Check, X } from "lucide-react";
import type { T2dScreeningReading } from "./types/interfaces";
import { getT2DScreeningRecommendation } from "./lib";
import { useSyncedReadings, useContainerNarrow, ViewToggle, severityBg, HistoryTable } from "./ui-helpers";

export interface T2dScreeningProps {
  data?: T2dScreeningReading[];
  onData?: (data: T2dScreeningReading[]) => void;
}

const RISK_FACTOR_LABELS: Record<string, string> = {
  firstDegreeRelative: "1st-degree relative with DM",
  highRiskEthnicity: "High-risk ethnicity",
  cvdHistory: "CVD history",
  hypertension: "Hypertension",
  dyslipidemia: "Dyslipidemia",
  pcos: "PCOS",
  physicalInactivity: "Physical inactivity",
  insulinResistanceSigns: "Insulin resistance signs",
  priorPrediabetes: "Prior prediabetes",
  priorGDM: "Prior GDM",
};

const EMPTY_RISK: Record<string, boolean> = {
  firstDegreeRelative: false, highRiskEthnicity: false, cvdHistory: false,
  hypertension: false, dyslipidemia: false, pcos: false,
  physicalInactivity: false, insulinResistanceSigns: false,
  priorPrediabetes: false, priorGDM: false,
};

export default function T2dScreening({ data, onData }: T2dScreeningProps) {
  const { readings, add, remove } = useSyncedReadings(data, onData);
  const [adding, setAdding] = useState(false);
  const [formAge, setFormAge] = useState("");
  const [formBmi, setFormBmi] = useState("");
  const [formEthnicity, setFormEthnicity] = useState("");
  const [formRisk, setFormRisk] = useState({ ...EMPTY_RISK });
  const { containerRef, isNarrow } = useContainerNarrow();
  const [view, setView] = useState<"latest" | "history">("latest");
  const latest = readings[readings.length - 1] ?? null;

  const handleAdd = () => {
    add({
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      age: formAge,
      bmi: formBmi,
      ethnicity: formEthnicity,
      riskFactors: formRisk as T2dScreeningReading["riskFactors"],
    });
    setFormAge("");
    setFormBmi("");
    setFormEthnicity("");
    setFormRisk({ ...EMPTY_RISK });
    setAdding(false);
  };

  return (
    <div className="space-y-2">
      <div className="border border-border rounded-sm p-2" ref={containerRef}>
        <div className="flex items-center justify-between -mx-2 -mt-2 mb-1 px-2 py-1.5 bg-secondary rounded-t-sm">
          <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">T2D Screening</h3>
          <div className="flex items-center gap-1">
            {isNarrow && readings.length > 0 && latest && <ViewToggle view={view} onViewChange={setView} />}
            {!adding && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAdding(true)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {latest ? (() => {
          const result = getT2DScreeningRecommendation(latest.age, latest.bmi, latest.ethnicity, latest.riskFactors);
          return (
            <div className={isNarrow ? "" : "flex flex-row gap-3"}>
              {(!isNarrow || view === "latest") && (
                <div className="shrink-0 space-y-1.5">
                  <div className={`px-2 py-1 rounded-sm ${severityBg(result.severity)}`}>
                    <span className="text-sm font-heading font-bold">{result.action}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Interval:</span> {result.interval}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Risk factors:</span> {result.riskFactorCount} of {Object.keys(RISK_FACTOR_LABELS).length}
                  </div>
                  {/* Show active risk factors */}
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(latest.riskFactors).filter(([, v]) => v).map(([k]) => (
                      <Badge key={k} variant="outline" className="text-xs px-1 py-0">{RISK_FACTOR_LABELS[k] ?? k}</Badge>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    BMI {latest.bmi || "—"} · Age {latest.age || "—"}
                    {latest.ethnicity && ` · ${latest.ethnicity}`}
                  </div>
                </div>
              )}
              {readings.length > 0 && (!isNarrow || view === "history") && (
                <div className={`flex-1 min-w-0 ${!isNarrow ? "border-l pl-3 border-border/30" : ""}`}>
                  {!isNarrow && <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground mb-1">History</h3>}
                  <HistoryTable readings={readings} onRemove={remove} cols={[
                    { label: "Action", render: (r) => { const s = getT2DScreeningRecommendation(r.age, r.bmi, r.ethnicity, r.riskFactors); return <Badge className={`text-xs px-1 py-0 ${severityBg(s.severity)}`}>{s.action}</Badge>; }, align: "left" as const },
                    { label: "BMI", render: (r) => <span>{r.bmi || "—"}</span> },
                    { label: "Risks", render: (r) => <span>{Object.values(r.riskFactors).filter(Boolean).length}</span> },
                  ]} />
                </div>
              )}
            </div>
          );
        })() : (
          <div className="text-xs text-muted-foreground text-center py-2">No T2D screening assessments.</div>
        )}
      </div>

      {adding && (
        <div className="border border-border rounded-sm p-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">Add screening assessment</h3>
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleAdd} disabled={!formAge && !formBmi}>
                <Check className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setAdding(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            <div>
              <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none">Age</Label>
              <Input value={formAge} onChange={(e) => setFormAge(e.target.value)} placeholder="45" className="h-6 text-xs" />
            </div>
            <div>
              <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none">BMI</Label>
              <Input value={formBmi} onChange={(e) => setFormBmi(e.target.value)} placeholder="28" className="h-6 text-xs" />
            </div>
            <div>
              <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none">Ethnicity</Label>
              <Input value={formEthnicity} onChange={(e) => setFormEthnicity(e.target.value)} placeholder="e.g. Asian" className="h-6 text-xs" />
            </div>
          </div>
          <div className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground mb-1">Risk Factors</div>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(RISK_FACTOR_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1">
                <Checkbox
                  checked={formRisk[key]}
                  onCheckedChange={(c) => setFormRisk((p) => ({ ...p, [key]: !!c }))}
                  id={`rf-${key}`}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor={`rf-${key}`} className="text-xs cursor-pointer">{label}</Label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

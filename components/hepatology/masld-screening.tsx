/**
 * MASLD/MASH Screening — ADA Standards of Care 2026 Ch. 4 algorithm.
 * FIB-4 → LSM/ELF → referral, with stage-based treatment recommendations.
 * @props data? — MasldScreeningReading[], onData? — callback on change
 */
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Check, X } from "lucide-react";
import type { MasldScreeningReading } from "./types/interfaces";
import { calculateFIB4, getMASLDRiskStratification, getMASLDTreatmentRecommendation, countRiskFactors } from "./lib";
import { useSyncedReadings, useContainerNarrow, ViewToggle, severityBg, HistoryTable } from "./ui-helpers";

export interface MasldScreeningProps {
  data?: MasldScreeningReading[];
  onData?: (data: MasldScreeningReading[]) => void;
}

const RISK_FACTOR_LABELS: Record<string, string> = {
  t2diabetes: "Type 2 diabetes",
  prediabetes: "Prediabetes",
  obesity: "Obesity (BMI ≥30)",
  overweightWithCVRisk: "Overweight + CV risk",
  elevatedTransaminases: "Elevated transaminases",
  hepaticSteatosis: "Hepatic steatosis",
};

const EMPTY_RISK: Record<string, boolean> = {
  t2diabetes: false, prediabetes: false, obesity: false,
  overweightWithCVRisk: false, elevatedTransaminases: false, hepaticSteatosis: false,
};

export default function MasldScreening({ data, onData }: MasldScreeningProps) {
  const { readings, add, remove } = useSyncedReadings(data, onData);
  const [adding, setAdding] = useState(false);
  const [formAge, setFormAge] = useState("");
  const [formAst, setFormAst] = useState("");
  const [formAlt, setFormAlt] = useState("");
  const [formPlatelets, setFormPlatelets] = useState("");
  const [formLsm, setFormLsm] = useState("");
  const [formElf, setFormElf] = useState("");
  const [formRisk, setFormRisk] = useState({ ...EMPTY_RISK });
  const { containerRef, isNarrow } = useContainerNarrow();
  const [view, setView] = useState<"latest" | "history">("latest");
  const latest = readings[readings.length - 1] ?? null;

  const handleAdd = () => {
    add({
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      age: formAge,
      ast: formAst,
      alt: formAlt,
      platelets: formPlatelets,
      lsm: formLsm,
      elf: formElf,
      riskFactors: formRisk as MasldScreeningReading["riskFactors"],
    });
    setFormAge(""); setFormAst(""); setFormAlt(""); setFormPlatelets("");
    setFormLsm(""); setFormElf("");
    setFormRisk({ ...EMPTY_RISK });
    setAdding(false);
  };

  return (
    <div className="space-y-2">
      <div className="border border-border rounded-sm p-2" ref={containerRef}>
        <div className="flex items-center justify-between -mx-2 -mt-2 mb-1 px-2 py-1.5 bg-secondary rounded-t-sm">
          <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">MASLD / MASH Screening</h3>
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
          const fib4 = calculateFIB4(latest.age, latest.ast, latest.alt, latest.platelets);
          const risk = getMASLDRiskStratification(fib4.score, fib4.tier, latest.age, latest.lsm, latest.elf);
          const treatment = getMASLDTreatmentRecommendation(risk.referral, risk.severity);
          const rfCount = countRiskFactors(latest.riskFactors);
          return (
            <div className={isNarrow ? "" : "flex flex-row gap-3"}>
              {(!isNarrow || view === "latest") && (
                <div className="shrink-0 space-y-1.5">
                  {/* FIB-4 score */}
                  <div className={`px-2 py-1 rounded-sm ${severityBg(fib4.severity)}`}>
                    <span className="text-sm font-heading font-bold">FIB-4: {fib4.score}</span>
                    <span className="text-xs ml-1.5 opacity-80">({fib4.tier})</span>
                  </div>
                  {/* Risk stage */}
                  <div className={`px-2 py-1 rounded-sm ${severityBg(risk.severity)}`}>
                    <span className="text-xs font-heading font-bold">{risk.stage}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Action:</span> {risk.action}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Interval:</span> {risk.interval}
                  </div>
                  {/* Treatment recommendations for warning/critical */}
                  {(risk.severity === "warning" || risk.severity === "critical") && (
                    <div className="border border-border/40 rounded-sm p-1.5 space-y-0.5">
                      <div className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground">Treatment</div>
                      <div className="text-xs"><span className="font-medium">Obesity:</span> {treatment.obesity}</div>
                      <div className="text-xs"><span className="font-medium">Diabetes:</span> {treatment.diabetes}</div>
                      <div className="text-xs"><span className="font-medium">MASH:</span> {treatment.mash}</div>
                    </div>
                  )}
                  {/* Risk factors */}
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Risk factors:</span> {rfCount} of {Object.keys(RISK_FACTOR_LABELS).length}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(latest.riskFactors).filter(([, v]) => v).map(([k]) => (
                      <Badge key={k} variant="outline" className="text-xs px-1 py-0">{RISK_FACTOR_LABELS[k] ?? k}</Badge>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Age {latest.age || "—"} · AST {latest.ast || "—"} · ALT {latest.alt || "—"} · Plt {latest.platelets || "—"}
                    {latest.lsm && ` · LSM ${latest.lsm} kPa`}
                    {latest.elf && ` · ELF ${latest.elf}`}
                  </div>
                </div>
              )}
              {readings.length > 0 && (!isNarrow || view === "history") && (
                <div className={`flex-1 min-w-0 ${!isNarrow ? "border-l pl-3 border-border/30" : ""}`}>
                  {!isNarrow && <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground mb-1">History</h3>}
                  <HistoryTable readings={readings} onRemove={remove} cols={[
                    { label: "FIB-4", render: (r) => { const f = calculateFIB4(r.age, r.ast, r.alt, r.platelets); return <span>{f.score}</span>; } },
                    { label: "Stage", render: (r) => { const f = calculateFIB4(r.age, r.ast, r.alt, r.platelets); const s = getMASLDRiskStratification(f.score, f.tier, r.age, r.lsm, r.elf); return <Badge className={`text-xs px-1 py-0 ${severityBg(s.severity)}`}>{s.stage}</Badge>; }, align: "left" as const },
                    { label: "Risks", render: (r) => <span>{countRiskFactors(r.riskFactors)}</span> },
                  ]} />
                </div>
              )}
            </div>
          );
        })() : (
          <div className="text-xs text-muted-foreground text-center py-2">No MASLD screening assessments.</div>
        )}
      </div>

      {adding && (
        <div className="border border-border rounded-sm p-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">Add screening assessment</h3>
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleAdd} disabled={!formAge || !formAst || !formAlt || !formPlatelets}>
                <Check className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setAdding(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
            <div>
              <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none">Age</Label>
              <Input value={formAge} onChange={(e) => setFormAge(e.target.value)} placeholder="50" className="h-6 text-xs" />
            </div>
            <div>
              <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none">AST (U/L)</Label>
              <Input value={formAst} onChange={(e) => setFormAst(e.target.value)} placeholder="40" className="h-6 text-xs" />
            </div>
            <div>
              <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none">ALT (U/L)</Label>
              <Input value={formAlt} onChange={(e) => setFormAlt(e.target.value)} placeholder="35" className="h-6 text-xs" />
            </div>
            <div>
              <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none">Platelets</Label>
              <Input value={formPlatelets} onChange={(e) => setFormPlatelets(e.target.value)} placeholder="200" className="h-6 text-xs" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            <div>
              <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none">LSM (kPa)</Label>
              <Input value={formLsm} onChange={(e) => setFormLsm(e.target.value)} placeholder="optional" className="h-6 text-xs" />
            </div>
            <div>
              <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none">ELF score</Label>
              <Input value={formElf} onChange={(e) => setFormElf(e.target.value)} placeholder="optional" className="h-6 text-xs" />
            </div>
          </div>
          <div className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground mb-1">Risk Factors</div>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(RISK_FACTOR_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1">
                <Checkbox
                  checked={formRisk[key]}
                  onCheckedChange={(c) => setFormRisk((p) => ({ ...p, [key]: !!c }))}
                  id={`masld-rf-${key}`}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor={`masld-rf-${key}`} className="text-xs cursor-pointer">{label}</Label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

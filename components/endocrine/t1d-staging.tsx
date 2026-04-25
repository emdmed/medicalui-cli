/**
 * T1D Staging — Autoantibody-based T1D staging per ADA Section 2.
 * @props data? — T1dStagingReading[], onData? — callback on change
 */
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { T1dStagingReading } from "./types/interfaces";
import { classifyT1DStage } from "./lib";
import {
  useSyncedReadings, ValueGrid, useAddForm, AddFormTrigger, AddForm,
  HistoryTable, V, useContainerNarrow, ViewToggle, severityBg,
} from "./ui-helpers";

export interface T1dStagingProps {
  data?: T1dStagingReading[];
  onData?: (data: T1dStagingReading[]) => void;
}

const FIELDS = [
  ["Ab count", "autoantibodyCount", "2"],
  ["FPG (mg/dL)", "fpg", "95"],
  ["2h-PG (mg/dL)", "twohPG", "140"],
  ["A1C (%)", "a1c", "5.7"],
] as const;

type FK = (typeof FIELDS)[number][1];
const EMPTY: Record<FK, string> = { autoantibodyCount: "", fpg: "", twohPG: "", a1c: "" };

function countAbs(r: T1dStagingReading): string[] {
  const abs: string[] = [];
  if (r.gad65) abs.push("GAD65");
  if (r.ia2) abs.push("IA-2");
  if (r.znt8) abs.push("ZnT8");
  if (r.insulinAb) abs.push("IAA");
  return abs;
}

export default function T1dStaging({ data, onData }: T1dStagingProps) {
  const { readings, add, remove } = useSyncedReadings(data, onData);
  const [form, setForm] = useState({ ...EMPTY });
  const [formAbs, setFormAbs] = useState({ gad65: false, ia2: false, znt8: false, insulinAb: false });
  const [formSymptoms, setFormSymptoms] = useState(false);
  const addForm = useAddForm();
  const { containerRef, isNarrow } = useContainerNarrow();
  const [view, setView] = useState<"latest" | "history">("latest");
  const latest = readings[readings.length - 1] ?? null;

  const handleAdd = () => {
    const abCount = [formAbs.gad65, formAbs.ia2, formAbs.znt8, formAbs.insulinAb].filter(Boolean).length;
    add({
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      autoantibodyCount: form.autoantibodyCount || String(abCount),
      ...formAbs,
      fpg: form.fpg,
      twohPG: form.twohPG,
      a1c: form.a1c,
      hasSymptoms: formSymptoms,
    });
    setForm({ ...EMPTY });
    setFormAbs({ gad65: false, ia2: false, znt8: false, insulinAb: false });
    setFormSymptoms(false);
  };

  return (
    <div className="space-y-2">
      <div className="border border-border rounded-sm p-2" ref={containerRef}>
        <div className="flex items-center justify-between -mx-2 -mt-2 mb-1 px-2 py-1.5 bg-secondary rounded-t-sm">
          <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">T1D Staging</h3>
          <div className="flex items-center gap-1">
            {isNarrow && readings.length > 0 && latest && <ViewToggle view={view} onViewChange={setView} />}
            {!addForm.adding && <AddFormTrigger onClick={addForm.open} />}
          </div>
        </div>

        {latest ? (() => {
          const staging = classifyT1DStage(latest.autoantibodyCount, latest.fpg, latest.twohPG, latest.a1c, latest.hasSymptoms);
          const abs = countAbs(latest);
          return (
            <div className={isNarrow ? "" : "flex flex-row gap-3"}>
              {(!isNarrow || view === "latest") && (
                <div className="shrink-0 space-y-1.5">
                  {/* Stage badge */}
                  <div className={`px-2 py-1 rounded-sm ${severityBg(staging.severity)}`}>
                    <span className="text-sm font-heading font-bold">{staging.label}</span>
                  </div>
                  {/* Autoantibodies */}
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Autoantibodies:</span> {abs.length > 0 ? abs.join(", ") : `${latest.autoantibodyCount} detected`}
                  </div>
                  {/* Glycemia values */}
                  <ValueGrid items={[
                    { label: "FPG", value: latest.fpg, unit: "mg/dL", cls: latest.fpg ? { label: parseFloat(latest.fpg) >= 126 ? "High" : parseFloat(latest.fpg) >= 100 ? "IFG" : "Normal", severity: parseFloat(latest.fpg) >= 126 ? "critical" : parseFloat(latest.fpg) >= 100 ? "warning" : "normal" } : { label: "", severity: "normal" as const } },
                    { label: "2h-PG", value: latest.twohPG, unit: "mg/dL", cls: latest.twohPG ? { label: parseFloat(latest.twohPG) >= 200 ? "High" : parseFloat(latest.twohPG) >= 140 ? "IGT" : "Normal", severity: parseFloat(latest.twohPG) >= 200 ? "critical" : parseFloat(latest.twohPG) >= 140 ? "warning" : "normal" } : { label: "", severity: "normal" as const } },
                    { label: "A1C", value: latest.a1c, unit: "%", cls: latest.a1c ? { label: parseFloat(latest.a1c) >= 6.5 ? "High" : parseFloat(latest.a1c) >= 5.7 ? "Pre" : "Normal", severity: parseFloat(latest.a1c) >= 6.5 ? "critical" : parseFloat(latest.a1c) >= 5.7 ? "warning" : "normal" } : { label: "", severity: "normal" as const } },
                  ]} />
                </div>
              )}
              {readings.length > 0 && (!isNarrow || view === "history") && (
                <div className={`flex-1 min-w-0 ${!isNarrow ? "border-l pl-3 border-border/30" : ""}`}>
                  {!isNarrow && <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground mb-1">History</h3>}
                  <HistoryTable readings={readings} onRemove={remove} cols={[
                    { label: "Stage", render: (r) => { const s = classifyT1DStage(r.autoantibodyCount, r.fpg, r.twohPG, r.a1c, r.hasSymptoms); return <Badge className={`text-xs px-1 py-0 ${severityBg(s.severity)}`}>{s.stage || "—"}</Badge>; }, align: "left" as const },
                    { label: "Ab", render: (r) => <span>{r.autoantibodyCount}</span> },
                    { label: "A1C", render: (r) => <span>{r.a1c || "—"}</span> },
                    { label: "FPG", render: (r) => <span>{r.fpg || "—"}</span> },
                  ]} />
                </div>
              )}
            </div>
          );
        })() : (
          <div className="text-xs text-muted-foreground text-center py-2">No T1D staging readings.</div>
        )}
      </div>

      {addForm.adding && (
        <AddForm title="Add T1D staging" fields={FIELDS} form={form} setForm={setForm} onAdd={handleAdd} canAdd={!!form.autoantibodyCount || Object.values(formAbs).some(Boolean)} onClose={addForm.close} gridCols="grid-cols-2 sm:grid-cols-4">
          <div className="col-span-full flex flex-wrap gap-3 mt-1">
            {(["gad65", "ia2", "znt8", "insulinAb"] as const).map((ab) => (
              <div key={ab} className="flex items-center gap-1">
                <Checkbox checked={formAbs[ab]} onCheckedChange={(c) => setFormAbs((p) => ({ ...p, [ab]: !!c }))} id={`ab-${ab}`} className="h-3.5 w-3.5" />
                <Label htmlFor={`ab-${ab}`} className="text-xs cursor-pointer">
                  {ab === "gad65" ? "GAD65" : ab === "ia2" ? "IA-2" : ab === "znt8" ? "ZnT8" : "IAA"}
                </Label>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <Checkbox checked={formSymptoms} onCheckedChange={(c) => setFormSymptoms(!!c)} id="t1d-symptoms" className="h-3.5 w-3.5" />
              <Label htmlFor="t1d-symptoms" className="text-xs cursor-pointer">Symptomatic</Label>
            </div>
          </div>
        </AddForm>
      )}
    </div>
  );
}

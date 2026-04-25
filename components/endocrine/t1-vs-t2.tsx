/**
 * T1vsT2 — Type 1 vs Type 2 Diabetes Classifier using AABBCC mnemonic + C-peptide.
 * @props data? — T1vsT2Reading[], onData? — callback on change
 */
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { T1vsT2Reading } from "./types/interfaces";
import { classifyT1vsT2 } from "./lib";
import {
  useSyncedReadings, useAddForm, AddFormTrigger, AddForm,
  HistoryTable, useContainerNarrow, ViewToggle, severityBg,
} from "./ui-helpers";

export interface T1vsT2Props {
  data?: T1vsT2Reading[];
  onData?: (data: T1vsT2Reading[]) => void;
}

const FIELDS = [
  ["Age", "age", "25"],
  ["BMI", "bmi", "24"],
  ["C-peptide (pmol/L)", "cPeptide", "300"],
] as const;

type FK = (typeof FIELDS)[number][1];
const EMPTY: Record<FK, string> = { age: "", bmi: "", cPeptide: "" };

export default function T1vsT2({ data, onData }: T1vsT2Props) {
  const { readings, add, remove } = useSyncedReadings(data, onData);
  const [form, setForm] = useState({ ...EMPTY });
  const [formBools, setFormBools] = useState({
    hasAutoantibodies: false, familyHxT1D: false, familyHxT2D: false,
    dkaHistory: false, otherAutoimmune: false, onInsulin: false,
  });
  const addForm = useAddForm();
  const { containerRef, isNarrow } = useContainerNarrow();
  const [view, setView] = useState<"latest" | "history">("latest");
  const latest = readings[readings.length - 1] ?? null;

  const handleAdd = () => {
    add({
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      ...form,
      ...formBools,
    });
    setForm({ ...EMPTY });
    setFormBools({ hasAutoantibodies: false, familyHxT1D: false, familyHxT2D: false, dkaHistory: false, otherAutoimmune: false, onInsulin: false });
  };

  return (
    <div className="space-y-2">
      <div className="border border-border rounded-sm p-2" ref={containerRef}>
        <div className="flex items-center justify-between -mx-2 -mt-2 mb-1 px-2 py-1.5 bg-secondary rounded-t-sm">
          <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">T1 vs T2 Classifier</h3>
          <div className="flex items-center gap-1">
            {isNarrow && readings.length > 0 && latest && <ViewToggle view={view} onViewChange={setView} />}
            {!addForm.adding && <AddFormTrigger onClick={addForm.open} />}
          </div>
        </div>

        {latest ? (() => {
          const result = classifyT1vsT2(
            latest.age, latest.bmi, latest.hasAutoantibodies, latest.cPeptide,
            latest.familyHxT1D, latest.familyHxT2D, latest.dkaHistory,
            latest.otherAutoimmune, latest.onInsulin,
          );
          return (
            <div className={isNarrow ? "" : "flex flex-row gap-3"}>
              {(!isNarrow || view === "latest") && (
                <div className="shrink-0 space-y-1.5">
                  <div className={`px-2 py-1 rounded-sm ${severityBg(result.severity)}`}>
                    <span className="text-sm font-heading font-bold">{result.classification}</span>
                  </div>
                  {/* C-peptide */}
                  {latest.cPeptide && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">C-peptide:</span> {latest.cPeptide} pmol/L
                      {parseFloat(latest.cPeptide) < 200 && " → T1D range"}
                      {parseFloat(latest.cPeptide) >= 200 && parseFloat(latest.cPeptide) <= 600 && " → Indeterminate"}
                      {parseFloat(latest.cPeptide) > 600 && " → T2D range"}
                    </div>
                  )}
                  {/* AABBCC features */}
                  <div className="flex flex-wrap gap-1">
                    {result.features.t1.map((f) => (
                      <Badge key={f} variant="outline" className="text-xs px-1 py-0 border-blue-400/60 text-blue-600">{f}</Badge>
                    ))}
                    {result.features.t2.map((f) => (
                      <Badge key={f} variant="outline" className="text-xs px-1 py-0 border-orange-400/60 text-orange-600">{f}</Badge>
                    ))}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    T1 features: {result.features.t1.length} · T2 features: {result.features.t2.length}
                  </div>
                </div>
              )}
              {readings.length > 0 && (!isNarrow || view === "history") && (
                <div className={`flex-1 min-w-0 ${!isNarrow ? "border-l pl-3 border-border/30" : ""}`}>
                  {!isNarrow && <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground mb-1">History</h3>}
                  <HistoryTable readings={readings} onRemove={remove} cols={[
                    { label: "Type", render: (r) => { const s = classifyT1vsT2(r.age, r.bmi, r.hasAutoantibodies, r.cPeptide, r.familyHxT1D, r.familyHxT2D, r.dkaHistory, r.otherAutoimmune, r.onInsulin); return <Badge className={`text-xs px-1 py-0 ${severityBg(s.severity)}`}>{s.classification}</Badge>; }, align: "left" as const },
                    { label: "C-pep", render: (r) => <span>{r.cPeptide || "—"}</span> },
                    { label: "BMI", render: (r) => <span>{r.bmi || "—"}</span> },
                  ]} />
                </div>
              )}
            </div>
          );
        })() : (
          <div className="text-xs text-muted-foreground text-center py-2">No T1 vs T2 readings.</div>
        )}
      </div>

      {addForm.adding && (
        <AddForm title="Add T1 vs T2 assessment" fields={FIELDS} form={form} setForm={setForm} onAdd={handleAdd} canAdd={!!form.age || !!form.cPeptide} onClose={addForm.close} gridCols="grid-cols-3">
          <div className="col-span-full flex flex-wrap gap-3 mt-1">
            {([
              ["hasAutoantibodies", "Ab+"],
              ["familyHxT1D", "Fam T1D"],
              ["familyHxT2D", "Fam T2D"],
              ["dkaHistory", "DKA Hx"],
              ["otherAutoimmune", "Autoimmune"],
              ["onInsulin", "On insulin"],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1">
                <Checkbox checked={formBools[key]} onCheckedChange={(c) => setFormBools((p) => ({ ...p, [key]: !!c }))} id={`t1t2-${key}`} className="h-3.5 w-3.5" />
                <Label htmlFor={`t1t2-${key}`} className="text-xs cursor-pointer">{label}</Label>
              </div>
            ))}
          </div>
        </AddForm>
      )}
    </div>
  );
}

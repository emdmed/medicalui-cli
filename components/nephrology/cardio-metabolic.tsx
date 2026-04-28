/**
 * CardioMetabolic — Cardio-metabolic monitoring for CKD patients.
 * @props data? — CardioMetabolicReading[], onData? — callback on change
 */
"use client";

import { useState } from "react";
import type { CardioMetabolicReading } from "./types/interfaces";
import { classifyLDL, classifyHbA1c, classifyBPInCKD, classifyTriglycerides, classifyLpa, classifyNonHDL, classifyApoB } from "./lib";
import { Trace } from "../base/trace";
import { KDIGO_2021_LIPID, KDIGO_2021_BP } from "../base/sources";
import { useSyncedReadings, ValueGrid, useAddForm, AddFormTrigger, AddForm, HistoryTable, V, useContainerNarrow, ViewToggle } from "./ui-helpers";

export interface CardioMetabolicProps {
  data?: CardioMetabolicReading[];
  onData?: (data: CardioMetabolicReading[]) => void;
  gfrCategory?: string;
  age?: number | null;
  hasDiabetes?: boolean;
  hasPriorCVD?: boolean;
  hasKidneyTransplant?: boolean;
}

const N = { label: "", severity: "normal" as const };

const FIELDS = [
  ["Total Chol. (mg/dL)", "totalCholesterol", "220"],
  ["LDL (mg/dL)", "ldl", "130"],
  ["HDL (mg/dL)", "hdl", "45"],
  ["Triglycerides (mg/dL)", "triglycerides", "150"],
  ["HbA1c (%)", "hba1c", "7.0"],
  ["Glucose (mg/dL)", "glucose", "110"],
  ["SBP (mmHg)", "sbp", "130"],
  ["DBP (mmHg)", "dbp", "80"],
  ["Lp(a) (mg/dL)", "lpa", "25"],
  ["ApoB (mg/dL)", "apoB", "90"],
] as const;

type FK = (typeof FIELDS)[number][1];
const EMPTY: Record<FK, string> = { totalCholesterol: "", ldl: "", hdl: "", triglycerides: "", hba1c: "", glucose: "", sbp: "", dbp: "", lpa: "", apoB: "" };

const GFR_BELOW_60 = ["G3a", "G3b", "G4", "G5"];

export default function CardioMetabolic({ data, onData, gfrCategory, age, hasDiabetes, hasPriorCVD, hasKidneyTransplant }: CardioMetabolicProps) {
  const { readings, add, remove } = useSyncedReadings(data, onData);
  const [form, setForm] = useState({ ...EMPTY });
  const addForm = useAddForm();
  const { containerRef, isNarrow } = useContainerNarrow();
  const [view, setView] = useState<"latest" | "history">("latest");
  const latest = readings[readings.length - 1] ?? null;

  const nonHdl = latest && parseFloat(latest.totalCholesterol) && parseFloat(latest.hdl)
    ? parseFloat(latest.totalCholesterol) - parseFloat(latest.hdl)
    : null;

  // KDIGO statin indication for non-dialysis CKD
  // ≥50 y + eGFR <60 (G3a–G5) → statin indicated regardless of LDL
  // 18–49 y → statin if ≥1 high-risk factor: DM, prior CVD, kidney transplant, or very high CV risk
  const ckdBelow60 = !!(gfrCategory && GFR_BELOW_60.includes(gfrCategory));
  const hasHighRiskFactor = !!(hasDiabetes || hasPriorCVD || hasKidneyTransplant);

  let statinIndication: { indicated: boolean; reason: string } = { indicated: false, reason: "Not indicated" };
  if (age && age >= 50 && ckdBelow60) {
    statinIndication = { indicated: true, reason: "≥50 y + eGFR <60 (KDIGO)" };
  } else if (age && age >= 18 && age < 50 && hasHighRiskFactor) {
    const factors = [hasDiabetes && "DM", hasPriorCVD && "CVD", hasKidneyTransplant && "Tx"].filter(Boolean).join(", ");
    statinIndication = { indicated: true, reason: `18–49 y + risk factor (${factors})` };
  }

  const handleAdd = () => {
    const t = new Trace();
    if (form.ldl) t.record("classifyLDL", { ldl: form.ldl }, classifyLDL(form.ldl), KDIGO_2021_LIPID);
    if (form.hba1c) t.record("classifyHbA1c", { hba1c: form.hba1c }, classifyHbA1c(form.hba1c), KDIGO_2021_LIPID);
    if (form.sbp || form.dbp) t.record("classifyBPInCKD", { sbp: form.sbp, dbp: form.dbp }, classifyBPInCKD(form.sbp, form.dbp), KDIGO_2021_BP);
    if (form.triglycerides) t.record("classifyTriglycerides", { triglycerides: form.triglycerides }, classifyTriglycerides(form.triglycerides), KDIGO_2021_LIPID);
    if (form.lpa) t.record("classifyLpa", { lpa: form.lpa }, classifyLpa(form.lpa), KDIGO_2021_LIPID);
    if (form.apoB) t.record("classifyApoB", { apoB: form.apoB }, classifyApoB(form.apoB), KDIGO_2021_LIPID);
    const tc = parseFloat(form.totalCholesterol);
    const hdlVal = parseFloat(form.hdl);
    if (tc && hdlVal) {
      const nonHdlVal = tc - hdlVal;
      t.record("classifyNonHDL", { nonHdl: nonHdlVal }, classifyNonHDL(nonHdlVal), KDIGO_2021_LIPID);
    }
    add({ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), ...form, trace: t.toJSON() });
    setForm({ ...EMPTY });
  };

  return (
    <div className="space-y-2">
      <div className="border border-border rounded-sm p-2" ref={containerRef}>
        <div className="flex items-center justify-between -mx-2 -mt-2 mb-1 px-2 py-1.5 bg-secondary rounded-t-sm">
          <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">Cardio-metabolic</h3>
          <div className="flex items-center gap-1">
            {isNarrow && readings.length > 0 && latest && <ViewToggle view={view} onViewChange={setView} />}
            {!addForm.adding && <AddFormTrigger onClick={addForm.open} />}
          </div>
        </div>
        {latest ? (
          <div className={isNarrow ? "" : "flex flex-row gap-3"}>
            {(!isNarrow || view === "latest") && (
              <div className="shrink-0 space-y-2">
                <ValueGrid items={[
                  { label: "LDL", value: latest.ldl, unit: "mg/dL", cls: classifyLDL(latest.ldl) },
                  { label: "HbA1c", value: latest.hba1c, unit: "%", cls: classifyHbA1c(latest.hba1c) },
                  { label: "BP", value: `${latest.sbp}/${latest.dbp}`, unit: "mmHg", cls: classifyBPInCKD(latest.sbp, latest.dbp) },
                  { label: "Triglycerides", value: latest.triglycerides, unit: "mg/dL", cls: classifyTriglycerides(latest.triglycerides) },
                  { label: "Total Chol.", value: latest.totalCholesterol, unit: "mg/dL", cls: N },
                  { label: "HDL", value: latest.hdl, unit: "mg/dL", cls: N },
                  { label: "Non-HDL", value: nonHdl ? String(Math.round(nonHdl)) : "—", unit: "mg/dL", cls: nonHdl ? classifyNonHDL(nonHdl) : N },
                  { label: "Lp(a)", value: latest.lpa, unit: "mg/dL", cls: classifyLpa(latest.lpa) },
                  { label: "ApoB", value: latest.apoB, unit: "mg/dL", cls: classifyApoB(latest.apoB) },
                  { label: "Glucose", value: latest.glucose, unit: "mg/dL", cls: N },
                ]} />
                <div className={`mt-1.5 px-2 py-1 rounded-sm text-[11px] ${statinIndication.indicated ? "severity-normal" : "bg-muted/50"}`}>
                  <span className="font-medium">Statin: </span>
                  {statinIndication.indicated
                    ? <span className="severity-normal-text">Suggested</span>
                    : <span className="text-muted-foreground">Not suggested</span>}
                  {statinIndication.reason && statinIndication.indicated && (
                    <span className="text-muted-foreground ml-1">— {statinIndication.reason}</span>
                  )}
                </div>
              </div>
            )}
            {readings.length > 0 && (!isNarrow || view === "history") && (
              <div className={`flex-1 min-w-0 ${!isNarrow ? "border-l pl-3 border-border/30" : ""}`}>
                {!isNarrow && <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground mb-1">History</h3>}
                <HistoryTable readings={readings} onRemove={remove} cols={[
                  { label: "LDL", render: (r) => <V v={r.ldl} s={classifyLDL(r.ldl).severity} /> },
                  { label: "HDL", render: (r) => <span className="opacity-70">{r.hdl || "—"}</span> },
                  { label: "TG", render: (r) => <V v={r.triglycerides} s={classifyTriglycerides(r.triglycerides).severity} /> },
                  { label: "Col.T", render: (r) => <span className="opacity-70">{r.totalCholesterol || "—"}</span> },
                  { label: "Non-HDL", render: (r) => {
                    const tc = parseFloat(r.totalCholesterol);
                    const h = parseFloat(r.hdl);
                    const nh = tc && h ? tc - h : null;
                    return nh ? <V v={String(Math.round(nh))} s={classifyNonHDL(nh).severity} /> : <span className="opacity-70">—</span>;
                  }},
                  { label: "Lp(a)", render: (r) => <V v={r.lpa} s={classifyLpa(r.lpa).severity} /> },
                  { label: "ApoB", render: (r) => <V v={r.apoB} s={classifyApoB(r.apoB).severity} /> },
                  { label: "HbA1c", render: (r) => <V v={r.hba1c} s={classifyHbA1c(r.hba1c).severity} /> },
                  { label: "Gluc", render: (r) => <span className="opacity-70">{r.glucose || "—"}</span> },
                  { label: "BP", render: (r) => <V v={r.sbp && r.dbp ? `${r.sbp}/${r.dbp}` : "—"} s={classifyBPInCKD(r.sbp, r.dbp).severity} /> },
                ]} />
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-2">No cardio-metabolic readings.</div>
        )}
      </div>
      {addForm.adding && (
        <AddForm title="Add cardio-metabolic reading" fields={FIELDS} form={form} setForm={setForm} onAdd={handleAdd} canAdd={!!(form.ldl || form.hba1c || form.sbp)} onClose={addForm.close} />
      )}
    </div>
  );
}

/**
 * PhosphoCalcic — Phospho-calcic metabolism monitoring for CKD patients.
 * @props data? — PhosphoCalcicReading[], onData? — callback, gfrCategory? — for PTH targets
 */
"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { PhosphoCalcicReading } from "./types/interfaces";
import { calculateCaPhProduct, calculateCorrectedCalcium, classifyCalcium, classifyPhosphorus, classifyPTH, classifyVitaminD, classifyCaPhProduct, getPhosphateRecommendation, getPTHRecommendation, getVitaminDRecommendation, getCKDMBDMonitoring } from "./lib";
import { Trace } from "../base/trace";
import { KDIGO_CKD_MBD_2017 } from "../base/sources";
import { useSyncedReadings, ValueGrid, useAddForm, AddFormTrigger, AddForm, HistoryTable, V, severityBg, useContainerNarrow, ViewToggle } from "./ui-helpers";

export interface PhosphoCalcicProps {
  data?: PhosphoCalcicReading[];
  onData?: (data: PhosphoCalcicReading[]) => void;
  gfrCategory?: string;
}

const N = { label: "", severity: "normal" as const };

const FIELDS = [
  ["Calcium (mg/dL)", "calcium", "9.0"],
  ["Phosphorus (mg/dL)", "phosphorus", "4.0"],
  ["PTH (pg/mL)", "pth", "65"],
  ["Vitamin D (ng/mL)", "vitaminD", "30"],
  ["Albumin (g/dL)", "albumin", "3.8"],
] as const;

type FK = (typeof FIELDS)[number][1];
const EMPTY: Record<FK, string> = { calcium: "", phosphorus: "", pth: "", vitaminD: "", albumin: "" };

function collectRecommendations(r: PhosphoCalcicReading, gfrCategory?: string) {
  const recs: { param: string; text: string }[] = [];
  const phos = getPhosphateRecommendation(r.phosphorus, gfrCategory);
  if (phos.status !== "normal" && phos.status !== "unknown") {
    recs.push({ param: "Phosphate", text: phos.recommendation });
  }
  const pth = getPTHRecommendation(r.pth, gfrCategory);
  if (pth.status !== "normal" && pth.status !== "acceptable" && pth.status !== "unknown") {
    recs.push({ param: "PTH", text: pth.recommendation });
  }
  const vd = getVitaminDRecommendation(r.vitaminD);
  if (vd.status !== "sufficient" && vd.status !== "unknown") {
    recs.push({ param: "Vitamin D", text: vd.recommendation });
  }
  return recs;
}

export default function PhosphoCalcic({ data, onData, gfrCategory }: PhosphoCalcicProps) {
  const { readings, add, remove } = useSyncedReadings(data, onData);
  const [form, setForm] = useState({ ...EMPTY });
  const addForm = useAddForm();
  const { containerRef, isNarrow } = useContainerNarrow();
  const [view, setView] = useState<"latest" | "history">("latest");
  const latest = readings[readings.length - 1] ?? null;

  const handleAdd = () => {
    const t = new Trace();
    if (form.calcium) t.record("classifyCalcium", { calcium: form.calcium }, classifyCalcium(form.calcium), KDIGO_CKD_MBD_2017);
    if (form.phosphorus) t.record("classifyPhosphorus", { phosphorus: form.phosphorus }, classifyPhosphorus(form.phosphorus), KDIGO_CKD_MBD_2017);
    if (form.pth) t.record("classifyPTH", { pth: form.pth, gfrCategory: gfrCategory ?? "" }, classifyPTH(form.pth, gfrCategory), KDIGO_CKD_MBD_2017);
    if (form.vitaminD) t.record("classifyVitaminD", { vitaminD: form.vitaminD }, classifyVitaminD(form.vitaminD), KDIGO_CKD_MBD_2017);
    if (form.calcium && form.phosphorus) {
      const product = calculateCaPhProduct(form.calcium, form.phosphorus);
      t.record("calculateCaPhProduct", { calcium: form.calcium, phosphorus: form.phosphorus }, product, KDIGO_CKD_MBD_2017);
      if (product !== null) t.record("classifyCaPhProduct", { product }, classifyCaPhProduct(product), KDIGO_CKD_MBD_2017);
    }
    if (form.calcium && form.albumin) {
      t.record("calculateCorrectedCalcium", { calcium: form.calcium, albumin: form.albumin }, calculateCorrectedCalcium(form.calcium, form.albumin), KDIGO_CKD_MBD_2017);
    }
    add({ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), ...form, trace: t.toJSON() });
    setForm({ ...EMPTY });
  };

  const caph = (r: PhosphoCalcicReading) => calculateCaPhProduct(r.calcium, r.phosphorus);
  const caphCls = (p: number | null) => p !== null ? classifyCaPhProduct(p) : null;

  const monitoring = gfrCategory ? getCKDMBDMonitoring(gfrCategory) : null;

  return (
    <div className="space-y-2">
      <div className="border border-border rounded-sm p-2" ref={containerRef}>
        <div className="flex items-center justify-between -mx-2 -mt-2 mb-1 px-2 py-1.5 bg-secondary rounded-t-sm">
          <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">Phospho-calcic</h3>
          <div className="flex items-center gap-1">
            {isNarrow && readings.length > 0 && latest && <ViewToggle view={view} onViewChange={setView} />}
            {!addForm.adding && <AddFormTrigger onClick={addForm.open} />}
          </div>
        </div>
        {latest ? (() => {
          const prod = caph(latest);
          const prodCls = caphCls(prod);
          const corrCa = calculateCorrectedCalcium(latest.calcium, latest.albumin);
          const recs = collectRecommendations(latest, gfrCategory);
          return (
            <div className={isNarrow ? "" : "flex flex-row gap-3"}>
              {(!isNarrow || view === "latest") && (
                <div className="shrink-0">
                  <ValueGrid items={[
                    { label: "Calcium", value: latest.calcium, unit: "mg/dL", cls: classifyCalcium(latest.calcium) },
                    { label: "Phosphorus", value: latest.phosphorus, unit: "mg/dL", cls: classifyPhosphorus(latest.phosphorus) },
                    { label: "PTH", value: latest.pth, unit: "pg/mL", cls: classifyPTH(latest.pth, gfrCategory) },
                    { label: "Vitamin D", value: latest.vitaminD, unit: "ng/mL", cls: classifyVitaminD(latest.vitaminD) },
                    { label: "Albumin", value: latest.albumin, unit: "g/dL", cls: N },
                    ...(prod !== null ? [{ label: "Ca×P", value: String(prod), unit: "mg²/dL²", cls: prodCls ?? N }] : []),
                    ...(corrCa !== null ? [{ label: "Corrected Ca", value: String(corrCa), unit: "mg/dL", cls: N }] : []),
                  ]} />
                  {recs.length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      {recs.map((rec) => (
                        <div key={rec.param} className="px-2 py-1 rounded-sm text-[11px] severity-watch">
                          <span className="font-medium">{rec.param}: </span>
                          <span className="severity-watch-text">{rec.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {readings.length > 0 && (!isNarrow || view === "history") && (
                <div className={`flex-1 min-w-0 ${!isNarrow ? "border-l pl-3 border-border/30" : ""}`}>
                  {!isNarrow && <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground mb-1">History</h3>}
                  <HistoryTable readings={readings} onRemove={remove} cols={[
                    { label: "Ca", render: (r) => <V v={r.calcium} s={classifyCalcium(r.calcium).severity} /> },
                    { label: "P", render: (r) => <V v={r.phosphorus} s={classifyPhosphorus(r.phosphorus).severity} /> },
                    { label: "Ca×P", render: (r) => { const p = caph(r); const c = caphCls(p); return p !== null ? <V v={String(p)} s={c?.severity ?? "normal"} /> : <>—</>; } },
                    { label: "PTH", render: (r) => <V v={r.pth} s={classifyPTH(r.pth, gfrCategory).severity} /> },
                    { label: "Vit D", render: (r) => <V v={r.vitaminD} s={classifyVitaminD(r.vitaminD).severity} /> },
                    { label: "Alb", render: (r) => <span className="opacity-70">{r.albumin || "—"}</span> },
                  ]} />
                </div>
              )}
            </div>
          );
        })() : (
          <div className="text-xs text-muted-foreground text-center py-2">No phospho-calcic readings.</div>
        )}
      </div>
      {addForm.adding && (
        <AddForm title="Add phospho-calcic reading" fields={FIELDS} form={form} setForm={setForm} onAdd={handleAdd} canAdd={!!(form.calcium || form.phosphorus || form.pth)} onClose={addForm.close} gridCols="grid-cols-2 sm:grid-cols-3" />
      )}
    </div>
  );
}

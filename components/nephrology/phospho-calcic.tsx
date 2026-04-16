/**
 * PhosphoCalcic — Phospho-calcic metabolism monitoring for CKD patients.
 * @props data? — PhosphoCalcicReading[], onData? — callback, gfrCategory? — for PTH targets
 */
"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PhosphoCalcicReading } from "./types/interfaces";
import { calculateCaPhProduct, calculateCorrectedCalcium, classifyCalcium, classifyPhosphorus, classifyPTH, classifyVitaminD, classifyCaPhProduct } from "./lib";
import { useSyncedReadings, ValueGrid, AddForm, HistoryTable, V, severityBg } from "./ui-helpers";

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

export default function PhosphoCalcic({ data, onData, gfrCategory }: PhosphoCalcicProps) {
  const { readings, add, remove } = useSyncedReadings(data, onData);
  const [form, setForm] = useState({ ...EMPTY });
  const latest = readings[readings.length - 1] ?? null;

  const handleAdd = () => {
    add({ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), ...form });
    setForm({ ...EMPTY });
  };

  const caph = (r: PhosphoCalcicReading) => calculateCaPhProduct(r.calcium, r.phosphorus);
  const caphCls = (p: number | null) => p !== null ? classifyCaPhProduct(p) : null;

  return (
    <div className="space-y-2">
      <Card className="overflow-visible">
        <CardContent className="p-2">
          {latest ? (() => {
            const prod = caph(latest);
            const prodCls = caphCls(prod);
            const corrCa = calculateCorrectedCalcium(latest.calcium, latest.albumin);
            return (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="shrink-0">
                  <h3 className="text-xs font-semibold mb-1">Current values</h3>
                  <ValueGrid items={[
                    { label: "Calcium", value: latest.calcium, unit: "mg/dL", cls: classifyCalcium(latest.calcium) },
                    { label: "Phosphorus", value: latest.phosphorus, unit: "mg/dL", cls: classifyPhosphorus(latest.phosphorus) },
                    { label: "PTH", value: latest.pth, unit: "pg/mL", cls: classifyPTH(latest.pth, gfrCategory) },
                    { label: "Vitamin D", value: latest.vitaminD, unit: "ng/mL", cls: classifyVitaminD(latest.vitaminD) },
                    { label: "Albumin", value: latest.albumin, unit: "g/dL", cls: N },
                    ...(prod !== null ? [{ label: "Ca×P", value: String(prod), unit: "mg²/dL²", cls: prodCls ?? N }] : []),
                    ...(corrCa !== null ? [{ label: "Corrected Ca", value: String(corrCa), unit: "mg/dL", cls: N }] : []),
                  ]} />
                </div>
                {readings.length > 0 && (
                  <div className="flex-1 min-w-0 sm:border-l sm:pl-3 border-border/30">
                    <h3 className="text-xs font-semibold mb-1">History</h3>
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
        </CardContent>
      </Card>
      <AddForm title="Add phospho-calcic reading" fields={FIELDS} form={form} setForm={setForm} onAdd={handleAdd} canAdd={!!(form.calcium || form.phosphorus || form.pth)} gridCols="grid-cols-2 sm:grid-cols-3" />
    </div>
  );
}

/**
 * CardioMetabolic — Cardio-metabolic monitoring for CKD patients.
 * @props data? — CardioMetabolicReading[], onData? — callback on change
 */
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { CardioMetabolicReading } from "./types/interfaces";
import { classifyLDL, classifyHbA1c, classifyBPInCKD, classifyTriglycerides } from "./lib";
import { useSyncedReadings, ValueGrid, AddForm, HistoryTable, V } from "./ui-helpers";

export interface CardioMetabolicProps {
  data?: CardioMetabolicReading[];
  onData?: (data: CardioMetabolicReading[]) => void;
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
] as const;

type FK = (typeof FIELDS)[number][1];
const EMPTY: Record<FK, string> = { totalCholesterol: "", ldl: "", hdl: "", triglycerides: "", hba1c: "", glucose: "", sbp: "", dbp: "" };

export default function CardioMetabolic({ data, onData }: CardioMetabolicProps) {
  const { readings, add, remove } = useSyncedReadings(data, onData);
  const [form, setForm] = useState({ ...EMPTY });
  const latest = readings[readings.length - 1] ?? null;

  const handleAdd = () => {
    add({ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), ...form });
    setForm({ ...EMPTY });
  };

  return (
    <div className="space-y-2">
      <Card className="overflow-visible">
        <CardContent className="p-2">
          {latest ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="shrink-0">
                <h3 className="text-xs font-semibold mb-1">Current values</h3>
                <ValueGrid items={[
                  { label: "LDL", value: latest.ldl, unit: "mg/dL", cls: classifyLDL(latest.ldl) },
                  { label: "HbA1c", value: latest.hba1c, unit: "%", cls: classifyHbA1c(latest.hba1c) },
                  { label: "BP", value: `${latest.sbp}/${latest.dbp}`, unit: "mmHg", cls: classifyBPInCKD(latest.sbp, latest.dbp) },
                  { label: "Triglycerides", value: latest.triglycerides, unit: "mg/dL", cls: classifyTriglycerides(latest.triglycerides) },
                  { label: "Total Chol.", value: latest.totalCholesterol, unit: "mg/dL", cls: N },
                  { label: "HDL", value: latest.hdl, unit: "mg/dL", cls: N },
                  { label: "Glucose", value: latest.glucose, unit: "mg/dL", cls: N },
                ]} />
              </div>
              {readings.length > 0 && (
                <div className="flex-1 min-w-0 sm:border-l sm:pl-3 border-border/30">
                  <h3 className="text-xs font-semibold mb-1">History</h3>
                  <HistoryTable readings={readings} onRemove={remove} cols={[
                    { label: "LDL", render: (r) => <V v={r.ldl} s={classifyLDL(r.ldl).severity} /> },
                    { label: "HDL", render: (r) => <span className="opacity-70">{r.hdl || "—"}</span> },
                    { label: "TG", render: (r) => <V v={r.triglycerides} s={classifyTriglycerides(r.triglycerides).severity} /> },
                    { label: "Col.T", render: (r) => <span className="opacity-70">{r.totalCholesterol || "—"}</span> },
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
        </CardContent>
      </Card>
      <AddForm title="Add cardio-metabolic reading" fields={FIELDS} form={form} setForm={setForm} onAdd={handleAdd} canAdd={!!(form.ldl || form.hba1c || form.sbp)} />
    </div>
  );
}

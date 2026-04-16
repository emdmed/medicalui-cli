/**
 * Anemia — Renal anemia monitoring for CKD patients.
 * @props data? — AnemiaReading[], onData? — callback on change
 */
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { AnemiaReading } from "./types/interfaces";
import { classifyHemoglobin, classifyFerritin, classifyTSAT, needsIronSupplementation } from "./lib";
import { useSyncedReadings, ValueGrid, AddForm, HistoryTable, V } from "./ui-helpers";

export interface AnemiaProps {
  data?: AnemiaReading[];
  onData?: (data: AnemiaReading[]) => void;
}

const N = { label: "", severity: "normal" as const };

const FIELDS = [
  ["Hemoglobin (g/dL)", "hemoglobin", "11.0"],
  ["Ferritin (ng/mL)", "ferritin", "200"],
  ["TSAT (%)", "tsat", "25"],
  ["Serum iron (µg/dL)", "iron", "70"],
  ["Reticulocytes (%)", "reticulocytes", "1.5"],
] as const;

type FK = (typeof FIELDS)[number][1];
const EMPTY: Record<FK, string> = { hemoglobin: "", ferritin: "", tsat: "", iron: "", reticulocytes: "" };

export default function Anemia({ data, onData }: AnemiaProps) {
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
          {latest ? (() => {
            const ironSupp = needsIronSupplementation(latest.ferritin, latest.tsat);
            return (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="shrink-0">
                  <h3 className="text-xs font-semibold mb-1">Current values</h3>
                  <ValueGrid items={[
                    { label: "Hemoglobin", value: latest.hemoglobin, unit: "g/dL", cls: classifyHemoglobin(latest.hemoglobin) },
                    { label: "Ferritin", value: latest.ferritin, unit: "ng/mL", cls: classifyFerritin(latest.ferritin) },
                    { label: "TSAT", value: latest.tsat, unit: "%", cls: classifyTSAT(latest.tsat) },
                    { label: "Serum iron", value: latest.iron, unit: "µg/dL", cls: N },
                    { label: "Reticulocytes", value: latest.reticulocytes, unit: "%", cls: N },
                  ]} />
                  <div className={`mt-1.5 px-2 py-1 rounded text-[10px] ${ironSupp.needed ? "bg-red-50 dark:bg-red-950/30" : "bg-green-50 dark:bg-green-950/30"}`}>
                    <span className="font-medium">Fe: </span>
                    {ironSupp.needed
                      ? <span className="text-red-600 dark:text-red-400">Indicated</span>
                      : <span className="text-green-600 dark:text-green-400">Not needed</span>}
                    {ironSupp.reason && <span className="opacity-60 ml-1">— {ironSupp.reason}</span>}
                  </div>
                </div>
                {readings.length > 0 && (
                  <div className="flex-1 min-w-0 sm:border-l sm:pl-3 border-border/30">
                    <h3 className="text-xs font-semibold mb-1">History</h3>
                    <HistoryTable readings={readings} onRemove={remove} cols={[
                      { label: "Hb", render: (r) => <V v={r.hemoglobin} s={classifyHemoglobin(r.hemoglobin).severity} /> },
                      { label: "Ferritin", render: (r) => <V v={r.ferritin} s={classifyFerritin(r.ferritin).severity} /> },
                      { label: "TSAT", render: (r) => <V v={r.tsat} s={classifyTSAT(r.tsat).severity} /> },
                      { label: "Fe", render: (r) => <span className="opacity-70">{r.iron || "—"}</span> },
                      { label: "Retic", render: (r) => <span className="opacity-70">{r.reticulocytes || "—"}</span> },
                    ]} />
                  </div>
                )}
              </div>
            );
          })() : (
            <div className="text-xs text-muted-foreground text-center py-2">No anemia readings.</div>
          )}
        </CardContent>
      </Card>
      <AddForm title="Add anemia reading" fields={FIELDS} form={form} setForm={setForm} onAdd={handleAdd} canAdd={!!form.hemoglobin} gridCols="grid-cols-2 sm:grid-cols-3" />
    </div>
  );
}

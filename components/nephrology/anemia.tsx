/**
 * Anemia — Renal anemia monitoring for CKD patients.
 * @props data? — AnemiaReading[], onData? — callback on change, sex? — patient sex for thresholds
 */
"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import type { AnemiaReading } from "./types/interfaces";
import { classifyHemoglobin, classifyAnemiaBySex, classifyFerritin, classifyTSAT, needsIronSupplementation, checkESAEligibility } from "./lib";
import { useSyncedReadings, ValueGrid, useAddForm, AddFormTrigger, AddForm, HistoryTable, V } from "./ui-helpers";

export interface AnemiaProps {
  data?: AnemiaReading[];
  onData?: (data: AnemiaReading[]) => void;
  sex?: string;
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

function hbClassification(hb: string, sex?: string) {
  if (sex) return classifyAnemiaBySex(hb, sex);
  return { ...classifyHemoglobin(hb), anemic: false };
}

export default function Anemia({ data, onData, sex: propSex }: AnemiaProps) {
  const { readings, add, remove } = useSyncedReadings(data, onData);
  const [form, setForm] = useState({ ...EMPTY });
  const [formSex, setFormSex] = useState("");
  const addForm = useAddForm();
  const latest = readings[readings.length - 1] ?? null;

  const handleAdd = () => {
    const sexVal = formSex || propSex || undefined;
    add({
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      ...form,
      ...(sexVal ? { sex: sexVal } : {}),
    });
    setForm({ ...EMPTY });
    setFormSex("");
  };

  const getSex = (r: AnemiaReading) => r.sex || propSex;

  return (
    <div className="space-y-2">
      <div className="border border-border rounded-sm p-2">
        <div className="flex items-center justify-between -mx-2 -mt-2 mb-1 px-2 py-1.5 bg-secondary rounded-t-sm">
          <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">Anemia</h3>
          {!addForm.adding && <AddFormTrigger onClick={addForm.open} />}
        </div>
        {latest ? (() => {
          const sex = getSex(latest);
          const ironSupp = needsIronSupplementation(latest.ferritin, latest.tsat);
          const esa = sex && latest.ferritin && latest.tsat
            ? checkESAEligibility(latest.hemoglobin, latest.ferritin, latest.tsat, sex)
            : null;
          return (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="shrink-0">
                <ValueGrid items={[
                  { label: "Hemoglobin", value: latest.hemoglobin, unit: "g/dL", cls: hbClassification(latest.hemoglobin, sex) },
                  { label: "Ferritin", value: latest.ferritin, unit: "ng/mL", cls: classifyFerritin(latest.ferritin) },
                  { label: "TSAT", value: latest.tsat, unit: "%", cls: classifyTSAT(latest.tsat) },
                  { label: "Serum iron", value: latest.iron, unit: "µg/dL", cls: N },
                  { label: "Reticulocytes", value: latest.reticulocytes, unit: "%", cls: N },
                ]} />
                <div className={`mt-1.5 px-2 py-1 rounded-sm text-[11px] ${ironSupp.needed ? "severity-critical" : "severity-normal"}`}>
                  <span className="font-medium">Fe: </span>
                  {ironSupp.needed
                    ? <span className="severity-critical-text">Indicated</span>
                    : <span className="severity-normal-text">Not needed</span>}
                  {ironSupp.reason && <span className="text-muted-foreground ml-1">— {ironSupp.reason}</span>}
                </div>
                {esa && (
                  <div className={`mt-1 px-2 py-1 rounded-sm text-[11px] ${esa.eligible ? "severity-watch" : "bg-muted/50"}`}>
                    <span className="font-medium">ESA: </span>
                    {esa.eligible
                      ? <span className="severity-watch-text">May be considered</span>
                      : <span className="text-muted-foreground">Not indicated</span>}
                    {esa.reason && <span className="text-muted-foreground ml-1">— {esa.reason}</span>}
                  </div>
                )}
              </div>
              {readings.length > 0 && (
                <div className="flex-1 min-w-0 sm:border-l sm:pl-3 border-border/30">
                  <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground mb-1">History</h3>
                  <HistoryTable readings={readings} onRemove={remove} cols={[
                    { label: "Hb", render: (r) => <V v={r.hemoglobin} s={hbClassification(r.hemoglobin, getSex(r)).severity} /> },
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
      </div>
      {addForm.adding && (
        <AddForm title="Add anemia reading" fields={FIELDS} form={form} setForm={setForm} onAdd={handleAdd} canAdd={!!form.hemoglobin} onClose={addForm.close} gridCols="grid-cols-2 sm:grid-cols-3">
          {!propSex && (
            <div>
              <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none">Sex</Label>
              <select value={formSex} onChange={(e) => setFormSex(e.target.value)} className="flex h-6 w-full rounded-sm border-b border-border bg-transparent px-2 text-xs">
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          )}
        </AddForm>
      )}
    </div>
  );
}

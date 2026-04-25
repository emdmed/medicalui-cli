/**
 * GDM Screening — Gestational Diabetes Mellitus screening (One-step IADPSG / Two-step).
 * @props data? — GdmScreeningReading[], onData? — callback on change
 */
"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import type { GdmScreeningReading } from "./types/interfaces";
import { classifyGDM_OneStep, classifyGDM_TwoStep } from "./lib";
import {
  useSyncedReadings, useAddForm, AddFormTrigger,
  useContainerNarrow, ViewToggle, severityBg, HistoryTable,
} from "./ui-helpers";

export interface GdmScreeningProps {
  data?: GdmScreeningReading[];
  onData?: (data: GdmScreeningReading[]) => void;
}

export default function GdmScreening({ data, onData }: GdmScreeningProps) {
  const { readings, add, remove } = useSyncedReadings(data, onData);
  const addForm = useAddForm();
  const [strategy, setStrategy] = useState<"one-step" | "two-step">("one-step");
  const [gestAge, setGestAge] = useState("");
  const [fasting, setFasting] = useState("");
  const [oneHour, setOneHour] = useState("");
  const [twoHour, setTwoHour] = useState("");
  const [threeHour, setThreeHour] = useState("");
  const { containerRef, isNarrow } = useContainerNarrow();
  const [view, setView] = useState<"latest" | "history">("latest");
  const latest = readings[readings.length - 1] ?? null;

  const handleAdd = () => {
    add({
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      strategy,
      gestationalAge: gestAge,
      fasting,
      oneHour,
      twoHour,
      threeHour,
    });
    setFasting("");
    setOneHour("");
    setTwoHour("");
    setThreeHour("");
    setGestAge("");
  };

  function classifyReading(r: GdmScreeningReading) {
    if (r.strategy === "one-step") {
      return classifyGDM_OneStep(r.fasting, r.oneHour, r.twoHour);
    }
    return classifyGDM_TwoStep(r.fasting, r.oneHour, r.twoHour, r.threeHour);
  }

  return (
    <div className="space-y-2">
      <div className="border border-border rounded-sm p-2" ref={containerRef}>
        <div className="flex items-center justify-between -mx-2 -mt-2 mb-1 px-2 py-1.5 bg-secondary rounded-t-sm">
          <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">GDM Screening</h3>
          <div className="flex items-center gap-1">
            {isNarrow && readings.length > 0 && latest && <ViewToggle view={view} onViewChange={setView} />}
            {!addForm.adding && <AddFormTrigger onClick={addForm.open} />}
          </div>
        </div>

        {latest ? (() => {
          const result = classifyReading(latest);
          const severity = result.positive ? "critical" : "normal";
          return (
            <div className={isNarrow ? "" : "flex flex-row gap-3"}>
              {(!isNarrow || view === "latest") && (
                <div className="shrink-0 space-y-1.5">
                  <div className={`px-2 py-1 rounded-sm ${severityBg(severity)}`}>
                    <span className="text-sm font-heading font-bold">
                      GDM {result.positive ? "Positive" : "Negative"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Strategy:</span> {latest.strategy === "one-step" ? "One-step (IADPSG)" : "Two-step (Carpenter-Coustan)"}
                  </div>
                  {latest.gestationalAge && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">GA:</span> {latest.gestationalAge} weeks
                    </div>
                  )}
                  {/* OGTT values */}
                  <div className="inline-grid grid-cols-[auto_auto] gap-x-2 text-xs tabular-nums">
                    {[
                      ["Fasting", latest.fasting],
                      ["1-hr", latest.oneHour],
                      ["2-hr", latest.twoHour],
                      ...(latest.strategy === "two-step" ? [["3-hr", latest.threeHour]] : []),
                    ].map(([label, val]) => (
                      <React.Fragment key={label}>
                        <span className="text-muted-foreground py-0.5">{label}</span>
                        <span className="font-medium py-0.5">{val || "—"} mg/dL</span>
                      </React.Fragment>
                    ))}
                  </div>
                  {/* Exceeded values */}
                  {result.exceededValues.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {result.exceededValues.map((v) => (
                        <Badge key={v} className="text-xs px-1 py-0 severity-critical">{v}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {readings.length > 0 && (!isNarrow || view === "history") && (
                <div className={`flex-1 min-w-0 ${!isNarrow ? "border-l pl-3 border-border/30" : ""}`}>
                  {!isNarrow && <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground mb-1">History</h3>}
                  <HistoryTable readings={readings} onRemove={remove} cols={[
                    { label: "Result", render: (r) => { const s = classifyReading(r); return <Badge className={`text-xs px-1 py-0 ${severityBg(s.positive ? "critical" : "normal")}`}>{s.positive ? "+" : "−"}</Badge>; }, align: "left" as const },
                    { label: "Strategy", render: (r) => <span className="text-[11px]">{r.strategy === "one-step" ? "1-step" : "2-step"}</span>, align: "left" as const },
                    { label: "GA", render: (r) => <span>{r.gestationalAge || "—"}w</span> },
                  ]} />
                </div>
              )}
            </div>
          );
        })() : (
          <div className="text-xs text-muted-foreground text-center py-2">No GDM screening results.</div>
        )}
      </div>

      {addForm.adding && (
        <div className="border border-border rounded-sm p-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">Add GDM screening</h3>
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { handleAdd(); addForm.close(); }} disabled={!fasting && !oneHour && !twoHour}>
                <Check className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={addForm.close}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2 mb-2">
            {(["one-step", "two-step"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStrategy(s)}
                className={`text-xs px-2 py-1 rounded-sm border transition-colors ${strategy === s ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border/60 text-muted-foreground hover:border-primary/40"}`}
              >
                {s === "one-step" ? "One-step (IADPSG)" : "Two-step (C-C)"}
              </button>
            ))}
          </div>
          <div className={`grid ${strategy === "two-step" ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"} gap-1.5`}>
            <div>
              <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none">GA (weeks)</Label>
              <Input value={gestAge} onChange={(e) => setGestAge(e.target.value)} placeholder="26" className="h-6 text-xs" />
            </div>
            <div>
              <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none">Fasting</Label>
              <Input value={fasting} onChange={(e) => setFasting(e.target.value)} placeholder="92" className="h-6 text-xs" />
            </div>
            <div>
              <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none">1-hr</Label>
              <Input value={oneHour} onChange={(e) => setOneHour(e.target.value)} placeholder="180" className="h-6 text-xs" />
            </div>
            <div>
              <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none">2-hr</Label>
              <Input value={twoHour} onChange={(e) => setTwoHour(e.target.value)} placeholder="153" className="h-6 text-xs" />
            </div>
            {strategy === "two-step" && (
              <div>
                <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none">3-hr</Label>
                <Input value={threeHour} onChange={(e) => setThreeHour(e.target.value)} placeholder="140" className="h-6 text-xs" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

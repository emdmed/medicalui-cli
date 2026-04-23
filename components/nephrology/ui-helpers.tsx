"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Check, X, Trash2 } from "lucide-react";

// --- Severity helpers ---

type Severity = "normal" | "warning" | "critical";

export const severityBg = (s: Severity) =>
  s === "critical" ? "severity-critical" :
  s === "warning" ? "severity-warning" :
  "severity-normal";

export function V({ v, s }: { v: string; s: Severity }) {
  const c = s === "critical" ? "severity-critical-text font-medium" : s === "warning" ? "severity-warning-text font-medium" : "";
  return <span className={c}>{v || "—"}</span>;
}

// --- Shared data sync hook ---

export function useSyncedReadings<T>(data: T[] | undefined, onData: ((d: T[]) => void) | undefined) {
  const [readings, setReadings] = useState<T[]>(() => data ?? []);
  const prevRef = useRef("");
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  useEffect(() => {
    if (!data) return;
    const s = JSON.stringify(data);
    if (s !== prevRef.current) { prevRef.current = s; setReadings(data); }
  }, [data]);

  useEffect(() => {
    const s = JSON.stringify(readings);
    if (s !== prevRef.current) { prevRef.current = s; onDataRef.current?.(readings); }
  }, [readings]);

  const add = (entry: T) => setReadings((p) => [...p, entry]);
  const remove = (id: string) => setReadings((p) => p.filter((r) => (r as { id: string }).id !== id));
  return { readings, add, remove } as const;
}

// --- Value table ---

export interface ValueItem { label: string; value: string; unit: string; cls: { label: string; severity: Severity } }

export function ValueGrid({ items }: { items: ValueItem[]; cols?: string }) {
  return (
    <div className="inline-grid grid-cols-[auto_auto_auto] gap-x-2 text-sm items-center tabular-nums">
      {items.map((item) => (
        <React.Fragment key={item.label}>
          <span className="font-medium text-muted-foreground whitespace-nowrap py-0.5 border-b border-border/20">{item.label}</span>
          <span className="font-semibold whitespace-nowrap text-right py-0.5 border-b border-border/20">
            <V v={item.value} s={item.cls.severity} />
            <span className="text-xs text-muted-foreground ml-0.5">{item.unit}</span>
          </span>
          <span className="py-0.5 border-b border-border/20">
            {item.cls.label ? (
              <Badge className={`text-xs px-1.5 py-0 ${severityBg(item.cls.severity)}`}>{item.cls.label}</Badge>
            ) : null}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

// --- Add reading form ---

export function useAddForm() {
  const [adding, setAdding] = useState(false);
  return { adding, open: () => setAdding(true), close: () => setAdding(false) };
}

export function AddFormTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClick}>
      <Plus className="h-3.5 w-3.5" />
    </Button>
  );
}

export function AddForm<K extends string>({
  title, fields, form, setForm, onAdd, canAdd, onClose, gridCols = "grid-cols-2 sm:grid-cols-4", children,
}: {
  title: string;
  fields: readonly (readonly [string, K, string])[];
  form: Record<K, string>;
  setForm: React.Dispatch<React.SetStateAction<Record<K, string>>>;
  onAdd: () => void;
  canAdd: boolean;
  onClose: () => void;
  gridCols?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-sm p-2">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">{title}</h3>
        <div className="flex gap-0.5">
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { onAdd(); onClose(); }} disabled={!canAdd}>
            <Check className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className={`grid ${gridCols} gap-1.5`}>
        {fields.map(([label, key, ph]) => (
          <div key={key}>
            <Label className="text-[11px] font-heading uppercase tracking-wider text-muted-foreground leading-none">{label}</Label>
            <Input value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={ph} className="h-6 text-xs" />
          </div>
        ))}
        {children}
      </div>
    </div>
  );
}

// --- History table ---

export interface HistCol<R> { label: string; render: (r: R) => React.ReactNode; align?: "left" | "right" }

export function HistoryTable<R extends { id: string; date: string }>({
  readings, cols, onRemove,
}: {
  title?: string;
  readings: R[];
  cols: HistCol<R>[];
  onRemove: (id: string) => void;
}) {
  if (readings.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs tabular-nums">
        <thead>
          <tr className="border-b">
            <th className="p-1 text-left font-heading font-medium uppercase tracking-wider text-muted-foreground text-[11px]">Date</th>
            {cols.map((c) => (
              <th key={c.label} className={`p-1 font-heading font-medium uppercase tracking-wider text-muted-foreground text-[11px] ${c.align === "left" ? "text-left" : "text-right"}`}>{c.label}</th>
            ))}
            <th className="p-1 w-6"></th>
          </tr>
        </thead>
        <tbody>
          {[...readings].reverse().map((r, i) => (
            <tr key={r.id} className={`border-b border-border/30 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
              <td className="p-1 text-muted-foreground text-[11px]">{r.date}</td>
              {cols.map((c) => (
                <td key={c.label} className={`p-1 ${c.align === "left" ? "text-left" : "text-right"}`}>{c.render(r)}</td>
              ))}
              <td className="p-1">
                <Button variant="ghost" size="icon" className="h-4 w-4 opacity-40 hover:opacity-100 hover:text-destructive" onClick={() => onRemove(r.id)}>
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

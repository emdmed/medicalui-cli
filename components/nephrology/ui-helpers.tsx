"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Check, X, Trash2 } from "lucide-react";

// --- Severity helpers ---

type Severity = "normal" | "warning" | "critical";

export const severityBg = (s: Severity) =>
  s === "critical" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
  s === "warning" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";

export function V({ v, s }: { v: string; s: Severity }) {
  const c = s === "critical" ? "text-red-600 dark:text-red-400 font-medium" : s === "warning" ? "text-yellow-600 dark:text-yellow-400 font-medium" : "";
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
    <div className="inline-grid grid-cols-[auto_auto_auto] gap-x-3 text-sm items-center">
      {items.map((item) => (
        <React.Fragment key={item.label}>
          <span className="font-medium opacity-60 whitespace-nowrap py-0.5 border-b border-border/20">{item.label}</span>
          <span className="font-semibold whitespace-nowrap text-right py-0.5 border-b border-border/20">
            <V v={item.value} s={item.cls.severity} />
            <span className="text-xs opacity-50 ml-0.5">{item.unit}</span>
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

export function AddForm<K extends string>({
  title, fields, form, setForm, onAdd, canAdd, gridCols = "grid-cols-2 sm:grid-cols-4", children,
}: {
  title: string;
  fields: readonly (readonly [string, K, string])[];
  form: Record<K, string>;
  setForm: React.Dispatch<React.SetStateAction<Record<K, string>>>;
  onAdd: () => void;
  canAdd: boolean;
  gridCols?: string;
  children?: React.ReactNode;
}) {
  const [adding, setAdding] = useState(false);

  if (!adding) {
    return (
      <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={() => setAdding(true)}>
        <Plus className="h-3 w-3 mr-1" /> {title}
      </Button>
    );
  }

  return (
    <Card className="overflow-visible">
      <CardContent className="p-2">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-semibold">{title}</h3>
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { onAdd(); setAdding(false); }} disabled={!canAdd}>
              <Check className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setAdding(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className={`grid ${gridCols} gap-1.5`}>
          {fields.map(([label, key, ph]) => (
            <div key={key}>
              <Label className="text-[10px] opacity-60 leading-none">{label}</Label>
              <Input value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={ph} className="h-6 text-xs" />
            </div>
          ))}
          {children}
        </div>
      </CardContent>
    </Card>
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
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b">
            <th className="p-1 text-left font-medium opacity-60 text-[10px]">Date</th>
            {cols.map((c) => (
              <th key={c.label} className={`p-1 font-medium opacity-60 text-[10px] ${c.align === "left" ? "text-left" : "text-right"}`}>{c.label}</th>
            ))}
            <th className="p-1 w-6"></th>
          </tr>
        </thead>
        <tbody>
          {[...readings].reverse().map((r) => (
            <tr key={r.id} className="border-b border-border/30 hover:bg-muted/30">
              <td className="p-1 opacity-60 text-[10px]">{r.date}</td>
              {cols.map((c) => (
                <td key={c.label} className={`p-1 ${c.align === "left" ? "text-left" : "text-right"}`}>{c.render(r)}</td>
              ))}
              <td className="p-1">
                <Button variant="ghost" size="icon" className="h-4 w-4 opacity-30 hover:opacity-100 hover:text-red-500" onClick={() => onRemove(r.id)}>
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

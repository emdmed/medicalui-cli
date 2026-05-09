"use client";

import { useState, useMemo } from "react";
import type { TraceEntry } from "./trace";

const PREFIX = "medprotocol:";

interface StoredReading {
  id?: string;
  date?: string;
  trace?: TraceEntry[];
  [key: string]: unknown;
}

interface ComponentTraces {
  key: string;
  label: string;
  readings: { id: string; date: string; trace: TraceEntry[] }[];
}

function loadTraces(): ComponentTraces[] {
  const result: ComponentTraces[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed: unknown = JSON.parse(raw);
      const items: StoredReading[] = Array.isArray(parsed) ? parsed : [parsed];
      const readings = items
        .filter((r): r is StoredReading & { trace: TraceEntry[] } => Array.isArray(r.trace) && r.trace.length > 0)
        .map((r) => ({
          id: r.id ?? "unknown",
          date: r.date ?? "unknown",
          trace: r.trace,
        }));
      if (readings.length > 0) {
        result.push({
          key,
          label: key.slice(PREFIX.length),
          readings,
        });
      }
    }
  } catch {
    // corrupted localStorage — return what we have
  }
  return result.sort((a, b) => a.label.localeCompare(b.label));
}

function formatTs(ts: number): string {
  return new Date(ts * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatOutput(output: unknown): string {
  if (output === null || output === undefined) return "—";
  if (typeof output === "string") return output;
  if (typeof output === "number" || typeof output === "boolean") return String(output);
  return JSON.stringify(output);
}

function formatInputs(inputs: Record<string, string | number | boolean>): string {
  return Object.entries(inputs)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}

export default function Traceability() {
  const [refreshKey, setRefreshKey] = useState(0);
  const components = useMemo(() => loadTraces(), [refreshKey]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  const totalTraces = components.reduce((sum, c) => sum + c.readings.reduce((s, r) => s + r.trace.length, 0), 0);

  return (
    <div className="space-y-2">
      <div className="border border-border rounded-sm p-2">
        <div className="flex items-center justify-between -mx-2 -mt-2 mb-1 px-2 py-1.5 bg-secondary rounded-t-sm">
          <h3 className="text-[11px] font-heading uppercase tracking-widest text-muted-foreground">Traceability</h3>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border/50"
          >
            Refresh
          </button>
        </div>

        {components.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-2">No trace data in localStorage.</div>
        ) : (
          <div className="space-y-1.5">
            <div className="text-[11px] text-muted-foreground px-1">
              {components.length} component{components.length !== 1 ? "s" : ""} · {totalTraces} trace{totalTraces !== 1 ? "s" : ""}
            </div>
            {components.map((comp) => (
              <div key={comp.key} className="border border-border/50 rounded-sm">
                <button
                  onClick={() => toggle(comp.key)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-left hover:bg-muted/30 rounded-sm"
                >
                  <span className="text-xs font-medium">{comp.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {comp.readings.length} reading{comp.readings.length !== 1 ? "s" : ""} · {comp.readings.reduce((s, r) => s + r.trace.length, 0)} trace{comp.readings.reduce((s, r) => s + r.trace.length, 0) !== 1 ? "s" : ""}
                  </span>
                </button>
                {expanded[comp.key] && (
                  <div className="border-t border-border/30 px-2 py-1.5 space-y-2">
                    {comp.readings.map((reading) => (
                      <div key={reading.id} className="space-y-1">
                        <div className="text-[10px] text-muted-foreground font-medium">
                          Reading {reading.date}
                        </div>
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className="text-muted-foreground text-left">
                              <th className="font-medium pr-2 pb-0.5">Function</th>
                              <th className="font-medium pr-2 pb-0.5">Inputs</th>
                              <th className="font-medium pr-2 pb-0.5">Output</th>
                              <th className="font-medium pr-2 pb-0.5">Source</th>
                              <th className="font-medium pb-0.5">Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reading.trace.map((entry, idx) => (
                              <tr key={idx} className="border-t border-border/20">
                                <td className="pr-2 py-0.5 font-mono text-[10px]">{entry.fn}</td>
                                <td className="pr-2 py-0.5 text-muted-foreground max-w-[200px] truncate" title={formatInputs(entry.inputs)}>
                                  {formatInputs(entry.inputs)}
                                </td>
                                <td className="pr-2 py-0.5 max-w-[200px] truncate" title={formatOutput(entry.output)}>
                                  {formatOutput(entry.output)}
                                </td>
                                <td className="pr-2 py-0.5 text-muted-foreground max-w-[150px] truncate" title={entry.source ?? ""}>
                                  {entry.source ?? "—"}
                                </td>
                                <td className="py-0.5 text-muted-foreground whitespace-nowrap">
                                  {formatTs(entry.ts)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

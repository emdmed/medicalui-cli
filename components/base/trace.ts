export interface TraceEntry {
  fn: string;
  inputs: Record<string, string | number | boolean>;
  output: unknown;
  ts: number; // unix timestamp (seconds)
  source?: string;
}

export class Trace {
  private _entries: TraceEntry[] = [];

  record<T>(fn: string, inputs: Record<string, string | number | boolean>, output: T, source?: string): T {
    this._entries.push({ fn, inputs, output, ts: Math.floor(Date.now() / 1000), source });
    return output;
  }

  get entries(): readonly TraceEntry[] { return this._entries; }
  toJSON(): TraceEntry[] { return [...this._entries]; }
}

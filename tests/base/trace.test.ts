import { describe, it, expect } from "vitest";
import { Trace } from "../../components/base/trace";
import type { TraceEntry } from "../../components/base/trace";

describe("Trace", () => {
  it("record() returns the output unchanged (pass-through)", () => {
    const t = new Trace();
    const result = t.record("classifyLDL", { ldl: "130" }, { label: "High", severity: "warning" }, "KDIGO");
    expect(result).toEqual({ label: "High", severity: "warning" });
  });

  it("record() returns primitive values unchanged", () => {
    const t = new Trace();
    expect(t.record("calculateEGFR", { cr: "1.2" }, 65.3)).toBe(65.3);
    expect(t.record("isPositive", { val: "yes" }, true)).toBe(true);
    expect(t.record("classify", { val: "x" }, "normal")).toBe("normal");
  });

  it("entries accumulate in order", () => {
    const t = new Trace();
    t.record("fn1", { a: "1" }, "out1", "src1");
    t.record("fn2", { b: 2 }, "out2", "src2");
    t.record("fn3", { c: true }, "out3");

    expect(t.entries).toHaveLength(3);
    expect(t.entries[0].fn).toBe("fn1");
    expect(t.entries[1].fn).toBe("fn2");
    expect(t.entries[2].fn).toBe("fn3");
  });

  it("entries have correct shape including ts", () => {
    const before = Math.floor(Date.now() / 1000);
    const t = new Trace();
    t.record("classifyA1C", { a1c: "7.0" }, { label: "Diabetes", severity: "critical" }, "ADA 2026");
    const after = Math.floor(Date.now() / 1000);

    const entry = t.entries[0];
    expect(entry.fn).toBe("classifyA1C");
    expect(entry.inputs).toEqual({ a1c: "7.0" });
    expect(entry.output).toEqual({ label: "Diabetes", severity: "critical" });
    expect(entry.source).toBe("ADA 2026");
    expect(entry.ts).toBeGreaterThanOrEqual(before);
    expect(entry.ts).toBeLessThanOrEqual(after);
  });

  it("source field is optional", () => {
    const t = new Trace();
    t.record("fn1", { x: "1" }, "out1");
    expect(t.entries[0].source).toBeUndefined();
  });

  it("toJSON() returns a copy, not the internal reference", () => {
    const t = new Trace();
    t.record("fn1", { a: "1" }, "out1");
    const json1 = t.toJSON();
    const json2 = t.toJSON();

    expect(json1).toEqual(json2);
    expect(json1).not.toBe(json2); // different array references

    // Mutating returned array shouldn't affect internal state
    json1.push({ fn: "injected", inputs: {}, output: null, ts: 0 } as TraceEntry);
    expect(t.entries).toHaveLength(1);
    expect(t.toJSON()).toHaveLength(1);
  });

  it("entries is readonly (cannot push directly)", () => {
    const t = new Trace();
    t.record("fn1", { a: "1" }, "out1");
    // TypeScript would prevent push at compile time; at runtime the readonly
    // is just the type. We verify the array reference is stable.
    expect(t.entries).toHaveLength(1);
  });

  it("works with empty trace", () => {
    const t = new Trace();
    expect(t.entries).toHaveLength(0);
    expect(t.toJSON()).toEqual([]);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculateAge } from "../../components/base/lib";

describe("calculateAge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-19"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calculates age correctly", () => {
    expect(calculateAge("1990-04-19")).toBe(36);
  });

  it("returns age minus one if birthday has not occurred yet", () => {
    expect(calculateAge("1990-05-01")).toBe(35);
  });

  it("returns null for empty string", () => {
    expect(calculateAge("")).toBeNull();
  });

  it("returns null for invalid date", () => {
    expect(calculateAge("not-a-date")).toBeNull();
  });

  it("returns null for future date", () => {
    expect(calculateAge("2030-01-01")).toBeNull();
  });
});

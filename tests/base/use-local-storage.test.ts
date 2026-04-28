// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "../../components/base/use-local-storage";

beforeEach(() => {
  localStorage.clear();
});

describe("useLocalStorage", () => {
  it("returns fallback when key is absent", () => {
    const { result } = renderHook(() => useLocalStorage("medprotocol:test", 42));
    expect(result.current[0]).toBe(42);
  });

  it("reads existing value from localStorage", () => {
    localStorage.setItem("medprotocol:test", JSON.stringify({ a: 1 }));
    const { result } = renderHook(() => useLocalStorage("medprotocol:test", null));
    expect(result.current[0]).toEqual({ a: 1 });
  });

  it("persists value to localStorage on setValue", () => {
    const { result } = renderHook(() => useLocalStorage("medprotocol:test", "initial"));
    act(() => result.current[1]("updated"));
    expect(result.current[0]).toBe("updated");
    expect(JSON.parse(localStorage.getItem("medprotocol:test")!)).toBe("updated");
  });

  it("returns fallback when localStorage contains invalid JSON", () => {
    localStorage.setItem("medprotocol:test", "not-json{");
    const { result } = renderHook(() => useLocalStorage("medprotocol:test", "fallback"));
    expect(result.current[0]).toBe("fallback");
  });

  it("handles undefined as a storable value", () => {
    const { result } = renderHook(() => useLocalStorage<string | undefined>("medprotocol:test", undefined));
    expect(result.current[0]).toBeUndefined();
    act(() => result.current[1]("hello"));
    expect(result.current[0]).toBe("hello");
  });

  it("survives localStorage.setItem throwing (quota exceeded)", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota exceeded");
    });
    const { result } = renderHook(() => useLocalStorage("medprotocol:test", 0));
    // setValue should still update React state even if persistence fails
    act(() => result.current[1](99));
    expect(result.current[0]).toBe(99);
    spy.mockRestore();
  });
});

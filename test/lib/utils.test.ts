import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("combines class names correctly", () => {
    const result = cn("class1", "class2");
    expect(result).toBe("class1 class2");
  });

  it("handles conditional class names", () => {
    const isTrue = true;
    const isFalse = false;
    const result = cn("base", isTrue && "active", isFalse && "hidden");
    expect(result).toBe("base active");
  });

  it("resolves tailwind conflicts using tailwind-merge", () => {
    const result = cn("p-4", "p-6");
    expect(result).toBe("p-6");
  });

  it("handles empty and undefined inputs gracefully", () => {
    const result = cn("base", undefined, null, "", false);
    expect(result).toBe("base");
  });
});


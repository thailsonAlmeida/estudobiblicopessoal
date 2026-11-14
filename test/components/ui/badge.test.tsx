import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

describe("Badge UI Component (Sanctuary Levels)", () => {
  it("renders text content properly", () => {
    render(<Badge>Átrio Exterior</Badge>);
    expect(screen.getByText("Átrio Exterior")).toBeInTheDocument();
  });

  it("applies gold sanctuary styling", () => {
    render(<Badge variant="gold">Lugar Santo</Badge>);
    const badge = screen.getByText("Lugar Santo");
    expect(badge.className).toContain("border-[var(--tabernacle-gold)]");
  });

  it("applies purple sanctuary styling", () => {
    render(<Badge variant="purple">Santo dos Santos</Badge>);
    const badge = screen.getByText("Santo dos Santos");
    expect(badge.className).toContain("border-[var(--tabernacle-purple)]");
  });
});


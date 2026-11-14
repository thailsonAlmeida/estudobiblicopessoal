import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button UI Component (Tabernacle Design System)", () => {
  it("renders correctly with default props", () => {
    render(<Button>Iniciar Estudo</Button>);
    const button = screen.getByRole("button", { name: /iniciar estudo/i });
    expect(button).toBeInTheDocument();
  });

  it("applies the sacred gold variant class", () => {
    render(<Button variant="gold">Acender Menorá</Button>);
    const button = screen.getByRole("button", { name: /acender menorá/i });
    expect(button.className).toContain("bg-[var(--tabernacle-gold)]");
  });

  it("applies the crimson variant class", () => {
    render(<Button variant="crimson">Pecado a Confessar</Button>);
    const button = screen.getByRole("button", { name: /pecado a confessar/i });
    expect(button.className).toContain("bg-[var(--tabernacle-crimson)]");
  });

  it("handles click events properly", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Avançar</Button>);

    const button = screen.getByRole("button", { name: /avançar/i });
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("respects disabled state", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button disabled onClick={handleClick}>
        Desabilitado
      </Button>
    );

    const button = screen.getByRole("button", { name: /desabilitado/i });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});


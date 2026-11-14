import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrincipleDrawer } from "@/components/study/principle-drawer";

describe("PrincipleDrawer (Cortina do Princípio)", () => {
  it("renders trigger button and opens dialog with theological principles on click", async () => {
    const user = userEvent.setup();
    render(
      <PrincipleDrawer
        stepTitle="Etapa 1: Oração"
        theologicalPrinciple="O Espírito Santo ilumina a Palavra."
        whyThisStep="Evita leitura meramente acadêmica."
        goldenTip="Ore por 60 segundos antes de ler."
        exampleFromBook="George Mueller lia de joelhos."
      />
    );

    const triggerBtn = screen.getByRole("button", {
      name: /ver princípio hermenêutico/i,
    });
    expect(triggerBtn).toBeInTheDocument();

    // Dialog content should not be visible initially
    expect(screen.queryByText("Etapa 1: Oração")).not.toBeInTheDocument();

    await user.click(triggerBtn);

    // Dialog content should now be visible
    expect(screen.getByText("Etapa 1: Oração")).toBeInTheDocument();
    expect(
      screen.getByText("O Espírito Santo ilumina a Palavra.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Evita leitura meramente acadêmica.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Ore por 60 segundos antes de ler\./)
    ).toBeInTheDocument();
    expect(screen.getByText("George Mueller lia de joelhos.")).toBeInTheDocument();
  });
});


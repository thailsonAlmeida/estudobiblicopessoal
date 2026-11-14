import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import confetti from "canvas-confetti";
import { db } from "@/lib/db";
import { DevotionalWizard } from "@/components/study/devotional-wizard";

describe("DevotionalWizard (Método 01 - Motor de Etapas e Auto-save)", () => {
  const studyId = "devotional-test-001";

  beforeEach(async () => {
    vi.clearAllMocks();
    await db.studies.clear();
    await db.progress.clear();
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders Etapa 1 initially and transitions smoothly across all 4 steps", () => {
    render(<DevotionalWizard studyId={studyId} />);

    // Etapa 1
    expect(screen.getByText(/Etapa 1: Oração e Passagem Bíblica/i)).toBeInTheDocument();
    expect(screen.getByText(/Etapa 1 de 4/i)).toBeInTheDocument();

    // Advance to Etapa 2
    fireEvent.click(screen.getByRole("button", { name: /Próxima Etapa: Meditação/i }));
    expect(screen.getByText(/Etapa 2: Meditação na Palavra/i)).toBeInTheDocument();
    expect(screen.getByText(/Etapa 2 de 4/i)).toBeInTheDocument();

    // Advance to Etapa 3
    fireEvent.click(screen.getByRole("button", { name: /Próxima Etapa: Aplicação 4Ps/i }));
    expect(screen.getByText(/Etapa 3: Aplicação Prática/i)).toBeInTheDocument();
    expect(screen.getByText(/Etapa 3 de 4/i)).toBeInTheDocument();

    // Advance to Etapa 4
    fireEvent.click(screen.getByRole("button", { name: /Próxima Etapa: Memorização/i }));
    expect(screen.getByText(/Etapa 4: Memorização e Guarda no Coração/i)).toBeInTheDocument();
    expect(screen.getByText(/Etapa 4 de 4/i)).toBeInTheDocument();

    // Step indicator navigation back to Step 1
    const completedStepBtns = screen.getAllByRole("button", { name: "✓" });
    fireEvent.click(completedStepBtns[0]);
    expect(screen.getByText(/Etapa 1 de 4/i)).toBeInTheDocument();
  });

  it("persists study state to IndexedDB automatically after 600ms debounce", async () => {
    render(<DevotionalWizard studyId={studyId} />);

    // Before 600ms timer settles, DB should not have the study yet
    let saved = await db.studies.get(studyId);
    expect(saved).toBeUndefined();

    // Modify study title
    const titleInput = screen.getByDisplayValue("Meu Estudo Devocional");
    fireEvent.change(titleInput, { target: { value: "Confiança em Deus - Lucas 12" } });

    // Advance 300ms (debounce hasn't fired yet)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    saved = await db.studies.get(studyId);
    expect(saved).toBeUndefined();

    // Advance another 400ms (total > 600ms) -> auto-save fires
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    saved = await db.studies.get(studyId);
    expect(saved).toBeDefined();
    expect(saved?.title).toBe("Confiança em Deus - Lucas 12");
    expect(saved?.methodId).toBe("01_DEVOCIONAL");
    expect(saved?.status).toBe("draft");
  });

  it("enforces 4Ps validation before allowing completion and triggers celebration on finalize", async () => {
    render(<DevotionalWizard studyId={studyId} />);

    // Jump to Etapa 4
    fireEvent.click(screen.getByRole("button", { name: "4" }));

    const finalizeBtn = screen.getByRole("button", { name: /Concluir e Acender Menorá/i });
    expect(finalizeBtn).toBeDisabled();

    // Return to Etapa 3 and fill 4Ps
    fireEvent.click(screen.getByRole("button", { name: /Voltar para Etapa 3/i }));

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBe(4);
    for (const cb of checkboxes) {
      fireEvent.click(cb);
    }

    expect(screen.getByText("4Ps Validados ✓")).toBeInTheDocument();

    // Go to Etapa 4 again
    fireEvent.click(screen.getByRole("button", { name: /Próxima Etapa: Memorização/i }));
    const enabledFinalizeBtn = screen.getByRole("button", { name: /Concluir e Acender Menorá/i });
    expect(enabledFinalizeBtn).toBeEnabled();

    await act(async () => {
      fireEvent.click(enabledFinalizeBtn);
    });

    // Celebration card and confetti
    expect(confetti).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Estudo Devocional Concluído!/i)).toBeInTheDocument();
    expect(screen.getByText(/Sua chama na Menorá do Santuário foi renovada/i)).toBeInTheDocument();

    // UserProgress updated in IndexedDB
    const progress = await db.progress.get("progress");
    expect(progress).toBeDefined();
    expect(progress?.streakCount).toBe(1);
    expect(progress?.totalStudiesCompleted).toBe(1);
  });
});

import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { db } from "@/lib/db";
import { ChapterSummaryWizard } from "@/components/study/chapter-summary-wizard";

describe("ChapterSummaryWizard (Método 02 - 5 Leituras, Etapas e Auto-save)", () => {
  const studyId = "chapter-test-001";

  beforeEach(async () => {
    vi.clearAllMocks();
    await db.studies.clear();
    await db.progress.clear();
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("toggles the 5 preliminary readings checklist and updates the badge counter", () => {
    render(<ChapterSummaryWizard studyId={studyId} />);

    expect(screen.getByText("0 de 5 Concluídas")).toBeInTheDocument();

    const reading1 = screen.getByRole("button", { name: /1ª Leitura:/i });
    const reading2 = screen.getByRole("button", { name: /2ª Leitura:/i });
    const reading3 = screen.getByRole("button", { name: /3ª Leitura:/i });

    fireEvent.click(reading1);
    fireEvent.click(reading2);
    expect(screen.getByText("2 de 5 Concluídas")).toBeInTheDocument();

    fireEvent.click(reading3);
    expect(screen.getByText("3 de 5 Concluídas")).toBeInTheDocument();

    // Uncheck reading 2
    fireEvent.click(reading2);
    expect(screen.getByText("2 de 5 Concluídas")).toBeInTheDocument();
  });

  it("navigates between the 3 phases of the chapter summary wizard", () => {
    render(<ChapterSummaryWizard studyId={studyId} />);

    // Initially Phase 1
    expect(
      screen.getByText(/Fase 1: As 5 Leituras Preliminares & Dados Iniciais/i)
    ).toBeInTheDocument();

    // Switch to Phase 2
    fireEvent.click(screen.getByRole("button", { name: /2\. Observações Chave/i }));
    expect(screen.getByText(/Etapa 4: Versículo-Chave/i)).toBeInTheDocument();

    // Switch to Phase 3
    fireEvent.click(screen.getByRole("button", { name: /3\. Teologia & Aplicação/i }));
    expect(screen.getByText(/Etapa 8: Como Cristo é Revelado no Capítulo\?/i)).toBeInTheDocument();
  });

  it("auto-saves readingsCount and chapter summary fields after 600ms debounce", async () => {
    render(<ChapterSummaryWizard studyId={studyId} />);

    // Toggle 1st and 5th reading
    fireEvent.click(screen.getByRole("button", { name: /1ª Leitura:/i }));
    fireEvent.click(screen.getByRole("button", { name: /5ª Leitura:/i }));

    // Fill chapter short title
    const titleField = screen.getByPlaceholderText(/Ex\.: O Modo Excelente do Amor/i);
    fireEvent.change(titleField, { target: { value: "O Caminho do Amor" } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(650);
    });

    const saved = await db.studies.get(studyId);
    expect(saved).toBeDefined();
    expect(saved?.methodId).toBe("02_RESUMO_CAPITULO");
    expect(saved?.formData.readingsCount).toEqual([1, 5]);
    expect(saved?.formData.step1Title).toBe("O Caminho do Amor");
  });
});

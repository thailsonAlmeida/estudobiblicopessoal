import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import confetti from "canvas-confetti";
import { db } from "@/lib/db";
import { CharacterQualityWizard } from "@/components/study/character-quality-wizard";
import { ThematicWizard } from "@/components/study/thematic-wizard";
import { BiographicalWizard } from "@/components/study/biographical-wizard";
import { TopicalWizard } from "@/components/study/topical-wizard";

describe("Fase 3 Wizards (Métodos 03 a 06 - Lugar Santo)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await db.studies.clear();
    await db.progress.clear();
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("CharacterQualityWizard (Método 03: Qualidade de Caráter)", () => {
    it("renders comparative matrix, navigates across 3 phases, auto-saves and finalizes with 4Ps", async () => {
      const studyId = "char-quality-test-001";
      render(<CharacterQualityWizard studyId={studyId} />);

      // Matriz comparativa (Virtude vs Oposto)
      expect(screen.getByText("Virtude a Cultivar")).toBeInTheDocument();
      expect(screen.getByText("Vício / Oposto a Evitar")).toBeInTheDocument();

      const qualityInput = screen.getByLabelText(/Etapa 1: Nome da Qualidade/i);
      const oppositeInput = screen.getByLabelText(/Etapa 2: Qualidade Oposta/i);

      fireEvent.change(qualityInput, { target: { value: "Mansidão" } });
      fireEvent.change(oppositeInput, { target: { value: "Ira descontrolada" } });

      // Transição Fase 1 -> Fase 2 -> Fase 3
      fireEvent.click(screen.getByRole("button", { name: /2\. Escrituras & Biografia/i }));
      expect(
        screen.getByLabelText(/Etapa 4: Referências Cruzadas/i)
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /3\. Prática & Projeto 4Ps/i }));
      expect(
        screen.getByLabelText(/Etapa 7: Situação ou Relacionamento Específico/i)
      ).toBeInTheDocument();

      // Auto-save debounce 600ms
      await act(async () => {
        await vi.advanceTimersByTimeAsync(650);
      });

      const saved = await db.studies.get(studyId);
      expect(saved).toBeDefined();
      expect(saved?.methodId).toBe("03_QUALIDADE_CARATER");
      expect(saved?.formData.qualityName).toBe("Mansidão");
      expect(saved?.formData.oppositeName).toBe("Ira descontrolada");

      // Validação 4Ps + Conclusão
      const finalizeBtn = screen.getByRole("button", {
        name: /Concluir e Acender Menorá/i,
      });
      expect(finalizeBtn).toBeDisabled();

      const checkboxes = screen.getAllByRole("checkbox");
      for (const cb of checkboxes) {
        fireEvent.click(cb);
      }
      expect(finalizeBtn).toBeEnabled();

      await act(async () => {
        fireEvent.click(finalizeBtn);
      });

      expect(confetti).toHaveBeenCalledTimes(1);
      const progress = await db.progress.get("progress");
      expect(progress?.sanctuaryLevel).toBe("lugar_santo");
      expect(progress?.completedMethodsCount["03_QUALIDADE_CARATER"]).toBe(1);
    });
  });

  describe("ThematicWizard (Método 04: Temático - Kipling 3 a 5 perguntas)", () => {
    it("enforces pedagogical maximum of 5 questions and auto-saves to IndexedDB", async () => {
      const studyId = "thematic-test-001";
      render(<ThematicWizard studyId={studyId} />);

      expect(screen.getByText("3 de 5 Perguntas (Máx. 5)")).toBeInTheDocument();

      const addQuestionBtn = screen.getByRole("button", {
        name: /Adicionar Pergunta/i,
      });
      expect(addQuestionBtn).toBeEnabled();

      // Adiciona 4ª e 5ª pergunta
      fireEvent.click(addQuestionBtn);
      expect(screen.getByText("4 de 5 Perguntas (Máx. 5)")).toBeInTheDocument();

      fireEvent.click(addQuestionBtn);
      expect(screen.getByText("5 de 5 Perguntas (Máx. 5)")).toBeInTheDocument();
      expect(addQuestionBtn).toBeDisabled();
      expect(
        screen.getByText(/Limite pedagógico de 5 perguntas atingido/i)
      ).toBeInTheDocument();

      // Avança para Fase 2 e Fase 3
      fireEvent.click(screen.getByRole("button", { name: /2\. Investigação de Versículos/i }));
      expect(
        screen.getByLabelText(/Etapa 4: Respostas Encontradas em Cada Referência Bíblica/i)
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /3\. Conclusões & Aplicação 4Ps/i }));
      expect(
        screen.getByLabelText(/Etapa 5: Conclusões e Síntese do Tema/i)
      ).toBeInTheDocument();

      // Auto-save debounce 600ms
      await act(async () => {
        await vi.advanceTimersByTimeAsync(650);
      });

      const saved = await db.studies.get(studyId);
      expect(saved).toBeDefined();
      expect(saved?.methodId).toBe("04_TEMATICO");
      expect(Array.isArray(saved?.formData.questions)).toBe(true);
      expect((saved?.formData.questions as string[]).length).toBe(5);
    });
  });

  describe("BiographicalWizard (Método 05: Biográfico - Linha do Tempo)", () => {
    it("adds timeline milestones, transitions phases and auto-saves", async () => {
      const studyId = "biographical-test-001";
      render(<BiographicalWizard studyId={studyId} />);

      expect(screen.getByText("3 Marcos Registrados")).toBeInTheDocument();

      const charInput = screen.getByLabelText(/Etapa 1: Nome do Personagem Bíblico/i);
      fireEvent.change(charInput, { target: { value: "Barnabé" } });

      fireEvent.click(
        screen.getByRole("button", { name: /Adicionar Marco Cronológico/i })
      );
      expect(screen.getByText("4 Marcos Registrados")).toBeInTheDocument();

      // Transição Fase 2 e Fase 3
      fireEvent.click(screen.getByRole("button", { name: /2\. Vida Íntima & Caráter/i }));
      expect(screen.getByLabelText(/Etapa 5: O Íntimo da Personagem/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /3\. Aplicação & Esboço/i }));
      expect(screen.getByLabelText(/Etapa 10: Estudo Comunicável/i)).toBeInTheDocument();

      // Auto-save debounce 600ms
      await act(async () => {
        await vi.advanceTimersByTimeAsync(650);
      });

      const saved = await db.studies.get(studyId);
      expect(saved).toBeDefined();
      expect(saved?.methodId).toBe("05_BIOGRAFICO");
      expect(saved?.title).toBe("Biografia: Barnabé");
      expect(saved?.formData.characterName).toBe("Barnabé");
      expect((saved?.formData.timelineEvents as unknown[]).length).toBe(4);
    });
  });

  describe("TopicalWizard (Método 06: Por Tópicos - Esboço I, A, 1)", () => {
    it("adds outline items in hierarchical builder, switches phases and auto-saves", async () => {
      const studyId = "topical-test-001";
      render(<TopicalWizard studyId={studyId} />);

      const topicInput = screen.getByLabelText(/Etapa 1: Tópico Doutrinário/i);
      fireEvent.change(topicInput, { target: { value: "A Oração na Bíblia" } });

      // Navega para Fase 2 (Esboço I, A, 1)
      fireEvent.click(screen.getByRole("button", { name: /2\. Agrupamento & Esboço/i }));
      expect(screen.getByText("3 Itens no Esboço")).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: /Adicionar Tópico ao Esboço/i })
      );
      expect(screen.getByText("4 Itens no Esboço")).toBeInTheDocument();

      // Navega para Fase 3
      fireEvent.click(screen.getByRole("button", { name: /3\. Conclusão & Aplicação 4Ps/i }));
      expect(
        screen.getByLabelText(/Etapa 6: Resumo Geral das Descobertas Doutrinárias/i)
      ).toBeInTheDocument();

      // Auto-save debounce 600ms
      await act(async () => {
        await vi.advanceTimersByTimeAsync(650);
      });

      const saved = await db.studies.get(studyId);
      expect(saved).toBeDefined();
      expect(saved?.methodId).toBe("06_TOPICOS");
      expect(saved?.title).toBe("A Oração na Bíblia");
      expect((saved?.formData.outlineItems as unknown[]).length).toBe(4);
    });
  });
});


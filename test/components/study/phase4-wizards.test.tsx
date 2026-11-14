import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import confetti from "canvas-confetti";
import { db } from "@/lib/db";
import { MorphologicalWizard } from "@/components/study/morphological-wizard";
import { HistoricalCulturalWizard } from "@/components/study/historical-cultural-wizard";
import { BookSurveyWizard } from "@/components/study/book-survey-wizard";
import { ChapterAnalysisWizard } from "@/components/study/chapter-analysis-wizard";
import { BookSynthesisWizard } from "@/components/study/book-synthesis-wizard";
import { VerseByVerseWizard } from "@/components/study/verse-by-verse-wizard";

const VALIDATION_ERROR_MSG =
  "Para concluir o estudo, marque os 4 critérios da aplicação (Pessoal, Prática, Possível e Provável) e descreva o passo de ação mensurável.";

async function flushAsync() {
  for (let i = 0; i < 6; i++) {
    await act(async () => {
      await new Promise<void>((resolve) => {
        if (typeof setImmediate === "function") {
          setImmediate(resolve);
        } else {
          queueMicrotask(resolve);
        }
      });
    });
  }
}

async function checkAll4PsAndSubmit(applicationLabelRegex: RegExp, text: string) {
  const appInput = screen.getByLabelText(applicationLabelRegex);
  fireEvent.change(appInput, { target: { value: text } });

  const checkboxes = screen.getAllByRole("checkbox");
  for (const cb of checkboxes) {
    if (!(cb as HTMLInputElement).checked) {
      fireEvent.click(cb);
    }
  }

  const finalizeBtn = screen.getByRole("button", {
    name: /Concluir e Acender Menorá/i,
  });
  await act(async () => {
    fireEvent.click(finalizeBtn);
  });
  await flushAsync();
}

describe("Fase 4 Wizards (Métodos 07 a 12 — Exegese e Grande Trilogia)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await db.studies.clear();
    await db.progress.clear();
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("MorphologicalWizard (Método 07: Morfológico / Palavras)", () => {
    it("saves Strong & etymology fields with 600ms debounce, validates 4Ps and completes in Lugar Santo", async () => {
      const studyId = "morph-test-001";
      render(<MorphologicalWizard studyId={studyId} />);

      expect(screen.getByText("Método 07")).toBeInTheDocument();
      expect(screen.getByText("Lugar Santo")).toBeInTheDocument();

      // Etapa 1: Palavra em Português
      fireEvent.change(
        screen.getByLabelText(/Palavra em Português \(Etapa 1\)/i),
        { target: { value: "Arrependimento" } }
      );
      fireEvent.change(screen.getByLabelText(/Livro Principal/i), {
        target: { value: "Romanos" },
      });

      // Fase 2: Original & Strong
      fireEvent.click(
        screen.getByRole("button", { name: /2\. Original, Strong & Léxico/i })
      );
      fireEvent.click(screen.getByRole("button", { name: "Grego" }));
      fireEvent.change(screen.getByLabelText(/Número de Strong/i), {
        target: { value: "G3341" },
      });
      fireEvent.change(screen.getByLabelText(/Transliteração/i), {
        target: { value: "metanoia" },
      });

      // Auto-save debounce 600ms
      await act(async () => {
        await vi.advanceTimersByTimeAsync(650);
      });

      const saved = await db.studies.get(studyId);
      expect(saved).toBeDefined();
      expect(saved?.methodId).toBe("07_MORFOLOGICO");
      expect(saved?.title).toBe("Estudo Morfológico: Arrependimento");
      expect(saved?.formData.originalLanguage).toBe("Grego");
      expect(saved?.formData.strongNumber).toBe("G3341");
      expect(saved?.formData.transliteration).toBe("metanoia");

      // Fase 3: Valida erro dos 4Ps antes de preencher
      fireEvent.click(
        screen.getByRole("button", { name: /3\. Uso Contextual & 4Ps/i })
      );
      await act(async () => {
        fireEvent.click(
          screen.getByRole("button", { name: /Concluir e Acender Menorá/i })
        );
      });
      expect(screen.getByRole("alert")).toHaveTextContent(VALIDATION_ERROR_MSG);

      // Completa com 4Ps válidos
      await checkAll4PsAndSubmit(
        /Aplicação Pessoal \(Etapa 8/i,
        "Eu vou confessar minha teimosia e ajustar minha conduta até sexta-feira."
      );

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(confetti).toHaveBeenCalledTimes(1);

      const completed = await db.studies.get(studyId);
      expect(completed?.status).toBe("completed");
      const progress = await db.progress.get("progress");
      expect(progress?.sanctuaryLevel).toBe("lugar_santo");
      expect(progress?.completedMethodsCount["07_MORFOLOGICO"]).toBe(1);
    });
  });

  describe("HistoricalCulturalWizard (Método 08: Histórico-Cultural)", () => {
    it("persists the 4 contextual scenarios and completes study in Lugar Santo", async () => {
      const studyId = "hist-test-001";
      render(<HistoricalCulturalWizard studyId={studyId} />);

      fireEvent.change(
        screen.getByLabelText(/Título ou Tema Histórico-Cultural/i),
        { target: { value: "Laodiceia em Apocalipse 3" } }
      );
      fireEvent.change(screen.getByLabelText(/Livro Bíblico/i), {
        target: { value: "Apocalipse" },
      });

      // Fase 2: Os 4 Cenários
      fireEvent.click(
        screen.getByRole("button", { name: /2\. Os 4 Cenários/i })
      );
      fireEvent.change(screen.getByLabelText(/1\. Cenário Geográfico/i), {
        target: { value: "Vale do Lico, entre Hierápolis (quente) e Colossos (fria)." },
      });
      fireEvent.change(screen.getByLabelText(/2\. Cenário Histórico/i), {
        target: { value: "Cidade reconstruída após terremoto de 60 d.C." },
      });
      fireEvent.change(screen.getByLabelText(/3\. Cenário Cultural/i), {
        target: { value: "Polo bancário, lã negra e colírio frígio." },
      });
      fireEvent.change(screen.getByLabelText(/4\. Cenário Político/i), {
        target: { value: "Autonomia financeira orgulhosa perante Roma." },
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(650);
      });

      const saved = await db.studies.get(studyId);
      expect(saved?.methodId).toBe("08_HISTORICO_CULTURAL");
      expect(saved?.formData.geographyScenario).toContain("Hierápolis");
      expect(saved?.formData.politicsScenario).toContain("Roma");

      // Fase 3: Conclusão
      fireEvent.click(screen.getByRole("button", { name: /3\. Síntese & 4Ps/i }));
      await checkAll4PsAndSubmit(
        /Aplicação Prática Contemporânea/i,
        "Eu reconhecerei diariamente minha dependência de Cristo em oração matinal."
      );

      const progress = await db.progress.get("progress");
      expect(progress?.sanctuaryLevel).toBe("lugar_santo");
      expect(progress?.completedMethodsCount["08_HISTORICO_CULTURAL"]).toBe(1);
    });
  });

  describe("BookSurveyWizard (Método 09: Investigativo do Livro)", () => {
    it("tracks the 7 reading rules, adds horizontal chart sections and elevates progress to Santo dos Santos", async () => {
      const studyId = "survey-test-001";
      render(<BookSurveyWizard studyId={studyId} />);

      expect(screen.getByText("Santo dos Santos")).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/Livro Investigado/i), {
        target: { value: "Filipenses" },
      });

      // Marca 2 regras de leitura
      fireEvent.click(
        screen.getByLabelText(/1\. Leia o livro inteiro de uma só vez/i)
      );
      fireEvent.click(
        screen.getByLabelText(/7\. Anote suas primeiras impressões com lápis à mão/i)
      );
      expect(screen.getByText("2 de 7 marcadas")).toBeInTheDocument();

      // Fase 2: Quadro Horizontal
      fireEvent.click(
        screen.getByRole("button", { name: /2\. Fundo & Quadro Horizontal/i })
      );
      expect(screen.getByText("1 Seção")).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText("Capítulos da seção 1"), {
        target: { value: "Cap. 1-2" },
      });
      fireEvent.click(
        screen.getByRole("button", { name: /Adicionar Seção ao Quadro/i })
      );
      expect(screen.getByText("2 Seções")).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText("Capítulos da seção 2"), {
        target: { value: "Cap. 3-4" },
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(650);
      });

      const saved = await db.studies.get(studyId);
      expect(saved?.methodId).toBe("09_INVESTIGATIVO");
      expect((saved?.formData.readingRulesChecked as string[]).length).toBe(2);
      expect((saved?.formData.horizontalChart as unknown[]).length).toBe(2);

      // Fase 3: Esboço e Conclusão 4Ps
      fireEvent.click(screen.getByRole("button", { name: /3\. Esboço & 4Ps/i }));
      await checkAll4PsAndSubmit(
        /Aplicação Pessoal \(Etapa 6/i,
        "Eu agradecerei em voz alta mesmo diante de contratempos nesta semana."
      );

      const progress = await db.progress.get("progress");
      expect(progress?.sanctuaryLevel).toBe("santo_dos_santos");
      expect(progress?.completedMethodsCount["09_INVESTIGATIVO"]).toBe(1);
    });
  });

  describe("ChapterAnalysisWizard (Método 10: Analítico de Capítulo)", () => {
    it("persists Appendix F inspection items, observation/interpretation and completes in Santo dos Santos", async () => {
      const studyId = "ch-analysis-test-001";
      render(<ChapterAnalysisWizard studyId={studyId} />);

      fireEvent.change(screen.getByLabelText(/Livro Bíblico/i), {
        target: { value: "Romanos" },
      });
      fireEvent.change(screen.getByLabelText(/^Capítulo$/i), {
        target: { value: "8" },
      });

      // Marca itens do Apêndice F
      fireEvent.click(
        screen.getByLabelText(/Repetições de palavras e frases-chave/i)
      );
      fireEvent.click(
        screen.getByLabelText(/Contrastes \('mas', 'porém', luz vs\. trevas\)/i)
      );
      expect(screen.getByText("2 de 7 itens")).toBeInTheDocument();

      // Fase 2 e Fase 3
      fireEvent.click(
        screen.getByRole("button", { name: /2\. Interpretação & Correlação/i })
      );
      fireEvent.change(
        screen.getByLabelText(/Interpretação — O que o texto significa/i),
        { target: { value: "Nenhuma condenação significa absolvição definitiva em Cristo." } }
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(650);
      });

      const saved = await db.studies.get(studyId);
      expect(saved?.methodId).toBe("10_ANALITICO_CAPITULO");
      expect(saved?.chapter).toBe(8);
      expect((saved?.formData.appendixFChecked as string[]).length).toBe(2);

      fireEvent.click(screen.getByRole("button", { name: /3\. Síntese & 4Ps/i }));
      await checkAll4PsAndSubmit(
        /Aplicação Pessoal Definitiva/i,
        "Eu memorizarei Romanos 8:1-2 até domingo e compartilharei com um amigo."
      );

      const progress = await db.progress.get("progress");
      expect(progress?.sanctuaryLevel).toBe("santo_dos_santos");
      expect(progress?.completedMethodsCount["10_ANALITICO_CAPITULO"]).toBe(1);
    });
  });

  describe("BookSynthesisWizard (Método 11: Sintético do Livro)", () => {
    it("builds final hierarchical outline, stores sharing plan and elevates to Santo dos Santos", async () => {
      const studyId = "synthesis-test-001";
      render(<BookSynthesisWizard studyId={studyId} />);

      fireEvent.change(screen.getByLabelText(/Livro Bíblico Sintetizado/i), {
        target: { value: "Efésios" },
      });
      fireEvent.change(
        screen.getByLabelText(/Título Descritivo Final do Livro/i),
        { target: { value: "A Igreja em Cristo" } }
      );

      // Fase 2: Esboço Final Detalhado
      fireEvent.click(
        screen.getByRole("button", { name: /2\. Esboço Final Detalhado/i })
      );
      expect(screen.getByText("1 Divisão")).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText("Título da divisão 1"), {
        target: { value: "Nossa Posição em Cristo" },
      });
      fireEvent.click(
        screen.getByRole("button", {
          name: /Adicionar Divisão ao Esboço Final/i,
        })
      );
      expect(screen.getByText("2 Divisões")).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText("Título da divisão 2"), {
        target: { value: "Nosso Andar Prático" },
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(650);
      });

      const saved = await db.studies.get(studyId);
      expect(saved?.methodId).toBe("11_SINTETICO");
      expect((saved?.formData.finalOutlineItems as unknown[]).length).toBe(2);

      // Fase 3: Descobertas, Compartilhamento & 4Ps
      fireEvent.click(
        screen.getByRole("button", {
          name: /3\. Descobertas, 4Ps & Compartilhamento/i,
        })
      );
      fireEvent.change(
        screen.getByLabelText(/Plano para Compartilhar com Outra Pessoa/i),
        { target: { value: "Ministrar panorama de Efésios no pequeno grupo quinta-feira." } }
      );

      await checkAll4PsAndSubmit(
        /Aplicação Pessoal Consolidada/i,
        "Eu aplicarei Efésios 4:32 perdoando prontamente um colega hoje."
      );

      const progress = await db.progress.get("progress");
      expect(progress?.sanctuaryLevel).toBe("santo_dos_santos");
      expect(progress?.completedMethodsCount["11_SINTETICO"]).toBe(1);
    });
  });

  describe("VerseByVerseWizard (Método 12: Versículo por Versículo)", () => {
    it("supports 6-column verse rows with [P]/[R]/[O] tag shortcuts and completes with 4Ps", async () => {
      const studyId = "vbv-test-001";
      render(<VerseByVerseWizard studyId={studyId} />);

      fireEvent.change(screen.getByLabelText(/Título do Estudo Analítico/i), {
        target: { value: "O Bom Pastor" },
      });
      fireEvent.change(screen.getByLabelText(/Livro Bíblico/i), {
        target: { value: "Salmos" },
      });

      // Fase 2: Quadro Dinâmico de 6 Colunas
      fireEvent.click(
        screen.getByRole("button", {
          name: /2\. Quadro de 6 Colunas \(V\. por V\.\)/i,
        })
      );
      expect(screen.getByText("1 Versículo")).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText("Versículo da linha 1"), {
        target: { value: "Sl 23:1 - O Senhor é o meu pastor." },
      });

      // Atalhos + [P], + [R], + [O]
      fireEvent.click(screen.getByRole("button", { name: "Inserir [P] na linha 1" }));
      fireEvent.click(screen.getByRole("button", { name: "Inserir [R] na linha 1" }));
      fireEvent.click(screen.getByRole("button", { name: "Inserir [O] na linha 1" }));

      const proField = screen.getByLabelText(
        "Perguntas e observações da linha 1"
      ) as HTMLTextAreaElement;
      expect(proField.value).toContain("[P]");
      expect(proField.value).toContain("[R]");
      expect(proField.value).toContain("[O]");

      // Adiciona 2º versículo
      fireEvent.click(
        screen.getByRole("button", { name: /Adicionar Versículo à Análise/i })
      );
      expect(screen.getByText("2 Versículos")).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(650);
      });

      const saved = await db.studies.get(studyId);
      expect(saved?.methodId).toBe("12_VERSICULO_POR_VERSICULO");
      expect((saved?.formData.verseRows as unknown[]).length).toBe(2);

      // Fase 3: Bloqueio 4Ps seguido de conclusão
      fireEvent.click(
        screen.getByRole("button", { name: /3\. Aplicação Final \(4Ps\)/i })
      );
      await act(async () => {
        fireEvent.click(
          screen.getByRole("button", { name: /Concluir e Acender Menorá/i })
        );
      });
      expect(screen.getByRole("alert")).toHaveTextContent(VALIDATION_ERROR_MSG);

      await checkAll4PsAndSubmit(
        /Aplicação Prática Selecionada da Passagem/i,
        "Eu entregarei minha ansiedade financeira em oração antes de dormir hoje."
      );

      const progress = await db.progress.get("progress");
      expect(progress?.sanctuaryLevel).toBe("santo_dos_santos");
      expect(progress?.completedMethodsCount["12_VERSICULO_POR_VERSICULO"]).toBe(
        1
      );
    });
  });
});

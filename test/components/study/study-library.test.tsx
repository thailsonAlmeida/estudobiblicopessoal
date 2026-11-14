import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { db } from "@/lib/db";
import { StudyLibrary } from "@/components/study/study-library";
import {
  formatStudyToDocument,
  formatStudyPlainText,
  generateStudyPdfBytes,
} from "@/lib/export/study-formatter";
import type { Study } from "@/lib/types/study";

describe("StudyLibrary (Biblioteca de Estudos Pessoais)", () => {
  const sampleStudies: Study[] = [
    {
      id: "study-1",
      methodId: "01_DEVOCIONAL",
      title: "O Bom Pastor",
      book: "Salmos",
      chapter: 23,
      verses: "1-6",
      status: "completed",
      currentStep: 4,
      formData: {
        prayerDone: true,
        meditationTechnique: "papelmove",
        meditationNotes: "O Senhor cuida de cada detalhe da jornada.",
        papelmove: {
          promessa: "Nada me faltará.",
        },
        memoryVerse: "O Senhor é o meu pastor; nada me faltará.",
        memoryVerseRef: "Salmos 23:1",
      },
      application4P: {
        text: "Confiarei no Senhor hoje.",
        isPersonal: true,
        isPractical: true,
        isPossible: true,
        isMeasurable: true,
      },
      tags: ["devocional"],
      createdAt: "2026-11-10T10:00:00Z",
      updatedAt: "2026-11-10T10:30:00Z",
    },
    {
      id: "study-2",
      methodId: "02_RESUMO_CAPITULO",
      title: "A Fé sem Obras",
      book: "Tiago",
      chapter: 2,
      verses: "14-26",
      status: "draft",
      currentStep: 2,
      formData: {},
      application4P: {
        text: "",
        isPersonal: false,
        isPractical: false,
        isPossible: false,
        isMeasurable: false,
      },
      tags: ["resumo-capitulo"],
      createdAt: "2026-11-12T10:00:00Z",
      updatedAt: "2026-11-12T10:15:00Z",
    },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    await db.studies.clear();
    await db.studies.bulkPut(sampleStudies);
  });

  it("renders studies from IndexedDB and filters by search term", async () => {
    render(<StudyLibrary />);

    await waitFor(() => {
      expect(screen.getByText("O Bom Pastor")).toBeInTheDocument();
      expect(screen.getByText("A Fé sem Obras")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por livro, capítulo ou título/i);
    fireEvent.change(searchInput, { target: { value: "Salmos" } });

    expect(screen.getByText("O Bom Pastor")).toBeInTheDocument();
    expect(screen.queryByText("A Fé sem Obras")).not.toBeInTheDocument();
  });

  it("filters studies by status (Rascunho / Concluído)", async () => {
    render(<StudyLibrary />);

    await waitFor(() => {
      expect(screen.getByText("O Bom Pastor")).toBeInTheDocument();
    });

    // Select status filter dropdown
    const statusSelect = screen.getByDisplayValue(/Todos os Status/i);
    fireEvent.change(statusSelect, { target: { value: "draft" } });

    expect(screen.queryByText("O Bom Pastor")).not.toBeInTheDocument();
    expect(screen.getByText("A Fé sem Obras")).toBeInTheDocument();
  });

  it("deletes a study from IndexedDB when confirmed in friendly dialog", async () => {
    render(<StudyLibrary />);

    await waitFor(() => {
      expect(screen.getByText("O Bom Pastor")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle(/Excluir Estudo/i);
    fireEvent.click(deleteButtons[0]);

    expect(
      await screen.findByText(/Remover estudo do diário\?/i)
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Confirmar Exclusão/i })
    );

    await waitFor(async () => {
      const remaining = await db.studies.count();
      expect(remaining).toBe(1);
    });
  });

  it("opens the StudyViewerModal with formatted sections and switches to plain text view", async () => {
    render(<StudyLibrary />);

    await waitFor(() => {
      expect(screen.getByText("O Bom Pastor")).toBeInTheDocument();
    });

    const viewBtn = screen.getByRole("button", {
      name: /Visualizar O Bom Pastor/i,
    });
    fireEvent.click(viewBtn);

    expect(
      await screen.findByText(/Etapa 2: Meditação na Passagem/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/O Senhor cuida de cada detalhe da jornada\./i)
    ).toBeInTheDocument();
    expect(screen.getByText(/^Nada me faltará\.$/i)).toBeInTheDocument();

    const textTab = screen.getByRole("tab", { name: /Em Texto/i });
    fireEvent.click(textTab);

    expect(
      screen.getByLabelText(/Conteúdo do estudo em texto puro/i)
    ).toHaveTextContent(/APLICAÇÃO PESSOAL \(REGRA DOS 4Ps\)/i);
  });

  it("formats study document and generates a valid PDF 1.4 binary", () => {
    const doc = formatStudyToDocument(sampleStudies[0]);
    expect(doc.methodName).toContain("Devocional");
    expect(doc.sections.length).toBeGreaterThanOrEqual(3);

    const plain = formatStudyPlainText(sampleStudies[0]);
    expect(plain).toContain("O BOM PASTOR");
    expect(plain).toContain("P — Promessa a reivindicar");

    const pdfBytes = generateStudyPdfBytes(sampleStudies[0]);
    const pdfHeader = new TextDecoder().decode(pdfBytes.slice(0, 8));
    const pdfTail = new TextDecoder().decode(
      pdfBytes.slice(pdfBytes.length - 10)
    );
    expect(pdfHeader).toContain("%PDF-1.4");
    expect(pdfTail).toContain("%%EOF");
  });

  it("switches between Cards, Lista Compacta and Grouped by Book views, and paginates large sets", async () => {
    // Adiciona 15 estudos para testar paginação (12 por página padrão)
    const manyStudies: Study[] = Array.from({ length: 15 }, (_, idx) => ({
      id: `bulk-${idx + 1}`,
      methodId: "01_DEVOCIONAL",
      title: `Estudo ${String(idx + 1).padStart(2, "0")}`,
      book: idx < 8 ? "Gênesis" : "Apocalipse",
      chapter: idx + 1,
      verses: "1-5",
      status: idx % 2 === 0 ? "completed" : "draft",
      currentStep: 4,
      formData: {},
      application4P: {
        text: "Aplicação de teste",
        isPersonal: true,
        isPractical: true,
        isPossible: true,
        isMeasurable: true,
      },
      tags: [],
      createdAt: `2026-11-${String((idx % 20) + 1).padStart(2, "0")}T10:00:00Z`,
      updatedAt: `2026-11-${String((idx % 20) + 1).padStart(2, "0")}T10:00:00Z`,
    }));

    await db.studies.clear();
    await db.studies.bulkPut(manyStudies);

    render(<StudyLibrary />);

    await waitFor(() => {
      expect(screen.getByText(/Página 1 de 2/i)).toBeInTheDocument();
    });

    // Navegar para Página 2
    const nextBtn = screen.getByRole("button", { name: /Próxima/i });
    fireEvent.click(nextBtn);

    expect(await screen.findByText(/Página 2 de 2/i)).toBeInTheDocument();

    // Alternar para modo Agrupado por Livro
    const groupedBtn = screen.getByTitle(/Agrupar por Livro Bíblico/i);
    fireEvent.click(groupedBtn);

    expect(await screen.findByText("8 estudos")).toBeInTheDocument();
    expect(screen.getByText("7 estudos")).toBeInTheDocument();
    expect(screen.getAllByText("Gênesis").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Apocalipse").length).toBeGreaterThanOrEqual(2);
  });
});

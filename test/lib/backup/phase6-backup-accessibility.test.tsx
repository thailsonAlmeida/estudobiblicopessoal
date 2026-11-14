import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { db } from "@/lib/db";
import {
  createBackupPayload,
  formatStudyMarkdown,
  importBackupTransactional,
  parseAndValidateBackupJson,
} from "@/lib/backup/backup-service";
import {
  isStoragePersisted,
  requestPersistentStorage,
  shouldSuggestWeeklyBackup,
} from "@/lib/storage/persistence";
import { StudyLibrary } from "@/components/study/study-library";
import { SettingsView } from "@/components/settings/settings-view";
import type { Study } from "@/lib/types/study";

const validStudy: Study = {
  id: "study-valid-1",
  methodId: "01_DEVOCIONAL",
  title: "A Luz da Palavra",
  book: "Salmos",
  chapter: 119,
  verses: "105",
  status: "completed",
  currentStep: 4,
  formData: {},
  application4P: {
    text: "Lerei o Salmo 119 todos os dias desta semana às 7h.",
    deadline: "2026-11-20",
    isPersonal: true,
    isPractical: true,
    isPossible: true,
    isMeasurable: true,
  },
  tags: ["palavra", "luz"],
  createdAt: "2026-11-13T10:00:00.000Z",
  updatedAt: "2026-11-13T10:30:00.000Z",
};

describe("Fase 6 — Armazenamento Persistente (navigator.storage.persist)", () => {
  it("solicita armazenamento persistente quando suportado pelo navegador", async () => {
    const persistMock = vi.fn().mockResolvedValue(true);
    const persistedMock = vi.fn().mockResolvedValue(false);

    Object.defineProperty(navigator, "storage", {
      value: {
        persist: persistMock,
        persisted: persistedMock,
      },
      configurable: true,
    });

    const granted = await requestPersistentStorage();
    expect(granted).toBe(true);
    expect(persistedMock).toHaveBeenCalledTimes(1);
    expect(persistMock).toHaveBeenCalledTimes(1);

    persistedMock.mockResolvedValueOnce(true);
    expect(await isStoragePersisted()).toBe(true);
  });

  it("calcula lembrete de backup semanal após 7 dias sem exportação", () => {
    const nowMs = Date.parse("2026-11-13T12:00:00.000Z");
    expect(shouldSuggestWeeklyBackup(null, 0, nowMs)).toBe(false);
    expect(shouldSuggestWeeklyBackup(null, 2, nowMs)).toBe(true);
    expect(
      shouldSuggestWeeklyBackup("2026-11-10T12:00:00.000Z", 2, nowMs)
    ).toBe(false);
    expect(
      shouldSuggestWeeklyBackup("2026-11-01T12:00:00.000Z", 2, nowMs)
    ).toBe(true);
  });
});

describe("Fase 6 — Backup Seguro, Validação Zod Atômica e Markdown", () => {
  beforeEach(async () => {
    await db.studies.clear();
  });

  it("exporta Markdown estruturado com YAML frontmatter e Regra dos 4Ps", () => {
    const md = formatStudyMarkdown(validStudy);
    expect(md).toContain('titulo: "A Luz da Palavra"');
    expect(md).toContain('livro: "Salmos"');
    expect(md).toContain("## Aplicação Pessoal (Regra dos 4Ps)");
    expect(md).toContain("Pessoal: Sim");
  });

  it("importa backup JSON válido de forma transacional para o IndexedDB (estudos, progresso e notas)", async () => {
    await db.progress.clear();
    await db.quickNotes.clear();

    const payload = createBackupPayload(
      [validStudy],
      "2026-11-13T12:00:00.000Z",
      {
        id: "progress",
        streakCount: 5,
        lastStudyDate: "2026-11-13",
        sanctuaryLevel: "lugar_santo",
        completedMethodsCount: { "01_DEVOCIONAL": 1 },
        earnedBadges: [],
        totalStudiesCompleted: 1,
      },
      [
        {
          id: "note-1",
          reference: "Sl 119.105",
          content: "Lâmpada para os meus pés",
          updatedAt: "2026-11-13T12:00:00.000Z",
        },
      ]
    );
    const result = await importBackupTransactional(JSON.stringify(payload));

    expect(result.importedCount).toBe(1);
    const saved = await db.studies.get("study-valid-1");
    expect(saved?.title).toBe("A Luz da Palavra");
    const savedProgress = await db.progress.get("progress");
    expect(savedProgress?.streakCount).toBe(5);
    const savedNote = await db.quickNotes.get("note-1");
    expect(savedNote?.reference).toBe("Sl 119.105");
  });

  it("rejeita lote inteiro (rollback transacional) quando JSON contém estudo adulterado", async () => {
    const corruptedPayload = {
      version: 1,
      studies: [
        validStudy,
        {
          id: "corrupted-study",
          methodId: "METODO_INEXISTENTE",
          title: 12345,
        },
      ],
    };

    const validation = parseAndValidateBackupJson(
      JSON.stringify(corruptedPayload)
    );
    expect(validation.success).toBe(false);

    await expect(
      importBackupTransactional(JSON.stringify(corruptedPayload))
    ).rejects.toThrow(/corrompidos ou incompatíveis/i);

    const count = await db.studies.count();
    expect(count).toBe(0);
  });
});

describe("Fase 6 — Acessibilidade WCAG 2.1 AA e Página de Configurações", () => {
  beforeEach(async () => {
    await db.studies.clear();
    await db.progress.clear();
    await db.quickNotes.clear();
  });

  it("expõe região role='search' e rótulos acessíveis na Biblioteca de Estudos", async () => {
    await db.studies.put(validStudy);

    render(<StudyLibrary />);

    expect(
      screen.getByRole("search", { name: /Busca e filtros de estudos bíblicos/i })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Filtrar por status do estudo/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Filtrar por método de estudo/i)
    ).toBeInTheDocument();
  });

  it("centraliza Instalar, Backup, Restaurar e Armazenamento Persistente na página Configurações", async () => {
    Object.defineProperty(navigator, "storage", {
      value: {
        persist: vi.fn().mockResolvedValue(true),
        persisted: vi.fn().mockResolvedValue(false),
      },
      configurable: true,
    });

    render(<SettingsView />);

    expect(
      screen.getByRole("heading", { name: /Configurações/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Instalar aplicativo PWA no dispositivo/i })
    ).toHaveTextContent(/^Instalar$/);

    const backupBtn = screen.getByRole("button", { name: /^Backup$/i });
    expect(backupBtn).toBeInTheDocument();

    expect(screen.getByText(/^Restaurar$/)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Selecionar arquivo JSON de backup para restaurar/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(/Armazenamento Persistente Ativo/i)
      ).toBeInTheDocument();
    });

    fireEvent.click(backupBtn);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /Nenhum dado encontrado no dispositivo para exportar/i
      );
    });
  });
});

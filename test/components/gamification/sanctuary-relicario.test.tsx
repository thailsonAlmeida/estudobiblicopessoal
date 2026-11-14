import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SanctuaryRelicario } from "@/components/gamification/sanctuary-relicario";
import { db } from "@/lib/db";

describe("SanctuaryRelicario", () => {
  beforeEach(async () => {
    await db.progress.clear();
  });

  it("renderiza estado inicial com Átrio Exterior e 6 insígnias bloqueadas", async () => {
    render(<SanctuaryRelicario />);

    expect(
      screen.getByRole("heading", { name: /O Santuário de Constância/i })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/0 de 6 desbloqueadas/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Átrio Exterior")).toBeInTheDocument();
    expect(screen.getByText("Lugar Santo")).toBeInTheDocument();
    expect(screen.getByText("Santo dos Santos")).toBeInTheDocument();
    expect(screen.getByText("Discípulo de Bereia")).toBeInTheDocument();
    expect(screen.getByText("Chama Perpétua")).toBeInTheDocument();
  });

  it("exibe Brasa Suave da Graça e insígnia desbloqueada a partir do IndexedDB", async () => {
    await db.progress.put({
      id: "progress",
      streakCount: 4,
      lastStudyDate: "2020-01-01",
      totalStudiesCompleted: 2,
      sanctuaryLevel: "santo_dos_santos",
      completedMethodsCount: {
        "10_ANALITICO_CAPITULO": 1,
        "05_BIOGRAFICO": 1,
      },
      earnedBadges: ["discipulo_bereia", "consolador_almas"],
    });

    render(<SanctuaryRelicario />);

    await waitFor(() => {
      expect(screen.getByText(/Brasa Suave da Graça/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/2 de 6 desbloqueadas/i)).toBeInTheDocument();
    expect(screen.getByText(/4 dias acumulados/i)).toBeInTheDocument();
    expect(screen.getByText("Nível Atual")).toBeInTheDocument();
  });
});


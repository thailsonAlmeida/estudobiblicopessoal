import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StudyCompletionCard } from "@/components/study/study-completion-card";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("StudyCompletionCard", () => {
  it("renders the biblical character encouragement and quote for Método Biográfico", () => {
    render(
      <StudyCompletionCard
        methodId="05_BIOGRAFICO"
        title="Estudo Biográfico Concluído!"
        subtitle="A biografia de seu personagem foi salva no diário permanente."
      />
    );

    expect(
      screen.getByRole("heading", { name: "Estudo Biográfico Concluído!" })
    ).toBeInTheDocument();
    expect(screen.getByText(/nuvem de testemunhas/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Autor aos Hebreus \(Hebreus 12\.1-2\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "A biografia de seu personagem foi salva no diário permanente."
      )
    ).toBeInTheDocument();
  });

  it("handles onEdit and onViewDiary callbacks", () => {
    const onEdit = vi.fn();
    const onViewDiary = vi.fn();

    render(
      <StudyCompletionCard
        methodId="01_DEVOCIONAL"
        title="Estudo Devocional Concluído!"
        onEdit={onEdit}
        onViewDiary={onViewDiary}
      />
    );

    expect(screen.getByText(/Tiago \(Tiago 4\.8; 1\.22\)/i)).toBeInTheDocument();

    const editBtn = screen.getByRole("button", { name: /Editar Estudo/i });
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledTimes(1);

    const diaryBtn = screen.getByRole("button", {
      name: /Ir para o Diário de Estudos/i,
    });
    fireEvent.click(diaryBtn);
    expect(onViewDiary).toHaveBeenCalledTimes(1);
  });
});


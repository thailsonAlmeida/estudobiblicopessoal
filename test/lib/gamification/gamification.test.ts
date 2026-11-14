import { describe, expect, it, vi } from "vitest";
import {
  calculateNextStreak,
  getGraceStreakState,
  getTodayIsoDate,
} from "@/lib/gamification/streak";
import {
  evaluateBadges,
  getUnlockedBadgeIds,
  SACRED_BADGES,
} from "@/lib/gamification/badges";
import {
  buildUpdatedUserProgress,
  recalculateProgressFromStudies,
} from "@/lib/gamification/progress-calculator";
import {
  playSoftShofarSound,
  SHOFAR_AUDIO_SRC,
  SHOFAR_INITIAL_VOLUME,
  SHOFAR_TARGET_VOLUME,
} from "@/lib/gamification/celebration-sound";
import manifest from "@/app/manifest";
import type { MethodId, Study } from "@/lib/types/study";

describe("Gamificação — Streak da Graça & Menorá de 7 Chamas", () => {
  it("inicia zerado quando não há progresso registrado", () => {
    const state = getGraceStreakState(null, "2026-11-13");
    expect(state.streakCount).toBe(0);
    expect(state.litFlames).toBe(0);
    expect(state.isEmber).toBe(false);
    expect(state.studiedToday).toBe(false);
  });

  it("mantém a chama acesa no mesmo dia e limita litFlames a 7", () => {
    const state = getGraceStreakState(
      { streakCount: 10, lastStudyDate: "2026-11-13" },
      "2026-11-13"
    );
    expect(state.streakCount).toBe(10);
    expect(state.litFlames).toBe(7);
    expect(state.isEmber).toBe(false);
    expect(state.studiedToday).toBe(true);
  });

  it("não zera o streak após dias ausentes e entra em modo Brasa Suave da Graça", () => {
    const state = getGraceStreakState(
      { streakCount: 5, lastStudyDate: "2026-11-10" },
      "2026-11-13"
    );
    expect(state.streakCount).toBe(5);
    expect(state.litFlames).toBe(5);
    expect(state.isEmber).toBe(true);
    expect(state.studiedToday).toBe(false);
    expect(state.encouragementMessage).toContain("misericórdias");
  });

  it("incrementa o streak no máximo uma vez por dia e preserva histórico após pausa", () => {
    expect(calculateNextStreak(null, "2026-11-13")).toBe(1);
    expect(
      calculateNextStreak(
        { streakCount: 4, lastStudyDate: "2026-11-13" },
        "2026-11-13"
      )
    ).toBe(4);
    expect(
      calculateNextStreak(
        { streakCount: 4, lastStudyDate: "2026-11-10" },
        "2026-11-13"
      )
    ).toBe(5);
  });

  it("formata a data ISO do dia corretamente", () => {
    const iso = getTodayIsoDate(new Date("2026-11-13T15:30:00.000Z"));
    expect(iso).toBe("2026-11-13");
  });
});

describe("Gamificação — Insígnias Bíblicas do Relicário", () => {
  it("lista exatamente as 6 insígnias sagradas com progresso 0 quando vazio", () => {
    const statuses = evaluateBadges(null);
    expect(statuses).toHaveLength(6);
    expect(SACRED_BADGES).toHaveLength(6);
    expect(statuses.every((b) => !b.unlocked)).toBe(true);
  });

  it("desbloqueia todas as 6 insígnias quando os critérios são cumpridos", () => {
    const allCounts: Partial<Record<MethodId, number>> = {
      "01_DEVOCIONAL": 7,
      "02_RESUMO_CAPITULO": 1,
      "03_QUALIDADE_CARATER": 1,
      "04_TEMATICO": 1,
      "05_BIOGRAFICO": 1,
      "06_TOPICOS": 1,
      "07_MORFOLOGICO": 1,
      "08_HISTORICO_CULTURAL": 1,
      "09_INVESTIGATIVO": 1,
      "10_ANALITICO_CAPITULO": 1,
      "11_SINTETICO": 1,
      "12_VERSICULO_POR_VERSICULO": 1,
    };

    const unlocked = getUnlockedBadgeIds({
      completedMethodsCount: allCounts,
      streakCount: 30,
      earnedBadges: [],
    });

    expect(unlocked).toEqual([
      "discipulo_bereia",
      "detetive_palavra",
      "consolador_almas",
      "guerreiro_oracao",
      "mestre_construtor",
      "chama_perpetua",
    ]);
  });
});

describe("PWA — Web App Manifest", () => {
  it("gera o manifest W3C com nome, display standalone, ícones e atalhos", () => {
    const data = manifest();
    expect(data.name).toContain("Estudo Bíblico Pessoal");
    expect(data.display).toBe("standalone");
    expect(data.start_url).toBe("/");
    expect(data.theme_color).toBe("#1B4965");
    expect(data.background_color).toBe("#FDFBF7");
    expect(data.lang).toBe("pt-BR");
    expect(data.icons?.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Gamificação — Motor de Cálculos de Progresso (progress-calculator)", () => {
  it("soma apenas 1 dia na Menorá ao concluir múltiplos estudos no mesmo dia e não rebaixa o nível do Santuário", () => {
    const first = buildUpdatedUserProgress(
      undefined,
      "10_ANALITICO_CAPITULO",
      "2026-11-13"
    );
    expect(first.streakCount).toBe(1);
    expect(first.totalStudiesCompleted).toBe(1);
    expect(first.sanctuaryLevel).toBe("santo_dos_santos");
    expect(first.earnedBadges).toContain("discipulo_bereia");

    // Segundo estudo no mesmo dia (Devocional - Átrio): streak permanece 1 e nível permanece santo_dos_santos
    const second = buildUpdatedUserProgress(
      first,
      "01_DEVOCIONAL",
      "2026-11-13"
    );
    expect(second.streakCount).toBe(1);
    expect(second.totalStudiesCompleted).toBe(2);
    expect(second.sanctuaryLevel).toBe("santo_dos_santos");
  });

  it("recalcula dias distintos e estudos concluídos a partir da lista real do banco", () => {
    const studies: Study[] = [
      {
        id: "s1",
        methodId: "01_DEVOCIONAL",
        title: "Estudo 1",
        book: "Salmos",
        chapter: 1,
        verses: "1-3",
        status: "completed",
        currentStep: 4,
        formData: {},
        application4P: {
          text: "Aplicar",
          isPersonal: true,
          isPractical: true,
          isPossible: true,
          isMeasurable: true,
        },
        tags: [],
        createdAt: "2026-11-13T08:00:00.000Z",
        updatedAt: "2026-11-13T08:30:00.000Z",
      },
      {
        id: "s2",
        methodId: "05_BIOGRAFICO",
        title: "Estudo 2 no mesmo dia",
        book: "Atos",
        chapter: 4,
        verses: "36",
        status: "completed",
        currentStep: 4,
        formData: {},
        application4P: {
          text: "Aplicar",
          isPersonal: true,
          isPractical: true,
          isPossible: true,
          isMeasurable: true,
        },
        tags: [],
        createdAt: "2026-11-13T18:00:00.000Z",
        updatedAt: "2026-11-13T18:30:00.000Z",
      },
    ];

    const recalculated = recalculateProgressFromStudies(studies);
    expect(recalculated.totalStudiesCompleted).toBe(2);
    expect(recalculated.streakCount).toBe(1);
    expect(recalculated.sanctuaryLevel).toBe("lugar_santo");
    expect(recalculated.earnedBadges).toContain("consolador_almas");
  });

  it("reproduz o som suave do Shofar (/toque-shofar.mp3) com fade-in progressivo até 22% de volume", async () => {
    vi.useFakeTimers();
    const playSpy = vi
      .spyOn(window.HTMLMediaElement.prototype, "play")
      .mockImplementation(() => Promise.resolve());

    const audio = playSoftShofarSound();
    expect(audio).not.toBeNull();
    expect(audio?.src).toContain(SHOFAR_AUDIO_SRC);
    expect(audio?.volume).toBe(SHOFAR_INITIAL_VOLUME);
    expect(playSpy).toHaveBeenCalledTimes(1);

    await Promise.resolve();
    vi.advanceTimersByTime(700);
    expect(audio?.volume).toBe(SHOFAR_TARGET_VOLUME);

    playSpy.mockRestore();
    vi.useRealTimers();
  });
});

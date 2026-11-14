import type { UserProgress } from "@/lib/types/study";

export interface GraceStreakState {
  streakCount: number;
  litFlames: number;
  isEmber: boolean;
  studiedToday: boolean;
  encouragementMessage: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseIsoDateUtc(dateStr: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return null;
  }
  const timestamp = Date.parse(`${dateStr}T00:00:00.000Z`);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function getTodayIsoDate(now: Date = new Date()): string {
  return now.toISOString().split("T")[0];
}

/**
 * Calcula o estado da Menorá de 7 Chamas aplicando a teologia do "Streak da Graça":
 * dias ausentes nunca zeram o histórico acumulado, transformando a chama em brasa suave.
 */
export function getGraceStreakState(
  progress?: Pick<UserProgress, "streakCount" | "lastStudyDate"> | null,
  todayIso: string = getTodayIsoDate()
): GraceStreakState {
  const streakCount = Math.max(0, progress?.streakCount ?? 0);
  const litFlames = Math.min(7, streakCount);
  const lastDate = progress?.lastStudyDate || "";

  if (streakCount === 0 || !lastDate) {
    return {
      streakCount: 0,
      litFlames: 0,
      isEmber: false,
      studiedToday: false,
      encouragementMessage:
        "Acenda a primeira lâmpada da Menorá concluindo um estudo hoje.",
    };
  }

  const todayMs = parseIsoDateUtc(todayIso);
  const lastMs = parseIsoDateUtc(lastDate);

  if (todayMs === null || lastMs === null) {
    return {
      streakCount,
      litFlames,
      isEmber: false,
      studiedToday: lastDate === todayIso,
      encouragementMessage:
        "Sua lâmpada permanece acesa no santuário pela graça de Deus.",
    };
  }

  const diffDays = Math.floor((todayMs - lastMs) / MS_PER_DAY);
  const studiedToday = diffDays <= 0;
  const isEmber = diffDays > 1;

  if (studiedToday) {
    return {
      streakCount,
      litFlames,
      isEmber: false,
      studiedToday: true,
      encouragementMessage:
        "Lâmpada acesa hoje! A Palavra tem sido lâmpada para os seus pés.",
    };
  }

  if (isEmber) {
    return {
      streakCount,
      litFlames,
      isEmber: true,
      studiedToday: false,
      encouragementMessage:
        "O Senhor renova suas misericórdias a cada manhã. Acenda a lâmpada hoje!",
    };
  }

  return {
    streakCount,
    litFlames,
    isEmber: false,
    studiedToday: false,
    encouragementMessage:
      "Continue sua caminhada hoje para acender mais uma chama da Menorá.",
  };
}

/**
 * Calcula o próximo valor de streak ao concluir um estudo, incrementando no máximo
 * uma vez por dia e preservando o histórico sem punição em caso de pausa.
 */
export function calculateNextStreak(
  progress?: Pick<UserProgress, "streakCount" | "lastStudyDate"> | null,
  todayIso: string = getTodayIsoDate()
): number {
  const current = Math.max(0, progress?.streakCount ?? 0);
  if (progress?.lastStudyDate === todayIso && current > 0) {
    return current;
  }
  return current + 1;
}


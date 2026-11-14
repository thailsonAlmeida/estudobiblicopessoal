import { db } from "@/lib/db";
import { BIBLE_STUDY_METHODS } from "@/lib/constants/methods";
import type { MethodId, Study, UserProgress } from "@/lib/types/study";
import { calculateNextStreak, getTodayIsoDate } from "./streak";
import { getUnlockedBadgeIds } from "./badges";

type SanctuaryLevel = UserProgress["sanctuaryLevel"];

const LEVEL_RANK: Record<SanctuaryLevel, number> = {
  atrio: 1,
  lugar_santo: 2,
  santo_dos_santos: 3,
};

function getHigherSanctuaryLevel(
  a: SanctuaryLevel | undefined,
  b: SanctuaryLevel | undefined
): SanctuaryLevel {
  const levelA = a ?? "atrio";
  const levelB = b ?? "atrio";
  return LEVEL_RANK[levelA] >= LEVEL_RANK[levelB] ? levelA : levelB;
}

/**
 * Calcula o novo registro de progresso ao concluir um estudo:
 * - Incrementa o streak no máximo 1 vez por data (calculateNextStreak)
 * - Nunca rebaixa o nível do Santuário alcançado anteriormente
 * - Atualiza contadores por método e total de estudos concluídos
 * - Avalia e persiste automaticamente as insígnias desbloqueadas
 */
export function buildUpdatedUserProgress(
  currentProg: UserProgress | undefined,
  methodId: MethodId,
  todayIso: string = getTodayIsoDate()
): UserProgress {
  const streakCount = calculateNextStreak(currentProg, todayIso);
  const methodLevel = BIBLE_STUDY_METHODS[methodId]?.sanctuaryLevel ?? "atrio";
  const sanctuaryLevel = getHigherSanctuaryLevel(
    currentProg?.sanctuaryLevel,
    methodLevel
  );

  const completedMethodsCount: Record<string, number> = {
    ...(currentProg?.completedMethodsCount || {}),
    [methodId]: (currentProg?.completedMethodsCount?.[methodId] || 0) + 1,
  };

  const totalStudiesCompleted = (currentProg?.totalStudiesCompleted || 0) + 1;

  const earnedBadges = getUnlockedBadgeIds({
    completedMethodsCount,
    streakCount,
    earnedBadges: currentProg?.earnedBadges || [],
  });

  return {
    id: "progress",
    streakCount,
    lastStudyDate: todayIso,
    sanctuaryLevel,
    completedMethodsCount,
    earnedBadges,
    totalStudiesCompleted,
  };
}

/**
 * Recalcula integralmente o progresso do usuário a partir da lista real de estudos
 * concluídos no banco, corrigindo eventuais divergências de contadores ou dias.
 */
export function recalculateProgressFromStudies(studies: Study[]): UserProgress {
  const completedStudies = studies.filter((s) => s.status === "completed");

  const completedMethodsCount: Record<string, number> = {};
  const distinctDates = new Set<string>();
  let highestLevel: SanctuaryLevel = "atrio";

  for (const study of completedStudies) {
    completedMethodsCount[study.methodId] =
      (completedMethodsCount[study.methodId] || 0) + 1;

    const methodLevel =
      BIBLE_STUDY_METHODS[study.methodId]?.sanctuaryLevel ?? "atrio";
    highestLevel = getHigherSanctuaryLevel(highestLevel, methodLevel);

    const rawDate = study.completedAt || study.updatedAt || study.createdAt;
    const isoDate = rawDate ? rawDate.slice(0, 10) : "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      distinctDates.add(isoDate);
    }
  }

  const sortedDates = Array.from(distinctDates).sort();
  const streakCount = sortedDates.length;
  const lastStudyDate =
    sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : "";

  const earnedBadges = getUnlockedBadgeIds({
    completedMethodsCount,
    streakCount,
    earnedBadges: [],
  });

  return {
    id: "progress",
    streakCount,
    lastStudyDate,
    sanctuaryLevel: highestLevel,
    completedMethodsCount,
    earnedBadges,
    totalStudiesCompleted: completedStudies.length,
  };
}

/**
 * Sincroniza a tabela `db.progress` recalculando todos os indicadores
 * diretamente a partir dos estudos salvos em `db.studies`.
 * Só executa escrita no IndexedDB se houver divergência real nos contadores.
 */
export async function syncProgressWithDatabase(): Promise<UserProgress> {
  const [allStudies, currentProg] = await Promise.all([
    db.studies.toArray(),
    db.progress.get("progress"),
  ]);

  const recalculated = recalculateProgressFromStudies(allStudies);

  const isSame =
    currentProg &&
    currentProg.streakCount === recalculated.streakCount &&
    currentProg.lastStudyDate === recalculated.lastStudyDate &&
    currentProg.sanctuaryLevel === recalculated.sanctuaryLevel &&
    currentProg.totalStudiesCompleted === recalculated.totalStudiesCompleted &&
    currentProg.earnedBadges.length === recalculated.earnedBadges.length;

  if (!isSame) {
    await db.progress.put(recalculated);
  }

  return recalculated;
}


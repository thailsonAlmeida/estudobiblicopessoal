import type { MethodId, UserProgress } from "@/lib/types/study";
import { BIBLE_STUDY_METHODS } from "@/lib/constants/methods";

export interface SacredBadgeDefinition {
  id: string;
  name: string;
  reference: string;
  description: string;
  iconName: "ScrollText" | "Search" | "HeartHandshake" | "Flame" | "Crown" | "Sparkles";
}

export interface SacredBadgeStatus extends SacredBadgeDefinition {
  unlocked: boolean;
  progressCurrent: number;
  progressTarget: number;
}

const ALL_METHOD_IDS = Object.keys(BIBLE_STUDY_METHODS) as MethodId[];

export const SACRED_BADGES: SacredBadgeDefinition[] = [
  {
    id: "discipulo_bereia",
    name: "Discípulo de Bereia",
    reference: "Atos 17.11",
    description:
      "Examinou as Escrituras minuciosamente concluindo seu 1º estudo analítico (Método 10 ou 12).",
    iconName: "ScrollText",
  },
  {
    id: "detetive_palavra",
    name: "Detetive da Palavra",
    reference: "Provérbios 2.4",
    description:
      "Buscou tesouros escondidos concluindo seu 1º estudo morfológico ou investigativo (Método 07 ou 09).",
    iconName: "Search",
  },
  {
    id: "consolador_almas",
    name: "Consolador de Almas",
    reference: "Barnabé (At 4.36)",
    description:
      "Aprendeu com os santos do passado concluindo seu 1º estudo biográfico (Método 05).",
    iconName: "HeartHandshake",
  },
  {
    id: "guerreiro_oracao",
    name: "Guerreiro de Oração",
    reference: "Salmo 23",
    description:
      "Cultivou intimidade diária completando 7 estudos no Método Devocional.",
    iconName: "Sparkles",
  },
  {
    id: "mestre_construtor",
    name: "Mestre Construtor",
    reference: "Bezalel (Êx 36.1)",
    description:
      "Dominou toda a engenharia sagrada completando ao menos 1 estudo em cada um dos 12 métodos.",
    iconName: "Crown",
  },
  {
    id: "chama_perpetua",
    name: "Chama Perpétua",
    reference: "Êxodo 27.20",
    description:
      "Manteve a Menorá acesa com 30 dias acumulados de constância na Palavra.",
    iconName: "Flame",
  },
];

export function evaluateBadges(
  progress?: Pick<
    UserProgress,
    "completedMethodsCount" | "streakCount" | "earnedBadges"
  > | null
): SacredBadgeStatus[] {
  const counts = progress?.completedMethodsCount ?? {};
  const streak = progress?.streakCount ?? 0;

  const analyticalCount =
    (counts["10_ANALITICO_CAPITULO"] ?? 0) +
    (counts["12_VERSICULO_POR_VERSICULO"] ?? 0);
  const investigativeCount =
    (counts["07_MORFOLOGICO"] ?? 0) + (counts["09_INVESTIGATIVO"] ?? 0);
  const biographicalCount = counts["05_BIOGRAFICO"] ?? 0;
  const devotionalCount = counts["01_DEVOCIONAL"] ?? 0;
  const distinctMethodsCount = ALL_METHOD_IDS.filter(
    (id) => (counts[id] ?? 0) > 0
  ).length;

  const progressMap: Record<string, { current: number; target: number }> = {
    discipulo_bereia: { current: Math.min(1, analyticalCount), target: 1 },
    detetive_palavra: { current: Math.min(1, investigativeCount), target: 1 },
    consolador_almas: { current: Math.min(1, biographicalCount), target: 1 },
    guerreiro_oracao: { current: Math.min(7, devotionalCount), target: 7 },
    mestre_construtor: {
      current: distinctMethodsCount,
      target: ALL_METHOD_IDS.length,
    },
    chama_perpetua: { current: Math.min(30, streak), target: 30 },
  };

  return SACRED_BADGES.map((badge) => {
    const stats = progressMap[badge.id] ?? { current: 0, target: 1 };
    const unlocked = stats.current >= stats.target;
    return {
      ...badge,
      unlocked,
      progressCurrent: stats.current,
      progressTarget: stats.target,
    };
  });
}

export function getUnlockedBadgeIds(
  progress?: Pick<
    UserProgress,
    "completedMethodsCount" | "streakCount" | "earnedBadges"
  > | null
): string[] {
  return evaluateBadges(progress)
    .filter((b) => b.unlocked)
    .map((b) => b.id);
}


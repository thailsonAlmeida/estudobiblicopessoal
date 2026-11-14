"use client";

import React from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Flame,
  Crown,
  ScrollText,
  Search,
  HeartHandshake,
  Sparkles,
  Award,
  CheckCircle2,
  Lock,
  ArrowRight,
} from "lucide-react";
import { db } from "@/lib/db";
import { evaluateBadges } from "@/lib/gamification/badges";
import { getGraceStreakState } from "@/lib/gamification/streak";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BADGE_ICONS = {
  ScrollText,
  Search,
  HeartHandshake,
  Flame,
  Crown,
  Sparkles,
} as const;

const SANCTUARY_LEVELS = [
  {
    id: "atrio" as const,
    name: "Átrio Exterior",
    subtitle: "Fundação do Hábito Diário",
    description:
      "Altar de Bronze & Pia de Purificação — Prática consistente dos Métodos Devocional e Resumo de Capítulo.",
  },
  {
    id: "lugar_santo" as const,
    name: "Lugar Santo",
    subtitle: "Nutrição e Investigação",
    description:
      "Mesa dos Pães & Altar de Incenso — Estudos Temáticos, Caráter, Biográficos, Tópicos, Morfológico e Histórico-Cultural.",
  },
  {
    id: "santo_dos_santos" as const,
    name: "Santo dos Santos",
    subtitle: "Mestria Exegética",
    description:
      "Arca da Aliança — A Grande Trilogia (Investigativo, Analítico, Sintético) e Versículo por Versículo.",
  },
];

export function SanctuaryRelicario() {
  const progress = useLiveQuery(() => db.progress.get("progress"));
  const streakState = getGraceStreakState(progress);
  const badges = evaluateBadges(progress);
  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const currentLevel = progress?.sanctuaryLevel ?? "atrio";
  const totalStudies = progress?.totalStudiesCompleted ?? 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <Badge variant="gold" className="mb-2">
            Jornada do Santuário & Relicário
          </Badge>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            O Santuário de Constância
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe sua caminhada espiritual sem culpa pela graça, as chamas
            da Menorá e as insígnias conquistadas.
          </p>
        </div>

        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
            <span>Novo Estudo</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Painel da Menorá de 7 Chamas */}
      <Card goldAccent>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Flame className="h-5 w-5 text-[var(--tabernacle-gold)] fill-[var(--tabernacle-gold)]" />
              <span>Menorá de 7 Chamas (Streaks da Graça)</span>
            </CardTitle>

            <div className="flex items-center gap-2">
              {streakState.isEmber && (
                <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/40">
                  Brasa Suave da Graça
                </Badge>
              )}
              <Badge variant="gold">
                {streakState.streakCount}{" "}
                {streakState.streakCount === 1 ? "dia acumulado" : "dias acumulados"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div
            aria-label="Hastes da Menorá"
            className="grid grid-cols-7 gap-1 sm:gap-4 p-2.5 sm:p-4 rounded-2xl bg-secondary/50 border border-border"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((dayIndex) => {
              const isLit = dayIndex <= streakState.litFlames;
              return (
                <div
                  key={dayIndex}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 sm:py-3 rounded-xl border transition-all",
                    isLit
                      ? streakState.isEmber
                        ? "bg-amber-500/10 border-amber-500/40"
                        : "bg-[var(--tabernacle-gold)]/15 border-[var(--tabernacle-gold)]/60 shadow-2xs"
                      : "bg-card/60 border-border/50 opacity-45"
                  )}
                >
                  <Flame
                    className={cn(
                      "h-6 w-6 sm:h-7 sm:w-7 transition-all",
                      isLit
                        ? streakState.isEmber
                          ? "text-amber-500 fill-amber-500/60"
                          : "text-[var(--tabernacle-gold)] fill-[var(--tabernacle-gold)] drop-shadow-[0_0_6px_rgba(212,175,55,0.6)]"
                        : "text-muted-foreground"
                    )}
                  />
                  <span className="text-[10px] font-semibold mt-1 text-muted-foreground">
                    Dia {dayIndex}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground/90">
              {streakState.encouragementMessage}
            </p>
            <span className="font-mono">
              Total de estudos concluídos: <strong>{totalStudies}</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Níveis do Santuário */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-foreground">
          Níveis do Santuário
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SANCTUARY_LEVELS.map((lvl, index) => {
            const currentIdx = SANCTUARY_LEVELS.findIndex(
              (item) => item.id === currentLevel
            );
            const isCurrent = lvl.id === currentLevel;
            const isReached = index <= currentIdx;

            return (
              <Card
                key={lvl.id}
                goldAccent={isCurrent}
                className={cn(
                  "transition-all",
                  isCurrent
                    ? "ring-2 ring-[var(--tabernacle-gold)]/70"
                    : isReached
                    ? "opacity-95"
                    : "opacity-65"
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        isCurrent ? "gold" : isReached ? "blue" : "outline"
                      }
                    >
                      {isCurrent
                        ? "Nível Atual"
                        : isReached
                        ? "Alcançado"
                        : "Próxima Etapa"}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">
                      0{index + 1}
                    </span>
                  </div>
                  <CardTitle className="text-lg pt-2">{lvl.name}</CardTitle>
                  <p className="text-xs font-medium text-[var(--tabernacle-gold)]">
                    {lvl.subtitle}
                  </p>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground leading-relaxed">
                  {lvl.description}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Relicário de Insígnias Bíblicas */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
              <Award className="h-5 w-5 text-[var(--tabernacle-gold)]" />
              <span>Relicário de Insígnias Bíblicas</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Conquistas espirituais baseadas em fidelidade e profundidade nos 12
              métodos.
            </p>
          </div>
          <Badge variant="gold">
            {unlockedCount} de {badges.length} desbloqueadas
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => {
            const IconComponent = BADGE_ICONS[badge.iconName];
            const percent = Math.round(
              (badge.progressCurrent / badge.progressTarget) * 100
            );

            return (
              <Card
                key={badge.id}
                goldAccent={badge.unlocked}
                className={cn(
                  "flex flex-col justify-between transition-all",
                  badge.unlocked
                    ? "bg-card"
                    : "bg-secondary/30 opacity-85"
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl border",
                        badge.unlocked
                          ? "bg-[var(--tabernacle-gold)]/15 border-[var(--tabernacle-gold)] text-[var(--tabernacle-gold)]"
                          : "bg-muted border-border text-muted-foreground"
                      )}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>

                    {badge.unlocked ? (
                      <Badge variant="gold" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Conquistada</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Lock className="h-3 w-3" />
                        <span>
                          {badge.progressCurrent}/{badge.progressTarget}
                        </span>
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-base">{badge.name}</CardTitle>
                  <p className="text-[11px] font-semibold text-[var(--tabernacle-blue)]">
                    {badge.reference}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3 pt-1">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {badge.description}
                  </p>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        badge.unlocked
                          ? "bg-[var(--tabernacle-gold)]"
                          : "bg-[var(--tabernacle-blue)]/60"
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}


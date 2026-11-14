"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Flame,
  Sparkles,
  Home,
  Award,
  Settings,
} from "lucide-react";
import { db } from "@/lib/db";
import { getGraceStreakState } from "@/lib/gamification/streak";
import { syncProgressWithDatabase } from "@/lib/gamification/progress-calculator";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MenorahLogo } from "@/components/brand/menorah-logo";

interface HeaderProps {
  streakDays?: number;
  isSaving?: boolean;
}

export function Header({ streakDays, isSaving = false }: HeaderProps) {
  const pathname = usePathname();
  const progress = useLiveQuery(() => db.progress.get("progress"));

  useEffect(() => {
    syncProgressWithDatabase().catch(() => {
      // Ignora erro silencioso em ambiente sem IndexedDB
    });
  }, []);

  const streakState =
    streakDays !== undefined
      ? {
          streakCount: streakDays,
          litFlames: Math.min(7, Math.max(0, streakDays)),
          isEmber: false,
          encouragementMessage: `${streakDays} dias de estudo`,
        }
      : getGraceStreakState(progress);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
        {/* Logotipo e Identidade do Tabernáculo (Menorá) */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--tabernacle-blue)] text-white shadow-sm transition-transform group-hover:scale-105 border border-[var(--tabernacle-gold)]/40">
            <MenorahLogo size={24} className="text-[var(--tabernacle-gold)]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-serif text-sm sm:text-base font-bold tracking-tight text-foreground flex items-center gap-1.5 truncate">
              <span className="truncate">Estudo Bíblico</span>
              <span className="hidden xs:inline">Pessoal</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--tabernacle-gold)] shrink-0"></span>
            </span>
            <span className="text-[11px] sm:text-xs text-muted-foreground hidden sm:inline truncate">
              12 Métodos • Inspirado no Tabernáculo
            </span>
          </div>
        </Link>

        {/* Menorá de 7 Chamas (Streaks da Graça) & Navegação */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {isSaving && (
            <span className="hidden lg:inline text-xs text-muted-foreground animate-pulse">
              Salvando...
            </span>
          )}
          <Link
            href="/santuario"
            title={streakState.encouragementMessage}
            className="hidden md:flex items-center gap-1.5 bg-secondary/80 border border-border px-3 py-1.5 rounded-xl hover:border-[var(--tabernacle-gold)]/60 transition-colors"
          >
            <span className="text-xs font-medium text-muted-foreground mr-1.5 flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-[var(--tabernacle-gold)]" />
              Menorá:
            </span>
            {[1, 2, 3, 4, 5, 6, 7].map((dayIndex) => {
              const isActive = dayIndex <= streakState.litFlames;
              return (
                <div
                  key={dayIndex}
                  title={`Dia ${dayIndex} da semana`}
                  className={cn(
                    "flex flex-col items-center justify-center transition-all",
                    isActive ? "opacity-100 scale-105" : "opacity-30"
                  )}
                >
                  <Flame
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive
                        ? streakState.isEmber
                          ? "text-amber-500 fill-amber-500/60"
                          : "text-[var(--tabernacle-gold)] fill-[var(--tabernacle-gold)] drop-shadow-[0_0_4px_rgba(212,175,55,0.6)]"
                        : "text-muted-foreground"
                    )}
                  />
                </div>
              );
            })}
            <Badge variant="gold" className="ml-1.5 text-[10px] px-1.5 py-0">
              {streakState.streakCount}{" "}
              {streakState.streakCount === 1 ? "dia" : "dias"}
            </Badge>
          </Link>

          {/* Navegação Rápida */}
          <nav aria-label="Navegação principal" className="flex items-center gap-1 sm:gap-1.5">
            <Link
              href="/"
              aria-current={pathname === "/" ? "page" : undefined}
              className={cn(
                "flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                pathname === "/"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Home className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Métodos</span>
            </Link>
            <Link
              href="/diario"
              aria-current={pathname.startsWith("/diario") ? "page" : undefined}
              className={cn(
                "flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                pathname.startsWith("/diario")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Diário</span>
            </Link>
            <Link
              href="/santuario"
              aria-current={pathname.startsWith("/santuario") ? "page" : undefined}
              className={cn(
                "flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                pathname.startsWith("/santuario")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Award className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Santuário</span>
            </Link>
            <Link
              href="/configuracoes"
              title="Configurações"
              aria-label="Configurações"
              aria-current={pathname.startsWith("/configuracoes") ? "page" : undefined}
              className={cn(
                "flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                pathname.startsWith("/configuracoes")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

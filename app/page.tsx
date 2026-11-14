"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  BookMarked,
  ShieldCheck,
  Flame,
  ArrowRight,
  Layers,
} from "lucide-react";
import { BIBLE_STUDY_METHODS } from "@/lib/constants/methods";
import { MethodCard } from "@/components/study/method-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  const methodsList = Object.values(BIBLE_STUDY_METHODS);

  const filteredMethods = methodsList.filter((m) => {
    if (selectedLevel === "all") return true;
    return m.sanctuaryLevel === selectedLevel;
  });

  return (
    <div className="space-y-12">
      {/* Hero Section Inspirada no Tabernáculo */}
      <section className="relative rounded-3xl border border-border bg-gradient-to-b from-secondary/60 via-card to-card p-5 sm:p-10 shadow-xs overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--tabernacle-gold)]/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--tabernacle-blue)]/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="gold" className="gap-1 px-3 py-1">
              <Sparkles className="h-3 w-3" />
              <span>Engenharia Sagrada & Modular</span>
            </Badge>
            <Badge variant="outline" className="text-xs">
              100% Offline & Local-First
            </Badge>
          </div>

          <h1 className="font-serif text-2xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            O Tabernáculo do{" "}
            <span className="text-[var(--tabernacle-blue)] underline decoration-[var(--tabernacle-gold)]/50 decoration-wavy decoration-2">
              Estudo Bíblico Pessoal
            </span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Descubra as riquezas inesgotáveis da Palavra de Deus através das{" "}
            <strong>12 maneiras de estudar a Bíblia sozinho</strong> de Rick Warren. 
            Cada método conduz você passo a passo através de assistentes guiados que ensinam a 
            razão teológica de cada pergunta, salvando seus registros com privacidade absoluta no seu próprio dispositivo.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <Link href="/estudo/01_DEVOCIONAL/novo" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-auto min-h-12 py-3 px-4 sm:px-6 gap-2 cursor-pointer shadow-md font-semibold whitespace-normal text-center leading-snug"
              >
                <Flame className="h-4 w-4 shrink-0 text-[var(--tabernacle-gold)] fill-[var(--tabernacle-gold)]" />
                <span>Começar Estudo Devocional (15 min)</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Button>
            </Link>

            <Link href="/diario" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto gap-2 cursor-pointer"
              >
                <BookMarked className="h-4 w-4 shrink-0 text-[var(--tabernacle-blue)]" />
                <span>Abrir Meu Diário</span>
              </Button>
            </Link>
          </div>

          {/* Destaques de Confiança e Metodologia */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border/60 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Dados salvos exclusivamente no seu aparelho</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[var(--tabernacle-blue)] shrink-0" />
              <span>Do iniciante à exegese de livros inteiros</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-[var(--tabernacle-gold)] shrink-0" />
              <span>Gamificação graciosa com a Menorá de 7 chamas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Seção dos Métodos e Filtro dos Níveis do Santuário */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Os 12 Métodos de Rick Warren
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Escolha um método adequado ao seu tempo e objetivo espiritual de hoje.
            </p>
          </div>

          {/* Abas dos Níveis do Santuário */}
          <div
            role="group"
            aria-label="Filtrar métodos por nível do Santuário"
            className="grid grid-cols-2 sm:inline-flex items-center gap-1.5 p-1 rounded-xl bg-secondary/60 border border-border w-full sm:w-auto"
          >
            {[
              { id: "all", label: "Todos (12)" },
              { id: "atrio", label: "Átrio Exterior (1-2)" },
              { id: "lugar_santo", label: "Lugar Santo (3-8)" },
              { id: "santo_dos_santos", label: "Santo dos Santos (9-12)" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={selectedLevel === tab.id}
                onClick={() => setSelectedLevel(tab.id)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selectedLevel === tab.id
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grade de Cards dos Métodos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMethods.map((method) => (
            <MethodCard key={method.id} method={method} />
          ))}
        </div>
      </section>
    </div>
  );
}

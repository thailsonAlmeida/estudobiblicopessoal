"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Flame } from "lucide-react";
import { MethodId } from "@/lib/types/study";
import { getMethodBiblicalEncouragement } from "@/lib/constants/biblical-encouragements";
import { Button } from "@/components/ui/button";

export interface StudyCompletionCardProps {
  methodId: MethodId;
  title: string;
  subtitle?: string;
  onEdit?: () => void;
  onViewDiary?: () => void;
  viewDiaryLabel?: string;
}

export function StudyCompletionCard({
  methodId,
  title,
  subtitle,
  onEdit,
  onViewDiary,
  viewDiaryLabel = "Ir para o Diário de Estudos",
}: StudyCompletionCardProps) {
  const router = useRouter();
  const encouragement = getMethodBiblicalEncouragement(methodId);

  const handleViewDiary = () => {
    if (onViewDiary) {
      onViewDiary();
    } else {
      router.push("/diario");
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--tabernacle-gold)] bg-[var(--tabernacle-gold)]/10 p-5 text-center space-y-3 animate-in fade-in-50 duration-300">
      <div className="flex justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--tabernacle-gold)] text-white shadow-md">
          <Flame className="h-6 w-6 fill-white" aria-hidden="true" />
        </div>
      </div>

      <h3 className="font-serif text-lg font-bold text-foreground">
        {title}
      </h3>

      {/* Palavra de incentivo e esperança do personagem bíblico associado ao método */}
      <blockquote className="max-w-md mx-auto rounded-xl bg-background/85 border border-[var(--tabernacle-gold)]/35 px-4 py-3 text-xs space-y-1.5 shadow-2xs">
        <p className="font-serif italic text-foreground leading-relaxed">
          &ldquo;{encouragement.quote}&rdquo;
        </p>
        <footer className="text-[11px] font-semibold text-[var(--tabernacle-blue)]">
          — {encouragement.character} ({encouragement.reference})
        </footer>
      </blockquote>

      {subtitle && (
        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}

      <div className="pt-1 flex flex-wrap justify-center gap-2.5">
        {onEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="cursor-pointer"
          >
            Editar Estudo
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleViewDiary}
          className="cursor-pointer"
        >
          {viewDiaryLabel}
        </Button>
      </div>
    </div>
  );
}


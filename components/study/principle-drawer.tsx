"use client";

import React from "react";
import { Lightbulb, BookOpen, Quote, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PrincipleDrawerProps {
  stepTitle: string;
  theologicalPrinciple: string;
  whyThisStep: string;
  goldenTip: string;
  exampleFromBook?: string;
  buttonLabel?: string;
}

export function PrincipleDrawer({
  stepTitle,
  theologicalPrinciple,
  whyThisStep,
  goldenTip,
  exampleFromBook,
  buttonLabel = "Ver Princípio Hermenêutico",
}: PrincipleDrawerProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs text-[var(--tabernacle-blue)] border-[var(--tabernacle-blue)]/30 hover:bg-[var(--tabernacle-blue)]/5 hover:border-[var(--tabernacle-blue)] cursor-pointer"
        >
          <Lightbulb className="h-3.5 w-3.5 text-[var(--tabernacle-gold)]" />
          <span>{buttonLabel}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--tabernacle-gold)]/20 text-[var(--tabernacle-gold)]">
              <Lightbulb className="h-4 w-4" />
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-[var(--tabernacle-gold)]">
              O Ensinamento do Mestre • Rick Warren
            </span>
          </div>
          <DialogTitle>{stepTitle}</DialogTitle>
          <DialogDescription>
            A razão de existir deste passo e como ele transforma seu estudo bíblico.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-sm text-foreground/90">
          {/* Princípio Teológico */}
          <div className="rounded-xl bg-secondary/60 border border-border p-4">
            <h4 className="flex items-center gap-1.5 font-semibold text-foreground text-xs uppercase tracking-wider mb-2">
              <BookOpen className="h-4 w-4 text-[var(--tabernacle-blue)]" />
              O Princípio Bíblico Fundamental
            </h4>
            <p className="leading-relaxed text-muted-foreground">
              {theologicalPrinciple}
            </p>
          </div>

          {/* Por que dar este passo */}
          <div className="space-y-1.5">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Por que fazemos desta forma?
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              {whyThisStep}
            </p>
          </div>

          {/* Dica de Ouro de Rick Warren */}
          <div className="rounded-xl border border-[var(--tabernacle-gold)]/40 bg-[var(--tabernacle-gold)]/5 p-4">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Quote className="h-4 w-4 text-[var(--tabernacle-gold)]" />
              Dica Prática de Ouro
            </h4>
            <p className="text-muted-foreground italic leading-relaxed">
              &ldquo;{goldenTip}&rdquo;
            </p>
          </div>

          {/* Exemplo do Livro */}
          {exampleFromBook && (
            <div className="rounded-xl border border-border bg-muted/40 p-3.5 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground block mb-1">
                Exemplo Real do Livro:
              </span>
              <p className="leading-relaxed font-mono text-[11px] whitespace-pre-line">
                {exampleFromBook}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


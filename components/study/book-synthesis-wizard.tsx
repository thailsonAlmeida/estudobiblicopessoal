"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Puzzle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Flame,
  Plus,
  Trash2,
  ListTree,
  Share2,
  AlertCircle,
} from "lucide-react";
import { db } from "@/lib/db";
import { buildUpdatedUserProgress } from "@/lib/gamification/progress-calculator";
import { playSoftShofarSound } from "@/lib/gamification/celebration-sound";
import { StudyCompletionCard } from "./study-completion-card";
import {
  Study,
  Application4P,
  Application4PSchema,
} from "@/lib/types/study";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrincipleDrawer } from "./principle-drawer";

export type SynthesisOutlineCode = "I" | "A" | "1";

export interface FinalOutlineItem {
  code: SynthesisOutlineCode;
  heading: string;
  passageRange: string;
}

export interface BookSynthesisWizardProps {
  studyId: string;
  initialStudy?: Study;
  onComplete?: (study: Study) => void;
}

const VALIDATION_ERROR_MSG =
  "Para concluir o estudo, marque os 4 critérios da aplicação (Pessoal, Prática, Possível e Provável) e descreva o passo de ação mensurável.";

const DEFAULT_OUTLINE_ITEMS: FinalOutlineItem[] = [
  { code: "I", heading: "", passageRange: "" },
];

const CODE_INDENT: Record<SynthesisOutlineCode, string> = {
  I: "pl-0",
  A: "sm:pl-6",
  "1": "sm:pl-12",
};

const getStringField = (
  formData: Record<string, unknown> | undefined,
  key: string,
  fallback = ""
): string => {
  const val = formData?.[key];
  return typeof val === "string" ? val : fallback;
};

const isFinalOutlineItem = (val: unknown): val is FinalOutlineItem => {
  if (typeof val !== "object" || val === null) return false;
  const r = val as Record<string, unknown>;
  return (
    (r.code === "I" || r.code === "A" || r.code === "1") &&
    typeof r.heading === "string" &&
    typeof r.passageRange === "string"
  );
};

const getFinalOutlineField = (
  formData: Record<string, unknown> | undefined
): FinalOutlineItem[] => {
  const val = formData?.finalOutlineItems;
  if (Array.isArray(val) && val.length > 0 && val.every(isFinalOutlineItem)) {
    return val;
  }
  return DEFAULT_OUTLINE_ITEMS;
};

export function BookSynthesisWizard({
  studyId,
  initialStudy,
  onComplete,
}: BookSynthesisWizardProps) {
  const fd = initialStudy?.formData;

  const [currentStep, setCurrentStep] = useState(
    initialStudy?.currentStep || 1
  );
  const [book, setBook] = useState(initialStudy?.book || "");
  const [title, setTitle] = useState(initialStudy?.title || "");

  // Fase 1: Etapa 1 (Releitura) + Etapa 3 (Título Descritivo Final)
  const [readingsCount, setReadingsCount] = useState(
    getStringField(fd, "readingsCount")
  );
  const [rereadingNotes, setRereadingNotes] = useState(
    getStringField(fd, "rereadingNotes")
  );

  // Fase 2: Etapa 2 (Esboço Final e Detalhado)
  const [finalOutlineItems, setFinalOutlineItems] = useState<
    FinalOutlineItem[]
  >(getFinalOutlineField(fd));

  // Fase 3: Etapas 4, 5 e 6
  const [theologicalSummary, setTheologicalSummary] = useState(
    getStringField(fd, "theologicalSummary")
  );
  const [sharingPlan, setSharingPlan] = useState(
    getStringField(fd, "sharingPlan")
  );

  const [applicationText, setApplicationText] = useState(
    initialStudy?.application4P?.text || ""
  );
  const [isPersonal, setIsPersonal] = useState(
    initialStudy?.application4P?.isPersonal || false
  );
  const [isPractical, setIsPractical] = useState(
    initialStudy?.application4P?.isPractical || false
  );
  const [isPossible, setIsPossible] = useState(
    initialStudy?.application4P?.isPossible || false
  );
  const [isMeasurable, setIsMeasurable] = useState(
    initialStudy?.application4P?.isMeasurable || false
  );
  const [deadline, setDeadline] = useState(
    initialStudy?.application4P?.deadline || ""
  );

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [isCompleted, setIsCompleted] = useState(
    initialStudy?.status === "completed"
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [createdAtRef, setCreatedAtRef] = useState<string | undefined>(
    initialStudy?.createdAt
  );
  const [completedAtRef, setCompletedAtRef] = useState<string | undefined>(
    initialStudy?.completedAt
  );

  const [hydrated, setHydrated] = useState(Boolean(initialStudy));
  const [hasUserEdited, setHasUserEdited] = useState(false);

  const markDirty = () => {
    if (!hasUserEdited) {
      setHasUserEdited(true);
    }
  };

  useEffect(() => {
    if (hydrated || hasUserEdited) {
      return;
    }

    let active = true;
    const loader = initialStudy
      ? Promise.resolve(initialStudy)
      : db.studies.get(studyId);

    loader
      .then((existing) => {
        if (!active || !existing || hasUserEdited) return;
        const data = existing.formData;
        setCurrentStep(existing.currentStep || 1);
        setBook(existing.book || "");
        setTitle(existing.title || "");
        setReadingsCount(getStringField(data, "readingsCount"));
        setRereadingNotes(getStringField(data, "rereadingNotes"));
        setFinalOutlineItems(getFinalOutlineField(data));
        setTheologicalSummary(getStringField(data, "theologicalSummary"));
        setSharingPlan(getStringField(data, "sharingPlan"));
        setApplicationText(existing.application4P?.text || "");
        setIsPersonal(Boolean(existing.application4P?.isPersonal));
        setIsPractical(Boolean(existing.application4P?.isPractical));
        setIsPossible(Boolean(existing.application4P?.isPossible));
        setIsMeasurable(Boolean(existing.application4P?.isMeasurable));
        setDeadline(existing.application4P?.deadline || "");
        setIsCompleted(existing.status === "completed");
        setCreatedAtRef(existing.createdAt);
        setCompletedAtRef(existing.completedAt);
        setHydrated(true);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [initialStudy, studyId, hydrated, hasUserEdited]);

  const buildStudyRecord = (completedOverride?: {
    status: "draft" | "completed";
    completedAt?: string;
  }): Study => {
    const now = new Date().toISOString();
    const resolvedTitle =
      title.trim() ||
      (book.trim()
        ? `Síntese do Livro: ${book.trim()}`
        : "Método Sintético do Livro");

    const app4P: Application4P = {
      text: applicationText,
      isPersonal,
      isPractical,
      isPossible,
      isMeasurable,
      deadline,
    };

    const status = completedOverride
      ? completedOverride.status
      : isCompleted
      ? "completed"
      : "draft";

    const resolvedCompletedAt = completedOverride
      ? completedOverride.completedAt
      : isCompleted
      ? completedAtRef || now
      : undefined;

    return {
      id: studyId,
      methodId: "11_SINTETICO",
      title: resolvedTitle,
      book,
      verses: "",
      status,
      currentStep,
      formData: {
        readingsCount,
        rereadingNotes,
        finalOutlineItems,
        theologicalSummary,
        sharingPlan,
      },
      application4P: app4P,
      tags: ["sintetico", "trilogia", "esboco-final"],
      createdAt: createdAtRef || now,
      updatedAt: now,
      completedAt: resolvedCompletedAt,
    };
  };

  // Auto-save com debounce de 600ms quando livro ou título estiver preenchido
  useEffect(() => {
    if (book.trim() === "" && title.trim() === "") {
      return;
    }

    const timer = window.setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const now = new Date().toISOString();
        const resolvedTitle =
          title.trim() || `Síntese do Livro: ${book.trim()}`;
        const app4P: Application4P = {
          text: applicationText,
          isPersonal,
          isPractical,
          isPossible,
          isMeasurable,
          deadline,
        };

        const record: Study = {
          id: studyId,
          methodId: "11_SINTETICO",
          title: resolvedTitle,
          book,
          verses: "",
          status: isCompleted ? "completed" : "draft",
          currentStep,
          formData: {
            readingsCount,
            rereadingNotes,
            finalOutlineItems,
            theologicalSummary,
            sharingPlan,
          },
          application4P: app4P,
          tags: ["sintetico", "trilogia", "esboco-final"],
          createdAt: createdAtRef || now,
          updatedAt: now,
          completedAt: isCompleted ? completedAtRef || now : undefined,
        };

        if (!createdAtRef) {
          setCreatedAtRef(now);
        }
        await db.studies.put(record);
        setSaveStatus("saved");
      } catch (err) {
        console.error("Erro no auto-save:", err);
        setSaveStatus("idle");
      }
    }, 600);

    return () => window.clearTimeout(timer);
  }, [
    studyId,
    currentStep,
    book,
    title,
    readingsCount,
    rereadingNotes,
    finalOutlineItems,
    theologicalSummary,
    sharingPlan,
    applicationText,
    isPersonal,
    isPractical,
    isPossible,
    isMeasurable,
    deadline,
    isCompleted,
    createdAtRef,
    completedAtRef,
  ]);

  const handleAddOutlineItem = () => {
    markDirty();
    setFinalOutlineItems((prev) => [
      ...prev,
      { code: "A", heading: "", passageRange: "" },
    ]);
  };

  const handleUpdateOutlineItem = (
    index: number,
    field: keyof FinalOutlineItem,
    value: string
  ) => {
    markDirty();
    setFinalOutlineItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        if (field === "code") {
          const validCode: SynthesisOutlineCode =
            value === "I" || value === "A" || value === "1" ? value : "A";
          return { ...item, code: validCode };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleRemoveOutlineItem = (index: number) => {
    if (finalOutlineItems.length <= 1) return;
    markDirty();
    setFinalOutlineItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const all4PsChecked =
    isPersonal && isPractical && isPossible && isMeasurable;

  const handleFinalize = async () => {
    const parsed4P = Application4PSchema.safeParse({
      text: applicationText.trim(),
      isPersonal,
      isPractical,
      isPossible,
      isMeasurable,
      deadline,
    });

    if (
      !parsed4P.success ||
      !all4PsChecked ||
      applicationText.trim().length === 0
    ) {
      setValidationError(VALIDATION_ERROR_MSG);
      return;
    }

    setValidationError(null);
    const now = new Date().toISOString();
    setCompletedAtRef(now);
    setIsCompleted(true);
    playSoftShofarSound();

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#D4AF37", "#5C2A6B", "#1B4965"],
    });

    const completedRecord = buildStudyRecord({
      status: "completed",
      completedAt: now,
    });

    try {
      await db.transaction("rw", db.studies, db.progress, async () => {
        await db.studies.put(completedRecord);

        const currentProg = await db.progress.get("progress");
        await db.progress.put(
          buildUpdatedUserProgress(
            currentProg,
            "11_SINTETICO",
            now.split("T")[0]
          )
        );
      });
      setSaveStatus("saved");
    } catch (err) {
      console.error("Erro ao concluir método sintético:", err);
    }

    onComplete?.(completedRecord);
  };

  const fourPsItems = [
    {
      id: "personal",
      label: '1. Pessoal (usei "Eu", "Mim")',
      checked: isPersonal,
      onChange: (val: boolean) => {
        markDirty();
        setIsPersonal(val);
      },
    },
    {
      id: "practical",
      label: "2. Prático (ação definida)",
      checked: isPractical,
      onChange: (val: boolean) => {
        markDirty();
        setIsPractical(val);
      },
    },
    {
      id: "possible",
      label: "3. Possível (viável pela graça)",
      checked: isPossible,
      onChange: (val: boolean) => {
        markDirty();
        setIsPossible(val);
      },
    },
    {
      id: "measurable",
      label: "4. Provável / Mensurável (prazo definido)",
      checked: isMeasurable,
      onChange: (val: boolean) => {
        markDirty();
        setIsMeasurable(val);
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="gold">Método 11</Badge>
            <Badge variant="gold">Santo dos Santos</Badge>
            <span
              aria-live="polite"
              className="text-[11px] text-muted-foreground font-medium"
            >
              {saveStatus === "saving" && "• Salvando..."}
              {saveStatus === "saved" && "✓ Salvo automaticamente"}
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground mt-1">
            Método Sintético do Livro
          </h1>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { num: 1, label: "1. Releitura & Título Final" },
            { num: 2, label: "2. Esboço Final Detalhado" },
            { num: 3, label: "3. Descobertas, 4Ps & Compartilhamento" },
          ].map((fase) => (
            <button
              key={fase.num}
              type="button"
              onClick={() => setCurrentStep(fase.num)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentStep === fase.num
                  ? "bg-[var(--tabernacle-gold)] text-stone-950 shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {fase.label}
            </button>
          ))}
        </div>
      </div>

      {/* FASE 1: RELEITURA & TÍTULO FINAL */}
      {currentStep === 1 && (
        <Card goldAccent>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Puzzle className="h-5 w-5 text-[var(--tabernacle-gold)]" />
                Fase 1: Releitura Contínua & Título Descritivo Final
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Unindo a Sinfonia (Grande Trilogia — Passo 3)"
                theologicalPrinciple="Depois do panorama (Método 09) e da análise microscópica de cada capítulo (Método 10), você remonta o livro inteiro como quem contempla uma sinfonia completa."
                whyThisStep="Releia o livro continuamente (Etapa 1) com todas as análises em mente para batizá-lo com seu Título Descritivo Final (Etapa 3)."
                goldenTip="O título descritivo deve resumir a mensagem singular do livro de forma memorável e fiel ao texto."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="synthesis-book"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Livro Bíblico Sintetizado
                </label>
                <Input
                  id="synthesis-book"
                  value={book}
                  onChange={(e) => {
                    markDirty();
                    setBook(e.target.value);
                  }}
                  placeholder="Ex.: Efésios, Romanos, Habacuque..."
                />
              </div>

              <div>
                <label
                  htmlFor="synthesis-readings"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Total de Leituras Realizadas
                </label>
                <Input
                  id="synthesis-readings"
                  value={readingsCount}
                  onChange={(e) => {
                    markDirty();
                    setReadingsCount(e.target.value);
                  }}
                  placeholder="Ex.: 7 leituras completas"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="synthesis-title"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Título Descritivo Final do Livro (Etapa 3)
              </label>
              <Input
                id="synthesis-title"
                value={title}
                onChange={(e) => {
                  markDirty();
                  setTitle(e.target.value);
                }}
                placeholder="Ex.: A Igreja: Riqueza em Cristo, Andar no Espírito e Combate"
              />
            </div>

            <div>
              <label
                htmlFor="synthesis-rereading"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Notas da Releitura Contínua (Etapa 1)
              </label>
              <Textarea
                id="synthesis-rereading"
                rows={4}
                value={rereadingNotes}
                onChange={(e) => {
                  markDirty();
                  setRereadingNotes(e.target.value);
                }}
                placeholder="Quais conexões entre os capítulos iniciais e finais ficaram evidentes nesta releitura final?"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="gap-2 cursor-pointer"
              >
                <span>Avançar: Esboço Final Detalhado</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 2: ESBOÇO FINAL DETALHADO */}
      {currentStep === 2 && (
        <Card goldAccent>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <ListTree className="h-5 w-5 text-[var(--tabernacle-gold)]" />
                Fase 2: Construtor do Esboço Final e Detalhado (Etapa 2)
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Fusão do Esboço Experimental com as Análises"
                theologicalPrinciple="Um bom esboço sintético reflete fielmente os pontos de virada do autor inspirado, estruturados do macro (I) ao micro (A, 1)."
                whyThisStep="Aqui você funde o esboço provisório do Método 09 com cada descoberta minuciosa do Método 10 em uma planta arquitetônica permanente."
                goldenTip="Use divisões principais (I, II, III) para os grandes blocos do livro e subtópicos (A, B, 1, 2) para os capítulos analisados."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Estruture o livro hierarquicamente com divisões (I), subtópicos
                (A) e pontos (1).
              </span>
              <Badge variant="gold">
                {finalOutlineItems.length}{" "}
                {finalOutlineItems.length === 1 ? "Divisão" : "Divisões"}
              </Badge>
            </div>

            <div className="space-y-3">
              {finalOutlineItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col sm:flex-row gap-2 items-stretch sm:items-center rounded-xl border border-border bg-secondary/30 p-3 ${CODE_INDENT[item.code]}`}
                >
                  <select
                    aria-label={`Nível da divisão ${idx + 1}`}
                    value={item.code}
                    onChange={(e) =>
                      handleUpdateOutlineItem(idx, "code", e.target.value)
                    }
                    className="h-9 rounded-lg border border-input bg-card px-2.5 text-xs font-bold text-foreground cursor-pointer"
                  >
                    <option value="I">I (Divisão Principal)</option>
                    <option value="A">A (Subtópico)</option>
                    <option value="1">1 (Ponto Detalhado)</option>
                  </select>

                  <Input
                    aria-label={`Título da divisão ${idx + 1}`}
                    className="flex-1"
                    value={item.heading}
                    onChange={(e) =>
                      handleUpdateOutlineItem(idx, "heading", e.target.value)
                    }
                    placeholder="Título da divisão / tema da seção"
                  />

                  <Input
                    aria-label={`Referência da divisão ${idx + 1}`}
                    className="sm:w-44"
                    value={item.passageRange}
                    onChange={(e) =>
                      handleUpdateOutlineItem(
                        idx,
                        "passageRange",
                        e.target.value
                      )
                    }
                    placeholder="Ex.: Caps. 1-3"
                  />

                  {finalOutlineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Remover divisão ${idx + 1}`}
                      onClick={() => handleRemoveOutlineItem(idx)}
                      className="h-9 px-2 text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleAddOutlineItem}
              className="w-full gap-2 border-dashed cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Divisão ao Esboço Final</span>
            </Button>

            <div className="flex justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="gap-2 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="gap-2 cursor-pointer"
              >
                <span>Avançar: Descobertas & Compartilhamento</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 3: DESCOBERTAS, 4PS & COMPARTILHAMENTO */}
      {currentStep === 3 && (
        <Card goldAccent>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Fase 3: Descobertas Teológicas, Aplicação (4Ps) & Discipulado
              </CardTitle>
              <PrincipleDrawer
                stepTitle="O Canal Que Transborda"
                theologicalPrinciple="Deus não revela Sua Palavra para nos transformar em reservatórios estagnados, mas em canais vivos para edificar outras pessoas."
                whyThisStep="Além de aplicar pessoalmente o livro (Etapa 5), trace um plano concreto para ensinar ou compartilhar suas descobertas (Etapa 6)."
                goldenTip="Defina nome e ocasião em que você compartilhará um resumo de 5 minutos deste livro com alguém."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="synthesis-theological"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Resumo das Conclusões e Tema Central (Etapa 4)
              </label>
              <Textarea
                id="synthesis-theological"
                rows={4}
                value={theologicalSummary}
                onChange={(e) => {
                  markDirty();
                  setTheologicalSummary(e.target.value);
                }}
                placeholder="Quais foram as maiores descobertas teológicas e práticas que emergiram ao contemplar o livro por inteiro?"
              />
            </div>

            <div>
              <label
                htmlFor="synthesis-sharing"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1.5"
              >
                <Share2 className="h-3.5 w-3.5 text-[var(--tabernacle-gold)]" />
                <span>
                  Plano para Compartilhar com Outra Pessoa (Etapa 6)
                </span>
              </label>
              <Textarea
                id="synthesis-sharing"
                rows={3}
                value={sharingPlan}
                onChange={(e) => {
                  markDirty();
                  setSharingPlan(e.target.value);
                }}
                placeholder="Com quem, quando e de que forma (célula, devocional em família, estudo bíblico) você transmitirá este livro?"
              />
            </div>

            <div className="rounded-2xl border border-border bg-secondary/50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="synthesis-application"
                  className="text-xs font-semibold uppercase tracking-wider text-foreground"
                >
                  Aplicação Pessoal Consolidada (Etapa 5 — Regra dos 4Ps)
                </label>
                {all4PsChecked ? (
                  <Badge variant="blue" className="text-[10px]">
                    4Ps Validados ✓
                  </Badge>
                ) : (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400">
                    Marque os 4 critérios para concluir
                  </span>
                )}
              </div>

              <Textarea
                id="synthesis-application"
                rows={3}
                value={applicationText}
                onChange={(e) => {
                  markDirty();
                  setApplicationText(e.target.value);
                }}
                placeholder="Síntese prática em primeira pessoa para transformar sua rotina após concluir a Grande Trilogia..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {fourPsItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border/60 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => item.onChange(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-[var(--tabernacle-gold)] cursor-pointer"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <div>
                <label
                  htmlFor="synthesis-deadline"
                  className="text-[11px] font-semibold text-muted-foreground block mb-1"
                >
                  Prazo para Cumprimento:
                </label>
                <Input
                  id="synthesis-deadline"
                  className="h-9 text-xs"
                  value={deadline}
                  onChange={(e) => {
                    markDirty();
                    setDeadline(e.target.value);
                  }}
                  placeholder="Ex.: Nos próximos 30 dias"
                />
              </div>
            </div>

            {validationError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            {isCompleted ? (
              <StudyCompletionCard
                methodId="11_SINTETICO"
                title="Síntese do Livro Concluída!"
                subtitle={`O esboço final de "${title || book}" e seu plano de compartilhamento foram gravados no diário.`}
                onEdit={() => setIsCompleted(false)}
              />
            ) : (
              <div className="flex justify-between items-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="gap-2 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar</span>
                </Button>
                <Button
                  type="button"
                  variant="gold"
                  onClick={handleFinalize}
                  className="gap-2 font-bold cursor-pointer"
                >
                  <Flame className="h-4 w-4 fill-current" />
                  <span>Concluir e Acender Menorá</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

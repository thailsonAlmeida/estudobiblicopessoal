"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Landmark,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Flame,
  MapPin,
  History,
  Users,
  Scale,
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

export interface HistoricalCulturalWizardProps {
  studyId: string;
  initialStudy?: Study;
  onComplete?: (study: Study) => void;
}

const VALIDATION_ERROR_MSG =
  "Para concluir o estudo, marque os 4 critérios da aplicação (Pessoal, Prática, Possível e Provável) e descreva o passo de ação mensurável.";

const getStringField = (
  formData: Record<string, unknown> | undefined,
  key: string,
  fallback = ""
): string => {
  const val = formData?.[key];
  return typeof val === "string" ? val : fallback;
};

export function HistoricalCulturalWizard({
  studyId,
  initialStudy,
  onComplete,
}: HistoricalCulturalWizardProps) {
  const fd = initialStudy?.formData;

  const [currentStep, setCurrentStep] = useState(
    initialStudy?.currentStep || 1
  );
  // Fase 1: Etapas 1 e 2
  const [title, setTitle] = useState(initialStudy?.title || "");
  const [book, setBook] = useState(initialStudy?.book || "");
  const [verses, setVerses] = useState(initialStudy?.verses || "");
  const [referenceTools, setReferenceTools] = useState(
    getStringField(fd, "referenceTools")
  );

  // Fase 2: Etapas 3 a 6 (Os 4 Cenários em Matriz 2x2)
  const [geographyScenario, setGeographyScenario] = useState(
    getStringField(fd, "geographyScenario")
  );
  const [historyScenario, setHistoryScenario] = useState(
    getStringField(fd, "historyScenario")
  );
  const [cultureScenario, setCultureScenario] = useState(
    getStringField(fd, "cultureScenario")
  );
  const [politicsScenario, setPoliticsScenario] = useState(
    getStringField(fd, "politicsScenario")
  );

  // Fase 3: Etapas 7 e 8
  const [researchSummary, setResearchSummary] = useState(
    getStringField(fd, "researchSummary")
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
        setTitle(existing.title || "");
        setBook(existing.book || "");
        setVerses(existing.verses || "");
        setReferenceTools(getStringField(data, "referenceTools"));
        setGeographyScenario(getStringField(data, "geographyScenario"));
        setHistoryScenario(getStringField(data, "historyScenario"));
        setCultureScenario(getStringField(data, "cultureScenario"));
        setPoliticsScenario(getStringField(data, "politicsScenario"));
        setResearchSummary(getStringField(data, "researchSummary"));
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
    const trimmedTitle = title.trim();
    const resolvedTitle =
      trimmedTitle ||
      (book.trim()
        ? `Contexto Histórico-Cultural: ${book.trim()}`
        : "Estudo Histórico-Cultural");

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
      methodId: "08_HISTORICO_CULTURAL",
      title: resolvedTitle,
      book,
      verses,
      status,
      currentStep,
      formData: {
        referenceTools,
        geographyScenario,
        historyScenario,
        cultureScenario,
        politicsScenario,
        researchSummary,
      },
      application4P: app4P,
      tags: ["historico-cultural", "contexto"],
      createdAt: createdAtRef || now,
      updatedAt: now,
      completedAt: resolvedCompletedAt,
    };
  };

  // Auto-save com debounce de 600ms quando o título ou livro for preenchido
  useEffect(() => {
    if (title.trim() === "" && book.trim() === "") {
      return;
    }

    const timer = window.setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const now = new Date().toISOString();
        const resolvedTitle =
          title.trim() || `Contexto Histórico-Cultural: ${book.trim()}`;
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
          methodId: "08_HISTORICO_CULTURAL",
          title: resolvedTitle,
          book,
          verses,
          status: isCompleted ? "completed" : "draft",
          currentStep,
          formData: {
            referenceTools,
            geographyScenario,
            historyScenario,
            cultureScenario,
            politicsScenario,
            researchSummary,
          },
          application4P: app4P,
          tags: ["historico-cultural", "contexto"],
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
    title,
    book,
    verses,
    referenceTools,
    geographyScenario,
    historyScenario,
    cultureScenario,
    politicsScenario,
    researchSummary,
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
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: ["#5C2A6B", "#D4AF37", "#1B4965"],
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
            "08_HISTORICO_CULTURAL",
            now.split("T")[0]
          )
        );
      });
      setSaveStatus("saved");
    } catch (err) {
      console.error("Erro ao concluir estudo histórico-cultural:", err);
    }

    onComplete?.(completedRecord);
  };

  const scenarios = [
    {
      id: "hist-geography",
      label: "1. Cenário Geográfico (Etapa 3)",
      icon: MapPin,
      value: geographyScenario,
      onChange: setGeographyScenario,
      placeholder:
        "Relevo, clima, estradas comerciais, distância de cidades e impacto local...",
    },
    {
      id: "hist-history",
      label: "2. Cenário Histórico (Etapa 4)",
      icon: History,
      value: historyScenario,
      onChange: setHistoryScenario,
      placeholder:
        "Datação aproximada, acontecimentos recentes, império reinante e crises...",
    },
    {
      id: "hist-culture",
      label: "3. Cenário Cultural (Etapa 5)",
      icon: Users,
      value: cultureScenario,
      onChange: setCultureScenario,
      placeholder:
        "Costumes cotidianos, estrutura familiar, vestuário, economia e religiões...",
    },
    {
      id: "hist-politics",
      label: "4. Cenário Político (Etapa 6)",
      icon: Scale,
      value: politicsScenario,
      onChange: setPoliticsScenario,
      placeholder:
        "Sistema de governo, autoridades romanas/judaicas, impostos e pressões civis...",
    },
  ];

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
            <Badge variant="purple">Método 08</Badge>
            <Badge variant="purple">Lugar Santo</Badge>
            <span
              aria-live="polite"
              className="text-[11px] text-muted-foreground font-medium"
            >
              {saveStatus === "saving" && "• Salvando..."}
              {saveStatus === "saved" && "✓ Salvo automaticamente"}
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground mt-1">
            Método Histórico-Cultural e Contextual
          </h1>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { num: 1, label: "1. Passagem & Fontes" },
            { num: 2, label: "2. Os 4 Cenários" },
            { num: 3, label: "3. Síntese & 4Ps" },
          ].map((fase) => (
            <button
              key={fase.num}
              type="button"
              onClick={() => setCurrentStep(fase.num)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentStep === fase.num
                  ? "bg-[var(--tabernacle-purple)] text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {fase.label}
            </button>
          ))}
        </div>
      </div>

      {/* FASE 1: PASSAGEM & FONTES */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Landmark className="h-5 w-5 text-[var(--tabernacle-purple)]" />
                Fase 1: Passagem Bíblica & Ferramentas de Consulta
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Viaje para o Mundo dos Primeiros Ouvintes"
                theologicalPrinciple="Um texto nunca pode significar hoje o que jamais significou para quem o recebeu originalmente."
                whyThisStep="Reunir primeiro a passagem e listar as fontes históricas evita projetar nossa cultura ocidental moderna sobre narrativas e cartas antigas."
                goldenTip="Consulte um Atlas Bíblico, um Dicionário Bíblico e um Manual de Usos e Costumes antes de fechar qualquer interpretação."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <label
                htmlFor="hist-title"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Título ou Tema Histórico-Cultural (Etapa 1)
              </label>
              <Input
                id="hist-title"
                value={title}
                onChange={(e) => {
                  markDirty();
                  setTitle(e.target.value);
                }}
                placeholder="Ex.: A Igreja em Laodiceia — Águas Morna e Fria (Ap 3:14-22)"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="hist-book"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Livro Bíblico
                </label>
                <Input
                  id="hist-book"
                  value={book}
                  onChange={(e) => {
                    markDirty();
                    setBook(e.target.value);
                  }}
                  placeholder="Ex.: Atos dos Apóstolos / 1 Coríntios"
                />
              </div>

              <div>
                <label
                  htmlFor="hist-verses"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Capítulo / Versículos
                </label>
                <Input
                  id="hist-verses"
                  value={verses}
                  onChange={(e) => {
                    markDirty();
                    setVerses(e.target.value);
                  }}
                  placeholder="Ex.: 17:16-34"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="hist-tools"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Ferramentas de Consulta Utilizadas (Etapa 2)
              </label>
              <Textarea
                id="hist-tools"
                rows={3}
                value={referenceTools}
                onChange={(e) => {
                  markDirty();
                  setReferenceTools(e.target.value);
                }}
                placeholder="Ex.: Atlas Bíblico Vida Nova, Manual Bíblico Halley, Dicionário Internacional de Teologia..."
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="gap-2 cursor-pointer"
              >
                <span>Avançar: Os 4 Cenários</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 2: OS 4 CENÁRIOS EM MATRIZ 2X2 */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="h-5 w-5 text-[var(--tabernacle-purple)]" />
                Fase 2: Os 4 Cenários Contextuais (Geografia, História, Cultura, Política)
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Os Quatro Pilares do Pano de Fundo"
                theologicalPrinciple="As parábolas, profecias e epístolas respiram o ar de seu relevo, seu momento político, sua cultura doméstica e sua trajetória histórica."
                whyThisStep="Preencher os 4 quadros revela detalhes ocultos que transformam versículos aparentemente obscuros em imagens vívidas."
                goldenTip="Pergunte: por que Paulo usou a metáfora dos jogos ístmicos em Corinto? Por que Jesus falou do samaritano na estrada para Jericó?"
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenarios.map((scenario) => {
                const IconComponent = scenario.icon;
                return (
                  <div
                    key={scenario.id}
                    className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2"
                  >
                    <label
                      htmlFor={scenario.id}
                      className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5"
                    >
                      <IconComponent className="h-4 w-4 text-[var(--tabernacle-purple)]" />
                      <span>{scenario.label}</span>
                    </label>
                    <Textarea
                      id={scenario.id}
                      rows={4}
                      value={scenario.value}
                      onChange={(e) => {
                        markDirty();
                        scenario.onChange(e.target.value);
                      }}
                      placeholder={scenario.placeholder}
                    />
                  </div>
                );
              })}
            </div>

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
                <span>Avançar: Síntese & 4Ps</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 3: RESUMO EXEGÉTICO & APLICAÇÃO 4PS */}
      {currentStep === 3 && (
        <Card goldAccent>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Fase 3: Síntese Exegética & Aplicação Prática (4Ps)
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Ponte Entre o Passado e o Hoje"
                theologicalPrinciple="Costumes antigos passam, mas o princípio teológico por trás deles permanece eterno e aplicável ao século XXI."
                whyThisStep="A Etapa 7 captura o que a passagem comunicou originalmente; a Etapa 8 cruza a ponte hermenêutica para sua realidade hoje."
                goldenTip="Separe o elemento cultural transitório (ex.: lavar pés em ruas empoeiradas) do mandamento atemporal (serviço humilde mútuo)."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="hist-summary"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Resumo da Pesquisa Exegética (Etapa 7)
              </label>
              <Textarea
                id="hist-summary"
                rows={4}
                value={researchSummary}
                onChange={(e) => {
                  markDirty();
                  setResearchSummary(e.target.value);
                }}
                placeholder="À luz da geografia, história, cultura e política, o que esta passagem significou para seus primeiros ouvintes?"
              />
            </div>

            <div className="rounded-2xl border border-border bg-secondary/50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="hist-application"
                  className="text-xs font-semibold uppercase tracking-wider text-foreground"
                >
                  Aplicação Prática Contemporânea (Etapa 8 — Regra dos 4Ps)
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
                id="hist-application"
                rows={3}
                value={applicationText}
                onChange={(e) => {
                  markDirty();
                  setApplicationText(e.target.value);
                }}
                placeholder="Como aplicarei este princípio eterno no meu contexto cultural hoje?"
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
                      className="h-4 w-4 rounded border-border text-[var(--tabernacle-purple)] cursor-pointer"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <div>
                <label
                  htmlFor="hist-deadline"
                  className="text-[11px] font-semibold text-muted-foreground block mb-1"
                >
                  Prazo para Cumprimento:
                </label>
                <Input
                  id="hist-deadline"
                  className="h-9 text-xs"
                  value={deadline}
                  onChange={(e) => {
                    markDirty();
                    setDeadline(e.target.value);
                  }}
                  placeholder="Ex.: Esta semana"
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
                methodId="08_HISTORICO_CULTURAL"
                title="Estudo Histórico-Cultural Concluído!"
                subtitle={`Os 4 cenários de "${title || book}" foram registrados no seu diário.`}
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

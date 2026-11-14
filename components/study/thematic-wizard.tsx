"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Compass,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Flame,
  Plus,
  Trash2,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import { db } from "@/lib/db";
import { buildUpdatedUserProgress } from "@/lib/gamification/progress-calculator";
import { playSoftShofarSound } from "@/lib/gamification/celebration-sound";
import { StudyCompletionCard } from "./study-completion-card";
import { Study, Application4P } from "@/lib/types/study";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrincipleDrawer } from "./principle-drawer";

interface ThematicWizardProps {
  initialStudy?: Study;
  studyId: string;
}

const DEFAULT_QUESTIONS = [
  "O que o texto ensina sobre este tema?",
  "Por que isso é importante?",
  "Como devo praticar isso?",
];

const KIPLING_PROMPTS = [
  { label: "O quê?", starter: "O quê a passagem revela sobre " },
  { label: "Por quê?", starter: "Por quê Deus ordena ou enfatiza " },
  { label: "Quando?", starter: "Quando este princípio se aplica ou ocorre " },
  { label: "Como?", starter: "Como isto se manifesta na prática diária " },
  { label: "Onde?", starter: "Onde este ensinamento atua " },
  { label: "Quem?", starter: "Quem são os sujeitos e beneficiários " },
];

const getStringField = (
  formData: Record<string, unknown> | undefined,
  key: string,
  fallback = ""
): string => {
  const val = formData?.[key];
  return typeof val === "string" ? val : fallback;
};

const getStringArrayField = (
  formData: Record<string, unknown> | undefined,
  key: string,
  fallback: string[]
): string[] => {
  const val = formData?.[key];
  if (Array.isArray(val) && val.every((item) => typeof item === "string")) {
    return val.length > 0 ? val : fallback;
  }
  return fallback;
};

export function ThematicWizard({ initialStudy, studyId }: ThematicWizardProps) {
  const fd = initialStudy?.formData;

  const [currentStep, setCurrentStep] = useState(initialStudy?.currentStep || 1);
  const [title, setTitle] = useState(initialStudy?.title || "Estudo Temático");
  const [book, setBook] = useState(initialStudy?.book || "Evangelhos");

  // Fase 1: Etapas 1 a 3
  const [bibleReferences, setBibleReferences] = useState(
    getStringField(fd, "bibleReferences")
  );
  const [questions, setQuestions] = useState<string[]>(
    getStringArrayField(fd, "questions", DEFAULT_QUESTIONS)
  );

  // Fase 2: Etapa 4
  const [referenceAnswers, setReferenceAnswers] = useState(
    getStringField(fd, "referenceAnswers")
  );

  // Fase 3: Etapas 5 e 6
  const [conclusions, setConclusions] = useState(getStringField(fd, "conclusions"));

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

  const [isSaving, setIsSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(
    initialStudy?.status === "completed"
  );

  // Auto-save no IndexedDB com debounce de 600ms
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        const app4P: Application4P = {
          text: applicationText,
          isPersonal,
          isPractical,
          isPossible,
          isMeasurable,
          deadline,
        };

        const studyData: Study = {
          id: studyId,
          methodId: "04_TEMATICO",
          title: title || "Estudo Temático",
          book,
          verses: "",
          status: isCompleted ? "completed" : "draft",
          currentStep,
          formData: {
            bibleReferences,
            questions,
            referenceAnswers,
            conclusions,
          },
          application4P: app4P,
          tags: ["tematico"],
          createdAt: initialStudy?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: isCompleted
            ? initialStudy?.completedAt || new Date().toISOString()
            : undefined,
        };

        await db.studies.put(studyData);
      } catch (err) {
        console.error("Erro no auto-save:", err);
      } finally {
        setIsSaving(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [
    studyId,
    currentStep,
    title,
    book,
    bibleReferences,
    questions,
    referenceAnswers,
    conclusions,
    applicationText,
    isPersonal,
    isPractical,
    isPossible,
    isMeasurable,
    deadline,
    isCompleted,
    initialStudy?.createdAt,
    initialStudy?.completedAt,
  ]);

  const handleAddQuestion = (starter = "") => {
    if (questions.length >= 5) return;
    setQuestions((prev) => [...prev, starter]);
  };

  const handleUpdateQuestion = (index: number, value: string) => {
    setQuestions((prev) => prev.map((q, idx) => (idx === index ? value : q)));
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleFinalize = async () => {
    setIsCompleted(true);
    playSoftShofarSound();
    confetti({
      particleCount: 85,
      spread: 75,
      origin: { y: 0.6 },
      colors: ["#5C2A6B", "#D4AF37", "#1B4965"],
    });

    try {
      const currentProg = await db.progress.get("progress");
      await db.progress.put(
        buildUpdatedUserProgress(currentProg, "04_TEMATICO")
      );
    } catch (e) {
      console.error(e);
    }
  };

  const all4PsChecked = isPersonal && isPractical && isPossible && isMeasurable;

  const fourPsItems = [
    {
      id: "personal",
      label: '1. Pessoal (usei "Eu", "Mim")',
      checked: isPersonal,
      onChange: setIsPersonal,
    },
    {
      id: "practical",
      label: "2. Prático (ação concreta)",
      checked: isPractical,
      onChange: setIsPractical,
    },
    {
      id: "possible",
      label: "3. Possível (viável pela graça)",
      checked: isPossible,
      onChange: setIsPossible,
    },
    {
      id: "measurable",
      label: "4. Mensurável (prazo definido)",
      checked: isMeasurable,
      onChange: setIsMeasurable,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Cabeçalho do Estudo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="purple">Método 04</Badge>
            <span className="text-xs text-muted-foreground">Lugar Santo</span>
            {isSaving && (
              <span className="text-[10px] text-muted-foreground animate-pulse">
                • Salvando rascunho...
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground mt-1">
            O Método Temático
          </h1>
        </div>

        {/* Indicador de 3 Fases */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { num: 1, label: "1. Tema & Perguntas (Kipling)" },
            { num: 2, label: "2. Investigação de Versículos" },
            { num: 3, label: "3. Conclusões & Aplicação 4Ps" },
          ].map((f) => (
            <button
              key={f.num}
              type="button"
              onClick={() => setCurrentStep(f.num)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentStep === f.num
                  ? "bg-[var(--tabernacle-purple)] text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* FASE 1: TEMA, VERSÍCULOS E LIMITADOR DE 3 A 5 PERGUNTAS */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Compass className="h-5 w-5 text-[var(--tabernacle-purple)]" />
                Fase 1: Delimitação do Tema & Perguntas de Kipling
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Por que Limitar de 3 a 5 Perguntas?"
                theologicalPrinciple="Em um estudo temático, menos é mais. Se você pesquisar 50 versículos com 10 perguntas cada, terá 500 respostas e abandonará o estudo por sobrecarga."
                whyThisStep="Definir 3 a 5 perguntas objetivas baseadas nos 'Seis Homens Honestos' de Kipling (O quê, Por quê, Quando, Como, Onde, Quem) mantém o estudo focado e concluível."
                goldenTip="Comece com um recorte específico (ex.: 'As Orações de Jesus' em vez de 'A Oração na Bíblia inteira')."
                exampleFromBook="Pergunta única em Provérbios: 'O que Deus abomina?'"
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="thematic-title"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Etapa 1: Tema Delimitado do Estudo
                </label>
                <Input
                  id="thematic-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: O que Jesus ensinou sobre a ansiedade"
                />
              </div>
              <div>
                <label
                  htmlFor="thematic-scope"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Livro ou Escopo Bíblico
                </label>
                <Input
                  id="thematic-scope"
                  value={book}
                  onChange={(e) => setBook(e.target.value)}
                  placeholder="Ex.: Evangelhos, Epístolas Paulinas, Provérbios"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="thematic-refs"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Etapa 2: Lista de Referências Bíblicas
              </label>
              <Textarea
                id="thematic-refs"
                rows={3}
                value={bibleReferences}
                onChange={(e) => setBibleReferences(e.target.value)}
                placeholder="Liste as referências encontradas na concordância ou Bíblia tópica (ex.: Mt 6.25-34; Fp 4.6-7; 1 Pe 5.7)..."
              />
            </div>

            {/* Etapa 3: Limitador Pedagógico (3 a 5 Perguntas) */}
            <div className="rounded-2xl border border-[var(--tabernacle-purple)]/30 bg-[var(--tabernacle-purple)]/5 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--tabernacle-purple)] flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4" />
                  Etapa 3: Perguntas Pré-Determinadas (Kipling)
                </h4>
                <Badge variant="purple" className="text-[10px]">
                  {questions.length} de 5 Perguntas (Máx. 5)
                </Badge>
              </div>

              {/* Barra Rápida dos 6 Homens Honestos de Kipling */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground mr-1">
                  Seis Homens Honestos:
                </span>
                {KIPLING_PROMPTS.map((item) => (
                  <Button
                    key={item.label}
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={questions.length >= 5}
                    onClick={() => handleAddQuestion(item.starter)}
                    className="h-7 px-2.5 text-[11px] cursor-pointer"
                  >
                    + {item.label}
                  </Button>
                ))}
              </div>

              <div className="space-y-2.5">
                {questions.map((question, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-muted-foreground w-5">
                      {idx + 1}.
                    </span>
                    <Input
                      value={question}
                      onChange={(e) => handleUpdateQuestion(idx, e.target.value)}
                      placeholder={`Pergunta ${idx + 1} (baseada em O quê, Por quê, Como...)`}
                    />
                    {questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveQuestion(idx)}
                        aria-label={`Remover pergunta ${idx + 1}`}
                        className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={questions.length >= 5}
                  onClick={() => handleAddQuestion("")}
                  className="gap-1.5 text-xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar Pergunta</span>
                </Button>

                {questions.length >= 5 && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Limite pedagógico de 5 perguntas atingido (Regra de Rick Warren)
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setCurrentStep(2)} className="gap-2 cursor-pointer">
                <span>Próxima: Investigação de Versículos</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 2: RESPOSTAS POR REFERÊNCIA BÍBLICA */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Compass className="h-5 w-5 text-[var(--tabernacle-purple)]" />
                Fase 2: Investigação Disciplinada das Passagens
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Responda Apenas ao Que Foi Perguntado"
                theologicalPrinciple="A disciplina de responder somente às perguntas pré-estabelecidas impede que o estudante se perca em curiosidades periféricas durante a leitura."
                whyThisStep="Se um versículo da sua lista não responder a alguma das perguntas, passe adiante sem rodeios. Mantenha o foco cirúrgico."
                goldenTip="Organize suas respostas por referência bíblica (ex.: Mt 6.26 -> Resp. 1: ...; Resp. 2: ...)."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Guia visual das perguntas da Fase 1 */}
            <div className="rounded-xl border border-border bg-secondary/40 p-3.5 space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Seu Roteiro de Perguntas Ativas:
              </span>
              <ul className="space-y-1 text-xs text-foreground/90">
                {questions.map((q, idx) => (
                  <li key={idx}>
                    <strong>P{idx + 1}:</strong> {q || "(Pergunta sem texto)"}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label
                htmlFor="reference-answers"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Etapa 4: Respostas Encontradas em Cada Referência Bíblica
              </label>
              <Textarea
                id="reference-answers"
                rows={8}
                value={referenceAnswers}
                onChange={(e) => setReferenceAnswers(e.target.value)}
                placeholder="Abra cada passagem da sua relação e registre pontualmente as respostas às perguntas P1, P2, P3..."
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="gap-2 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <Button onClick={() => setCurrentStep(3)} className="gap-2 cursor-pointer">
                <span>Próxima: Conclusões & Aplicação 4Ps</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 3: CONCLUSÕES E APLICAÇÃO PESSOAL 4PS */}
      {currentStep === 3 && (
        <Card goldAccent>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Fase 3: Síntese Temática & Aplicação Pessoal (4Ps)
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Consolidando Princípios Eternos"
                theologicalPrinciple="Depois de analisar textos individuais, o estudante agrupa as respostas em conclusões gerais harmoniosas com toda a Escritura."
                whyThisStep="Conclusões claras transformam anotações dispersas em convicções bíblicas que podem ser aplicadas com os 4Ps."
                goldenTip="Observe padrões recorrentes nas respostas encontradas na Fase 2 e transforme-os em princípios objetivos."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="thematic-conclusions"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Etapa 5: Conclusões e Síntese do Tema
              </label>
              <Textarea
                id="thematic-conclusions"
                rows={4}
                value={conclusions}
                onChange={(e) => setConclusions(e.target.value)}
                placeholder="Reúna e categorize suas descobertas em princípios unificados..."
              />
            </div>

            <div className="rounded-2xl border border-border bg-secondary/50 p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center justify-between">
                <span>Etapa 6: Aplicação Pessoal (Regra dos 4Ps)</span>
                {all4PsChecked ? (
                  <Badge variant="blue" className="text-[10px]">
                    4Ps Validados ✓
                  </Badge>
                ) : (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-normal">
                    Marque os 4 critérios para concluir
                  </span>
                )}
              </h4>

              <Textarea
                rows={3}
                value={applicationText}
                onChange={(e) => setApplicationText(e.target.value)}
                placeholder="Escreva seu compromisso pessoal em primeira pessoa..."
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
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Prazo para Cumprimento:
                </label>
                <Input
                  className="h-9 text-xs"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="Ex.: Até o próximo domingo"
                />
              </div>
            </div>

            {isCompleted ? (
              <StudyCompletionCard
                methodId="04_TEMATICO"
                title="Estudo Temático Concluído!"
                subtitle={`Sua pesquisa sobre "${title || "o tema"}" foi guardada na biblioteca permanente.`}
                onEdit={() => setIsCompleted(false)}
              />
            ) : (
              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="gap-2 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar</span>
                </Button>
                <Button
                  variant="gold"
                  disabled={!all4PsChecked}
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


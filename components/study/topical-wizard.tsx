"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Layers,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Flame,
  Plus,
  Trash2,
  ListTree,
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

interface TopicalWizardProps {
  initialStudy?: Study;
  studyId: string;
}

export type OutlineLevel = "I" | "A" | "1";

export interface OutlineItem {
  level: OutlineLevel;
  heading: string;
  reference: string;
}

const DEFAULT_OUTLINE: OutlineItem[] = [
  { level: "I", heading: "Divisão Principal: A Natureza do Tópico", reference: "" },
  { level: "A", heading: "Subtópico: Fundamento Bíblico", reference: "" },
  { level: "1", heading: "Ponto Específico: Evidência Prática", reference: "" },
];

const LEVEL_PADDING: Record<OutlineLevel, string> = {
  I: "pl-0",
  A: "pl-6",
  "1": "pl-12",
};

const getStringField = (
  formData: Record<string, unknown> | undefined,
  key: string,
  fallback = ""
): string => {
  const val = formData?.[key];
  return typeof val === "string" ? val : fallback;
};

const isOutlineItem = (val: unknown): val is OutlineItem => {
  if (typeof val !== "object" || val === null) return false;
  const record = val as Record<string, unknown>;
  return (
    (record.level === "I" || record.level === "A" || record.level === "1") &&
    typeof record.heading === "string" &&
    typeof record.reference === "string"
  );
};

const getOutlineField = (
  formData: Record<string, unknown> | undefined
): OutlineItem[] => {
  const val = formData?.outlineItems;
  if (Array.isArray(val) && val.length > 0 && val.every(isOutlineItem)) {
    return val;
  }
  return DEFAULT_OUTLINE;
};

export function TopicalWizard({ initialStudy, studyId }: TopicalWizardProps) {
  const fd = initialStudy?.formData;

  const [currentStep, setCurrentStep] = useState(initialStudy?.currentStep || 1);
  const [title, setTitle] = useState(initialStudy?.title || "Estudo por Tópicos");
  const [book, setBook] = useState(initialStudy?.book || "Toda a Bíblia");

  // Fase 1: Etapas 1 a 3
  const [relatedWords, setRelatedWords] = useState(
    getStringField(fd, "relatedWords")
  );
  const [collectedReferences, setCollectedReferences] = useState(
    getStringField(fd, "collectedReferences")
  );
  const [verseObservations, setVerseObservations] = useState(
    getStringField(fd, "verseObservations")
  );

  // Fase 2: Etapas 4 e 5
  const [categoriesGrouping, setCategoriesGrouping] = useState(
    getStringField(fd, "categoriesGrouping")
  );
  const [outlineItems, setOutlineItems] = useState<OutlineItem[]>(
    getOutlineField(fd)
  );

  // Fase 3: Etapa 6
  const [doctrinalSummary, setDoctrinalSummary] = useState(
    getStringField(fd, "doctrinalSummary")
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
          methodId: "06_TOPICOS",
          title: title || "Estudo por Tópicos",
          book,
          verses: "",
          status: isCompleted ? "completed" : "draft",
          currentStep,
          formData: {
            relatedWords,
            collectedReferences,
            verseObservations,
            categoriesGrouping,
            outlineItems,
            doctrinalSummary,
          },
          application4P: app4P,
          tags: ["topicos"],
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
    relatedWords,
    collectedReferences,
    verseObservations,
    categoriesGrouping,
    outlineItems,
    doctrinalSummary,
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

  const handleAddOutlineItem = () => {
    setOutlineItems((prev) => [
      ...prev,
      { level: "A", heading: "", reference: "" },
    ]);
  };

  const handleUpdateOutlineItem = (
    index: number,
    field: keyof OutlineItem,
    value: string
  ) => {
    setOutlineItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        if (field === "level") {
          const lvl: OutlineLevel =
            value === "I" || value === "A" || value === "1" ? value : "A";
          return { ...item, level: lvl };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleRemoveOutlineItem = (index: number) => {
    if (outlineItems.length <= 1) return;
    setOutlineItems((prev) => prev.filter((_, idx) => idx !== index));
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
        buildUpdatedUserProgress(currentProg, "06_TOPICOS")
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
      label: "2. Prático (ação definida)",
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
            <Badge variant="purple">Método 06</Badge>
            <span className="text-xs text-muted-foreground">Lugar Santo</span>
            {isSaving && (
              <span className="text-[10px] text-muted-foreground animate-pulse">
                • Salvando rascunho...
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground mt-1">
            O Método por Tópicos
          </h1>
        </div>

        {/* Indicador de 3 Fases */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { num: 1, label: "1. Léxico & Referências" },
            { num: 2, label: "2. Agrupamento & Esboço (I, A, 1)" },
            { num: 3, label: "3. Conclusão & Aplicação 4Ps" },
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

      {/* FASE 1: PALAVRAS RELACIONADAS, REFERÊNCIAS E EXAME EM CONTEXTO */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Layers className="h-5 w-5 text-[var(--tabernacle-purple)]" />
                Fase 1: Levantamento de Palavras & Análise Contextual
              </CardTitle>
              <PrincipleDrawer
                stepTitle="As 3 Regras de Ouro de R. A. Torrey"
                theologicalPrinciple="Diferente do Método Temático (focado em 3 a 5 perguntas), o Método por Tópicos investiga exaustivamente uma doutrina inteira, protegendo você contra heresias causadas por versículos isolados."
                whyThisStep="1) Seja Sistemático (compile todos os termos afins); 2) Seja Completo (não deduza doutrina de 3 versículos isolados); 3) Seja Cuidadoso (confira sempre o contexto imediato)."
                goldenTip="Antes de abrir a concordância, liste sinônimos e antônimos. Para 'Sofrimento', pesquise também aflição, tribulação, provação e consolo."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="topical-title"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Etapa 1: Tópico Doutrinário ou Assunto
                </label>
                <Input
                  id="topical-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: A Oração na Bíblia, Justificação pela Fé"
                />
              </div>
              <div>
                <label
                  htmlFor="topical-scope"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
                >
                  Escopo da Pesquisa
                </label>
                <Input
                  id="topical-scope"
                  value={book}
                  onChange={(e) => setBook(e.target.value)}
                  placeholder="Ex.: Toda a Bíblia, Novo Testamento, Romanos"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="related-words"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Lista de Palavras Correlatas, Sinônimos e Antônimos
              </label>
              <Input
                id="related-words"
                value={relatedWords}
                onChange={(e) => setRelatedWords(e.target.value)}
                placeholder="Ex.: Aflição, tribulação, provação, dor, consolo, perseverança"
              />
            </div>

            <div>
              <label
                htmlFor="collected-references"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Etapa 2: Referências Bíblicas Reunidas
              </label>
              <Textarea
                id="collected-references"
                rows={3}
                value={collectedReferences}
                onChange={(e) => setCollectedReferences(e.target.value)}
                placeholder="Compile as referências localizadas na concordância exaustiva e na Bíblia tópica..."
              />
            </div>

            <div>
              <label
                htmlFor="verse-observations"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Etapa 3: Exame de Cada Versículo em Seu Contexto
              </label>
              <Textarea
                id="verse-observations"
                rows={5}
                value={verseObservations}
                onChange={(e) => setVerseObservations(e.target.value)}
                placeholder="Leia cada texto observando os versículos anteriores e posteriores para não distorcer o sentido original..."
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setCurrentStep(2)} className="gap-2 cursor-pointer">
                <span>Próxima: Agrupamento & Esboço (I, A, 1)</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 2: AGRUPAMENTO E CONSTRUTOR VISUAL DE ESBOÇO HIERÁRQUICO */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <ListTree className="h-5 w-5 text-[var(--tabernacle-purple)]" />
                Fase 2: Categorias Naturais & Construtor de Esboço (I, A, 1)
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Sintetizando a Doutrina em Ordem Lógica"
                theologicalPrinciple="Pois é preceito sobre preceito, regra sobre regra (Isaías 28.10). Organizar as descobertas em estrutura hierárquica fixa o ensino na mente e permite compartilhá-lo."
                whyThisStep="Ao comparar suas notas, vários versículos convergirão para grandes categorias naturais. Transformá-las em tópicos I, A, 1 cria um esboço sólido."
                goldenTip="Use nível 'I' para as grandes divisões (ex.: Origem, Propósito), nível 'A' para subtópicos e nível '1' para evidências pontuais."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <label
                htmlFor="categories-grouping"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Etapa 4: Agrupamento em Categorias Naturais
              </label>
              <Textarea
                id="categories-grouping"
                rows={3}
                value={categoriesGrouping}
                onChange={(e) => setCategoriesGrouping(e.target.value)}
                placeholder="Agrupe as passagens por afinidade (ex.: Categoria 1 - A origem do assunto; Categoria 2 - A promessa divina)..."
              />
            </div>

            {/* Etapa 5: Construtor Visual de Esboços Temáticos */}
            <div className="rounded-2xl border border-[var(--tabernacle-purple)]/30 bg-[var(--tabernacle-purple)]/5 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--tabernacle-purple)] flex items-center gap-1.5">
                  <ListTree className="h-4 w-4" />
                  Etapa 5: Construtor Visual de Esboço Hierárquico
                </h4>
                <Badge variant="purple" className="text-[10px]">
                  {outlineItems.length} Itens no Esboço
                </Badge>
              </div>

              <div className="space-y-2.5">
                {outlineItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`transition-all ${LEVEL_PADDING[item.level]}`}
                  >
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-xl border border-border bg-card p-2.5 shadow-xs">
                      <select
                        value={item.level}
                        onChange={(e) =>
                          handleUpdateOutlineItem(idx, "level", e.target.value)
                        }
                        aria-label={`Nível do item ${idx + 1}`}
                        className="h-9 px-2.5 rounded-lg border border-input bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                      >
                        <option value="I">I - Tópico Principal</option>
                        <option value="A">A - Subtópico</option>
                        <option value="1">1 - Ponto Específico</option>
                      </select>

                      <Input
                        value={item.heading}
                        onChange={(e) =>
                          handleUpdateOutlineItem(idx, "heading", e.target.value)
                        }
                        placeholder="Título do ponto no esboço..."
                        className="h-9 text-xs flex-1"
                      />

                      <Input
                        value={item.reference}
                        onChange={(e) =>
                          handleUpdateOutlineItem(idx, "reference", e.target.value)
                        }
                        placeholder="Ref. (ex.: Rm 5.1)"
                        className="h-9 text-xs sm:w-36"
                      />

                      {outlineItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOutlineItem(idx)}
                          aria-label={`Remover tópico ${idx + 1}`}
                          className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOutlineItem}
                className="gap-1.5 text-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Adicionar Tópico ao Esboço</span>
              </Button>
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
                <span>Próxima: Conclusão & Aplicação 4Ps</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 3: RESUMO DOUTRINÁRIO & APLICAÇÃO PESSOAL 4PS */}
      {currentStep === 3 && (
        <Card goldAccent>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Fase 3: Síntese Doutrinária & Aplicação Pessoal (4Ps)
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Sã Doutrina com Vida Transformada"
                theologicalPrinciple="Conhecer toda a revelação bíblica sobre um tópico exige humildade para submeter nossa conduta diária ao conselho completo de Deus."
                whyThisStep="Dividir a conclusão em Resumo Doutrinário e Aplicação Prática (4Ps) une ortodoxia (ensino reto) à ortopraxia (vida reta)."
                goldenTip="Revise seu esboço da Etapa 5 e pergunte: qual verdade doutrinária cobra hoje uma mudança concreta minha?"
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="doctrinal-summary"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5"
              >
                Etapa 6: Resumo Geral das Descobertas Doutrinárias
              </label>
              <Textarea
                id="doctrinal-summary"
                rows={4}
                value={doctrinalSummary}
                onChange={(e) => setDoctrinalSummary(e.target.value)}
                placeholder="Redija a síntese teológica equilibrada que o estudo completo revelou..."
              />
            </div>

            <div className="rounded-2xl border border-border bg-secondary/50 p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center justify-between">
                <span>Aplicação Pessoal (Regra dos 4Ps)</span>
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
                placeholder="Escreva seu compromisso prático em primeira pessoa..."
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
                  placeholder="Ex.: Nos próximos 14 dias"
                />
              </div>
            </div>

            {isCompleted ? (
              <StudyCompletionCard
                methodId="06_TOPICOS"
                title="Estudo por Tópicos Concluído!"
                subtitle={`Seu esboço e conclusão sobre "${title || "o tópico"}" foram salvos no diário.`}
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


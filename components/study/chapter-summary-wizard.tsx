"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  BookOpen,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Flame,
  BookmarkCheck,
  Check,
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

interface ChapterSummaryWizardProps {
  initialStudy?: Study;
  studyId: string;
}

export function ChapterSummaryWizard({ initialStudy, studyId }: ChapterSummaryWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStudy?.currentStep || 1);
  const [title, setTitle] = useState(initialStudy?.title || "Resumo de Capítulo");
  const [book, setBook] = useState(initialStudy?.book || "1 Coríntios");
  const [chapter, setChapter] = useState(initialStudy?.chapter || 13);

  // Contador das 5 leituras prévias
  const [readingsCount, setReadingsCount] = useState<number[]>(
    initialStudy?.formData?.readingsCount || []
  );

  // Os 10 campos do método
  const [step1Title, setStep1Title] = useState(initialStudy?.formData?.step1Title || "");
  const [step2Content, setStep2Content] = useState(initialStudy?.formData?.step2Content || "");
  const [step3People, setStep3People] = useState(initialStudy?.formData?.step3People || "");
  const [step4KeyVerse, setStep4KeyVerse] = useState(initialStudy?.formData?.step4KeyVerse || "");
  const [step5KeyWords, setStep5KeyWords] = useState(initialStudy?.formData?.step5KeyWords || "");
  const [step6Challenges, setStep6Challenges] = useState(initialStudy?.formData?.step6Challenges || "");
  const [step7CrossReferences, setStep7CrossReferences] = useState(initialStudy?.formData?.step7CrossReferences || "");
  const [step8Christ, setStep8Christ] = useState(initialStudy?.formData?.step8Christ || "");
  const [step9CentralLessons, setStep9CentralLessons] = useState(initialStudy?.formData?.step9CentralLessons || "");

  // Etapa 10: Aplicação 4Ps
  const [applicationText, setApplicationText] = useState(initialStudy?.application4P?.text || "");
  const [isPersonal, setIsPersonal] = useState(initialStudy?.application4P?.isPersonal || false);
  const [isPractical, setIsPractical] = useState(initialStudy?.application4P?.isPractical || false);
  const [isPossible, setIsPossible] = useState(initialStudy?.application4P?.isPossible || false);
  const [isMeasurable, setIsMeasurable] = useState(initialStudy?.application4P?.isMeasurable || false);
  const [deadline, setDeadline] = useState(initialStudy?.application4P?.deadline || "");

  const [isSaving, setIsSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(initialStudy?.status === "completed");

  const toggleReading = (num: number) => {
    setReadingsCount((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  };

  // Auto-save no IndexedDB
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
          methodId: "02_RESUMO_CAPITULO",
          title: title || `${book} ${chapter}`,
          book,
          chapter: Number(chapter) || undefined,
          verses: "",
          status: isCompleted ? "completed" : "draft",
          currentStep,
          formData: {
            readingsCount,
            step1Title,
            step2Content,
            step3People,
            step4KeyVerse,
            step5KeyWords,
            step6Challenges,
            step7CrossReferences,
            step8Christ,
            step9CentralLessons,
          },
          application4P: app4P,
          tags: ["resumo-capitulo"],
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
    chapter,
    readingsCount,
    step1Title,
    step2Content,
    step3People,
    step4KeyVerse,
    step5KeyWords,
    step6Challenges,
    step7CrossReferences,
    step8Christ,
    step9CentralLessons,
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

  const handleFinalize = async () => {
    setIsCompleted(true);
    playSoftShofarSound();
    confetti({
      particleCount: 85,
      spread: 75,
      origin: { y: 0.6 },
      colors: ["#D4AF37", "#1B4965", "#5C2A6B"],
    });

    try {
      const currentProg = await db.progress.get("progress");
      await db.progress.put(
        buildUpdatedUserProgress(currentProg, "02_RESUMO_CAPITULO")
      );
    } catch (e) {
      console.error(e);
    }
  };

  const all4PsChecked = isPersonal && isPractical && isPossible && isMeasurable;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Cabeçalho do Estudo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="gold">Método 02</Badge>
            <span className="text-xs text-muted-foreground">Átrio Exterior</span>
            {isSaving && (
              <span className="text-[10px] text-muted-foreground animate-pulse">
                • Salvando rascunho...
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground mt-1">
            Método por Resumo de Capítulo
          </h1>
        </div>

        {/* Indicador de 3 Fases do Wizard */}
        <div className="flex items-center gap-2">
          {[
            { num: 1, label: "1. Leituras & Título" },
            { num: 2, label: "2. Observações Chave" },
            { num: 3, label: "3. Teologia & Aplicação" },
          ].map((f) => (
            <button
              key={f.num}
              onClick={() => setCurrentStep(f.num)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                currentStep === f.num
                  ? "bg-[var(--tabernacle-gold)] text-[var(--accent-foreground)] shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* FASE 1: LEITURAS E PRIMEIRAS ETAPAS */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookOpen className="h-5 w-5 text-[var(--tabernacle-gold)]" />
                Fase 1: As 5 Leituras Preliminares & Dados Iniciais
              </CardTitle>
              <PrincipleDrawer
                stepTitle="O Segredo das Cinco Leituras"
                theologicalPrinciple="Não existe maneira melhor de conhecer um capítulo da Bíblia do que lê-lo inúmeras vezes. O renomado expositor bíblico G. Campbell Morgan lia um capítulo de 30 a 40 vezes antes de começar a escrever seus sermões poderosos."
                whyThisStep="A mente precisa absorver a cadência e o fluxo integral da mensagem antes de se apegar a detalhes isolados. Ler repetidas vezes sem parar revela a pulsação do escritor bíblico."
                goldenTip="Leia sem anotações prévias para não ser condicionado por ideias antigas, leia sem parar o fluxo, leia em traduções diferentes e leia em voz alta."
                exampleFromBook="Ao resumir 1 Coríntios 13, o autor deu o título memorável: 'O Caminho do Amor'."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Título Geral do Estudo
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: O Amor Supremo em 1 Coríntios 13"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Livro Bíblico
                </label>
                <Input value={book} onChange={(e) => setBook(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Capítulo
                </label>
                <Input
                  type="number"
                  value={chapter || ""}
                  onChange={(e) => setChapter(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Checklist das 5 Leituras */}
            <div className="rounded-2xl border border-[var(--tabernacle-gold)]/40 bg-[var(--tabernacle-gold)]/5 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--tabernacle-gold)]">
                  As Cinco Leituras Obrigatórias
                </h4>
                <Badge variant="gold" className="text-[10px]">
                  {readingsCount.length} de 5 Concluídas
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { num: 1, desc: "1ª Leitura: Sem anotações ou notas de rodapé" },
                  { num: 2, desc: "2ª Leitura: Sem parar, sentindo o fluxo total" },
                  { num: 3, desc: "3ª Leitura: Em outra tradução moderna" },
                  { num: 4, desc: "4ª Leitura: Em voz alta para você mesmo" },
                  { num: 5, desc: "5ª Leitura: Com a caneta pronta para registrar" },
                ].map((item) => (
                  <button
                    key={item.num}
                    type="button"
                    onClick={() => toggleReading(item.num)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                      readingsCount.includes(item.num)
                        ? "bg-card border-[var(--tabernacle-gold)] text-foreground font-medium"
                        : "border-border/60 hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded flex items-center justify-center border ${
                        readingsCount.includes(item.num)
                          ? "bg-[var(--tabernacle-gold)] text-white border-transparent"
                          : "border-muted-foreground"
                      }`}
                    >
                      {readingsCount.includes(item.num) && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <span>{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Etapa 1 do Método: Título */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Etapa 1: Título Curto do Capítulo (1 a 5 palavras)
              </label>
              <Input
                value={step1Title}
                onChange={(e) => setStep1Title(e.target.value)}
                placeholder="Ex.: O Modo Excelente do Amor"
              />
            </div>

            {/* Etapa 2 do Método: Conteúdo */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Etapa 2: Conteúdo (Resumo, paráfrase ou esboço dos pontos principais)
              </label>
              <Textarea
                rows={4}
                value={step2Content}
                onChange={(e) => setStep2Content(e.target.value)}
                placeholder="Descreva o que acontece no capítulo sem interpretar ainda..."
              />
            </div>

            {/* Etapa 3 do Método: Personagens */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Etapa 3: Personagens Importantes
              </label>
              <Input
                value={step3People}
                onChange={(e) => setStep3People(e.target.value)}
                placeholder="Quem são as pessoas mencionadas e por que estão presentes?"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setCurrentStep(2)} className="gap-2 cursor-pointer">
                <span>Próxima: Observações Chave</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 2: OBSERVAÇÕES E PONTOS CHAVE (ETAPAS 4 A 7) */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookmarkCheck className="h-5 w-5 text-[var(--tabernacle-blue)]" />
                Fase 2: Versículo-Chave, Palavras e Referências
              </CardTitle>
              <PrincipleDrawer
                stepTitle="A Lente de Aumento do Capítulo"
                theologicalPrinciple="A Escritura é a melhor intérprete da própria Escritura. Ao correlacionar o versículo-chave e palavras centrais com outras passagens, o estudante ancora a interpretação na harmonia bíblica."
                whyThisStep="Cada capítulo tem um pivô sobre o qual o argumento gira. Encontrar o versículo-chave e a palavra mais repetida expõe a intenção deliberada do autor."
                goldenTip="Não tenha medo de registrar dúvidas na Etapa 6 (Desafios). Deixe registrado aquilo que não entendeu para pesquisar posteriormente com ferramentas externas."
                exampleFromBook="1 Coríntios 13: Versículo-chave: 1 Co 13.13; Palavra-chave: Amor (ágape); Desafio: o que significa 'o que é perfeito' no v. 10?"
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Etapa 4: Versículo-Chave
              </label>
              <Input
                value={step4KeyVerse}
                onChange={(e) => setStep4KeyVerse(e.target.value)}
                placeholder="Ex.: 1 Coríntios 13.13 (O versículo que resume a mensagem)"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Etapa 5: Palavra(s)-Chave
              </label>
              <Input
                value={step5KeyWords}
                onChange={(e) => setStep5KeyWords(e.target.value)}
                placeholder="Ex.: Amor, Paciência, Edificação"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Etapa 6: Desafios / Dúvidas que Preciso Estudar Depois
              </label>
              <Textarea
                rows={2}
                value={step6Challenges}
                onChange={(e) => setStep6Challenges(e.target.value)}
                placeholder="Houve algo difícil de entender? Questões que levantaram dúvidas..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Etapa 7: Referências Cruzadas
              </label>
              <Input
                value={step7CrossReferences}
                onChange={(e) => setStep7CrossReferences(e.target.value)}
                placeholder="Outros versículos bíblicos que esclarecem este capítulo..."
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-2 cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <Button onClick={() => setCurrentStep(3)} className="gap-2 cursor-pointer">
                <span>Próxima: Teologia e Aplicação</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FASE 3: TEOLOGIA, CRISTO E APLICAÇÃO 4PS (ETAPAS 8 A 10) */}
      {currentStep === 3 && (
        <Card goldAccent>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Fase 3: Revelação de Cristo & Aplicação Pessoal (4Ps)
              </CardTitle>
              <PrincipleDrawer
                stepTitle="A Conclusão: Cristo e a Prática"
                theologicalPrinciple="Lucas 24.27: 'E começando por Moisés e todos os profetas, explicou-lhes o que constava a seu respeito em todas as Escrituras'. Toda a Bíblia aponta para Jesus Cristo. E toda verdade de Cristo exige resposta em nossa vida diária."
                whyThisStep="Um estudo de capítulo sem a revelação de Cristo é apenas moralismo. E sem aplicação prática, é mero acúmulo cognitivo inútil."
                goldenTip="A décima etapa é a mais importante de todas. Avalie sua aplicação contra os 4 critérios fundamentais de Rick Warren."
                exampleFromBook="1 Coríntios 13: Cristo é a personificação perfeita do amor. Aplicação: agir com paciência com o colega de trabalho sem responder com ira."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Etapa 8: Como Cristo é Revelado no Capítulo?
              </label>
              <Input
                value={step8Christ}
                onChange={(e) => setStep8Christ(e.target.value)}
                placeholder="Títulos, profecias, tipos, ações ou atributos de Jesus revelados..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Etapa 9: Lição ou Lições Centrais
              </label>
              <Textarea
                rows={3}
                value={step9CentralLessons}
                onChange={(e) => setStep9CentralLessons(e.target.value)}
                placeholder="Quais são os grandes princípios atemporais ensinados pelo autor?"
              />
            </div>

            {/* Etapa 10: Aplicação Pessoal */}
            <div className="rounded-2xl border border-border bg-secondary/50 p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center justify-between">
                <span>Etapa 10: Conclusão e Aplicação Pessoal (Regra dos 4Ps)</span>
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
                placeholder="Escreva sua aplicação em primeira pessoa..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPersonal}
                    onChange={(e) => setIsPersonal(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-[var(--tabernacle-blue)] cursor-pointer"
                  />
                  <span>1. Pessoal (usei &ldquo;Eu&rdquo;)</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPractical}
                    onChange={(e) => setIsPractical(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-[var(--tabernacle-blue)] cursor-pointer"
                  />
                  <span>2. Prático (ação definida)</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPossible}
                    onChange={(e) => setIsPossible(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-[var(--tabernacle-blue)] cursor-pointer"
                  />
                  <span>3. Possível (realista com a graça)</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMeasurable}
                    onChange={(e) => setIsMeasurable(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-[var(--tabernacle-blue)] cursor-pointer"
                  />
                  <span>4. Mensurável (com prazo)</span>
                </label>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Prazo para Cumprimento:
                </label>
                <Input
                  className="h-9 text-xs"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="Ex.: Até a próxima sexta-feira"
                />
              </div>
            </div>

            {isCompleted ? (
              <StudyCompletionCard
                methodId="02_RESUMO_CAPITULO"
                title="Resumo de Capítulo Concluído!"
                subtitle={`O estudo de ${book} ${chapter} foi salvo na sua biblioteca permanente.`}
                onEdit={() => setIsCompleted(false)}
              />
            ) : (
              <div className="flex justify-between items-center pt-2">
                <Button variant="outline" onClick={() => setCurrentStep(2)} className="gap-2 cursor-pointer">
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
                  <span>Concluir Estudo de Capítulo</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

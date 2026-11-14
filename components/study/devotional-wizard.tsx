"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  HeartHandshake,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Flame,
  BookmarkCheck,
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

interface DevotionalWizardProps {
  initialStudy?: Study;
  studyId: string;
}

export function DevotionalWizard({ initialStudy, studyId }: DevotionalWizardProps) {
  const router = useRouter();

  // Estados dos campos
  const [currentStep, setCurrentStep] = useState(initialStudy?.currentStep || 1);
  const [title, setTitle] = useState(initialStudy?.title || "Meu Estudo Devocional");
  const [book, setBook] = useState(initialStudy?.book || "Lucas");
  const [chapter, setChapter] = useState(initialStudy?.chapter || 12);
  const [verses, setVerses] = useState(initialStudy?.verses || "22-26");

  // Etapa 1
  const [prayerDone, setPrayerDone] = useState(
    initialStudy?.formData?.prayerDone ?? false
  );

  // Etapa 2
  const [meditationTechnique, setMeditationTechnique] = useState(
    initialStudy?.formData?.meditationTechnique || "papelmove"
  );
  const [meditationNotes, setMeditationNotes] = useState(
    initialStudy?.formData?.meditationNotes || ""
  );
  const [papelmove, setPapelmove] = useState<{
    pecado?: string;
    atitude?: string;
    promessa?: string;
    exemplo?: string;
    louvor?: string;
    mandamento?: string;
    oracao?: string;
    verdade?: string;
    erro?: string;
  }>(initialStudy?.formData?.papelmove || {});

  // Etapa 3 - Aplicação 4Ps
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
    initialStudy?.application4P?.deadline || "Próximos 30 dias"
  );

  // Etapa 4 - Memorização
  const [memoryVerse, setMemoryVerse] = useState(
    initialStudy?.formData?.memoryVerse || ""
  );
  const [memoryVerseRef, setMemoryVerseRef] = useState(
    initialStudy?.formData?.memoryVerseRef || ""
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(
    initialStudy?.status === "completed"
  );

  // Auto-save no IndexedDB com debounce
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
          methodId: "01_DEVOCIONAL",
          title: title || "Estudo Devocional",
          book,
          chapter: Number(chapter) || undefined,
          verses,
          status: isCompleted ? "completed" : "draft",
          currentStep,
          formData: {
            prayerDone,
            meditationTechnique,
            meditationNotes,
            papelmove,
            memoryVerse,
            memoryVerseRef,
          },
          application4P: app4P,
          tags: ["devocional"],
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
    verses,
    prayerDone,
    meditationTechnique,
    meditationNotes,
    papelmove,
    applicationText,
    isPersonal,
    isPractical,
    isPossible,
    isMeasurable,
    deadline,
    memoryVerse,
    memoryVerseRef,
    isCompleted,
    initialStudy?.createdAt,
    initialStudy?.completedAt,
  ]);

  // Disparo de celebração ao finalizar
  const handleFinalizeStudy = async () => {
    setIsCompleted(true);
    playSoftShofarSound();

    // Chuva de confetes dourados
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#D4AF37", "#F3C948", "#1B4965", "#5C2A6B"],
    });

    // Atualiza progresso no banco
    try {
      const currentProg = await db.progress.get("progress");
      await db.progress.put(
        buildUpdatedUserProgress(currentProg, "01_DEVOCIONAL")
      );
    } catch (e) {
      console.error(e);
    }
  };

  const all4PsChecked = isPersonal && isPractical && isPossible && isMeasurable;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Barra Superior do Estudo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="blue">Método 01</Badge>
            <span className="text-xs text-muted-foreground">Átrio Exterior</span>
            {isSaving && (
              <span className="text-[10px] text-muted-foreground animate-pulse">
                • Salvando rascunho...
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground mt-1">
            O Método Devocional
          </h1>
        </div>

        {/* Indicador de Etapas */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((step) => (
            <button
              key={step}
              onClick={() => setCurrentStep(step)}
              className={`h-8 w-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                currentStep === step
                  ? "bg-[var(--tabernacle-blue)] text-white shadow-xs"
                  : currentStep > step
                  ? "bg-[var(--tabernacle-gold)]/20 text-[var(--tabernacle-gold)] border border-[var(--tabernacle-gold)]/50"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {currentStep > step ? "✓" : step}
            </button>
          ))}
          <span className="text-xs text-muted-foreground ml-2">
            Etapa {currentStep} de 4
          </span>
        </div>
      </div>

      {/* ETAPA 1: ORAÇÃO E TEXTO BÍBLICO */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <HeartHandshake className="h-5 w-5 text-[var(--tabernacle-blue)]" />
                Etapa 1: Oração e Passagem Bíblica
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Etapa 1: A Dependência da Oração"
                theologicalPrinciple="A Bíblia é inspirada pelo Espírito Santo (2 Tm 3.16). Nenhum método intelectual substitui a iluminação divina. Orar antes de ler é reconhecer nossa insuficiência e convidar o Autor para ser nosso professor."
                whyThisStep="Sem oração, o estudo torna-se mero exercício mental frio e acadêmico. Como orava o salmista: 'Abre os meus olhos para que eu veja as maravilhas da tua lei' (Sl 119.18)."
                goldenTip="Antes de abrir a Bíblia, faça uma pausa silenciosa de 60 segundos, aquiete o coração das pressões do dia e peça discernimento específico."
                exampleFromBook="Rick Warren relata que George Mueller leu a Bíblia mais de 200 vezes, e em mais da metade o fez de joelhos em oração."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Título do Seu Estudo
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Aprendendo a Vencer a Preocupação"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Livro Bíblico
                </label>
                <Input
                  value={book}
                  onChange={(e) => setBook(e.target.value)}
                  placeholder="Ex.: Salmo, Lucas, Romanos"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Capítulo
                </label>
                <Input
                  type="number"
                  value={chapter || ""}
                  onChange={(e) => setChapter(Number(e.target.value))}
                  placeholder="Ex.: 15"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Versículos
                </label>
                <Input
                  value={verses}
                  onChange={(e) => setVerses(e.target.value)}
                  placeholder="Ex.: 1-5 ou 22-26"
                />
              </div>
            </div>

            {/* Checkbox de Oração */}
            <div className="p-4 rounded-xl border border-border bg-secondary/40 flex items-start gap-3">
              <input
                type="checkbox"
                id="prayerCheck"
                checked={prayerDone}
                onChange={(e) => setPrayerDone(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-border text-[var(--tabernacle-blue)] focus:ring-[var(--tabernacle-blue)] cursor-pointer"
              />
              <label htmlFor="prayerCheck" className="text-sm cursor-pointer leading-relaxed">
                <span className="font-semibold text-foreground block">
                  Momento de Oração Realizado
                </span>
                <span className="text-xs text-muted-foreground">
                  Orei a Deus pedindo que o Espírito Santo me dê discernimento e ilumine a aplicação prática desta passagem para o meu dia.
                </span>
              </label>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setCurrentStep(2)}
                className="gap-2 cursor-pointer"
              >
                <span>Próxima Etapa: Meditação</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 2: MEDITAÇÃO NA PALAVRA */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Flame className="h-5 w-5 text-[var(--tabernacle-gold)]" />
                Etapa 2: Meditação na Palavra
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Etapa 2: A Ruminação da Verdade"
                theologicalPrinciple="Meditação bíblica não é esvaziar a mente, mas enchê-la ativamente com as palavras de Deus. Como a vaca mastiga o bolo alimentar três vezes para digeri-lo completamente, ruminamos a Palavra sob múltiplos ângulos."
                whyThisStep="A mente humana esquece rapidamente leituras superficiais. Quando você interroga o texto usando o acróstico PAPELMOVE ou parafraseia, as verdades se gravam na alma."
                goldenTip="Use o acróstico P-A-P-E-L-M-O-V-E para fazer perguntas imediatas ao texto: Pecado, Atitude, Promessa, Exemplo, Louvor, Mandamento, Oração, Verdade e Erro."
                exampleFromBook="No Salmo 23, o autor agradece por cada frase: 'Obrigado Senhor por seres o meu Pastor... Obrigado por me fazeres repousar em pastos verdes...'"
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                Escolha a Técnica de Meditação
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "papelmove", label: "Acróstico PAPELMOVE" },
                  { id: "parafrase", label: "Paráfrase Pessoal" },
                  { id: "visualizacao", label: "Visualizar a Cena" },
                  { id: "enfase_palavras", label: "Enfatizar Palavras" },
                  { id: "personalizacao", label: "Personalizar o Texto" },
                  { id: "orar_palavra", label: "Orar o Versículo" },
                ].map((tech) => (
                  <button
                    key={tech.id}
                    onClick={() => setMeditationTechnique(tech.id)}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                      meditationTechnique === tech.id
                        ? "border-[var(--tabernacle-gold)] bg-[var(--tabernacle-gold)]/10 text-foreground font-semibold"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {tech.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Guia Interativo PAPELMOVE */}
            {meditationTechnique === "papelmove" && (
              <div className="rounded-2xl border border-[var(--tabernacle-gold)]/30 bg-[var(--tabernacle-gold)]/5 p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--tabernacle-gold)] flex items-center gap-1.5">
                  <Flame className="h-4 w-4" />
                  As 9 Perguntas do Acróstico P-A-P-E-L-M-O-V-E
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-foreground">[P] Pecado a confessar?</span>
                    <Input
                      className="mt-1 h-9 text-xs"
                      placeholder="Preciso pedir perdão ou fazer restituição?"
                      value={papelmove.pecado || ""}
                      onChange={(e) => setPapelmove({ ...papelmove, pecado: e.target.value })}
                    />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">[A] Atitude a mudar?</span>
                    <Input
                      className="mt-1 h-9 text-xs"
                      placeholder="Trabalhar atitude negativa?"
                      value={papelmove.atitude || ""}
                      onChange={(e) => setPapelmove({ ...papelmove, atitude: e.target.value })}
                    />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">[P] Promessa a reivindicar?</span>
                    <Input
                      className="mt-1 h-9 text-xs"
                      placeholder="Promessa de Deus no texto?"
                      value={papelmove.promessa || ""}
                      onChange={(e) => setPapelmove({ ...papelmove, promessa: e.target.value })}
                    />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">[E] Exemplo a seguir ou evitar?</span>
                    <Input
                      className="mt-1 h-9 text-xs"
                      placeholder="Modelo a copiar ou fugir?"
                      value={papelmove.exemplo || ""}
                      onChange={(e) => setPapelmove({ ...papelmove, exemplo: e.target.value })}
                    />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">[L] Louvor a render a Deus?</span>
                    <Input
                      className="mt-1 h-9 text-xs"
                      placeholder="Motivo de gratidão sincera?"
                      value={papelmove.louvor || ""}
                      onChange={(e) => setPapelmove({ ...papelmove, louvor: e.target.value })}
                    />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">[M] Mandamento a obedecer?</span>
                    <Input
                      className="mt-1 h-9 text-xs"
                      placeholder="Ordem clara de Jesus/Apóstolos?"
                      value={papelmove.mandamento || ""}
                      onChange={(e) => setPapelmove({ ...papelmove, mandamento: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Suas Anotações de Meditação
              </label>
              <Textarea
                rows={4}
                value={meditationNotes}
                onChange={(e) => setMeditationNotes(e.target.value)}
                placeholder="Escreva livremente o que Deus falou ao seu coração durante a meditação nesta passagem..."
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
              <Button
                onClick={() => setCurrentStep(3)}
                className="gap-2 cursor-pointer"
              >
                <span>Próxima Etapa: Aplicação 4Ps</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 3: APLICAÇÃO 4PS */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookmarkCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Etapa 3: Aplicação Prática (Os 4Ps de Rick Warren)
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Etapa 3: A Regra de Ouro dos 4Ps"
                theologicalPrinciple="Tiago 1.22: 'Sejam praticantes da palavra, e não apenas ouvintes'. Como disse Howard Hendricks: 'Interpretação sem aplicação é aborto'. A Bíblia não foi dada para aumentar conhecimento, mas para transformar o caráter."
                whyThisStep="Aplicações genéricas ('preciso amar mais') não mudam a vida de ninguém. Para funcionar, sua aplicação DEVE ser: Pessoal (Eu), Prática (Ação definida), Possível (Realista) e Mensurável (Com prazo)."
                goldenTip="Exemplo dos 4 fatores em Eclesiastes 6.7: Pessoal ('Eu...'), Prático ('Eu tenho de perder peso'), Possível ('Eu tenho de perder três quilos'), Mensurável ('Eu tenho de perder três quilos em trinta dias')."
                exampleFromBook="Lucas 12.22-26: 'Durante este próximo mês, toda vez que o diabo me tentar a ficar preocupado com as contas, resistirei citando em voz alta Lucas 12.24'."
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Descreva sua Aplicação Pessoal
              </label>
              <Textarea
                rows={4}
                value={applicationText}
                onChange={(e) => setApplicationText(e.target.value)}
                placeholder="Escreva em primeira pessoa o que você fará a partir deste estudo..."
              />
            </div>

            {/* Checklist dos 4Ps */}
            <div className="rounded-2xl border border-border bg-secondary/50 p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center justify-between">
                <span>Checklist de Verificação da Aplicação (Regra dos 4Ps)</span>
                {all4PsChecked ? (
                  <Badge variant="blue" className="text-[10px]">
                    4Ps Validados ✓
                  </Badge>
                ) : (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-normal">
                    Marque todos os 4 critérios para concluir
                  </span>
                )}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <label className="flex items-center gap-2.5 p-2 rounded-lg bg-card border border-border/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPersonal}
                    onChange={(e) => setIsPersonal(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-[var(--tabernacle-blue)] cursor-pointer"
                  />
                  <span>
                    <strong>1. Pessoal:</strong> Usei pronomes em 1ª pessoa (*Eu, Mim, Meu*)?
                  </span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-lg bg-card border border-border/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPractical}
                    onChange={(e) => setIsPractical(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-[var(--tabernacle-blue)] cursor-pointer"
                  />
                  <span>
                    <strong>2. Prático:</strong> É uma ação específica e não uma generalidade?
                  </span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-lg bg-card border border-border/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPossible}
                    onChange={(e) => setIsPossible(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-[var(--tabernacle-blue)] cursor-pointer"
                  />
                  <span>
                    <strong>3. Possível:</strong> É realizável com a graça de Deus?
                  </span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-lg bg-card border border-border/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMeasurable}
                    onChange={(e) => setIsMeasurable(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-[var(--tabernacle-blue)] cursor-pointer"
                  />
                  <span>
                    <strong>4. Mensurável:</strong> Tem prazo definido e acompanhamento?
                  </span>
                </label>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Prazo ou Data Limite para Cumprir o Compromisso:
                </label>
                <Input
                  className="h-9 text-xs"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  placeholder="Ex.: Próximos 7 dias; até o dia 30 de novembro"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="gap-2 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                className="gap-2 cursor-pointer"
              >
                <span>Próxima Etapa: Memorização</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 4: MEMORIZAÇÃO E CONCLUSÃO */}
      {currentStep === 4 && (
        <Card goldAccent>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-5 w-5 text-[var(--tabernacle-gold)]" />
                Etapa 4: Memorização e Guarda no Coração
              </CardTitle>
              <PrincipleDrawer
                stepTitle="Etapa 4: Guardando a Palavra"
                theologicalPrinciple="Salmo 119.11: 'Guardei no coração a tua palavra para não pecar contra ti'. O versículo memorizado atua como âncora constante ao longo do dia, lembrando o compromisso da aplicação."
                whyThisStep="Mudar hábitos arraigados leva semanas. Ter o versículo memorizado permite que o Espírito Santo o traga à memória nos momentos exatos de tentação ou dúvida."
                goldenTip="Copie o versículo em um cartão de papel ou coloque na tela do celular e repita-o três vezes ao acordar, no almoço e antes de dormir."
                exampleFromBook="Juízes 6.16: 'Lembre o que Deus disse a Gideão: Eu estarei com você!'"
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Versículo Escolhido para Memorização
              </label>
              <Textarea
                rows={3}
                value={memoryVerse}
                onChange={(e) => setMemoryVerse(e.target.value)}
                placeholder="Transcreva aqui o versículo que resume a aplicação para decorar..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Referência Bíblica do Versículo
              </label>
              <Input
                value={memoryVerseRef}
                onChange={(e) => setMemoryVerseRef(e.target.value)}
                placeholder="Ex.: Lucas 12.24 ou Juízes 6.16"
              />
            </div>

            {/* Card de Celebração */}
            {isCompleted ? (
              <StudyCompletionCard
                methodId="01_DEVOCIONAL"
                title="Estudo Devocional Concluído!"
                subtitle="Sua chama na Menorá do Santuário foi renovada."
                viewDiaryLabel="Ver Meus Estudos no Diário"
              />
            ) : (
              <div className="rounded-xl border border-border bg-secondary/40 p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Pronto para Selar seu Compromisso?
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {all4PsChecked
                      ? "Os 4Ps estão validados. Você pode concluir seu estudo!"
                      : "Atenção: retorne à etapa 3 e marque os 4Ps para finalizar com excelência."}
                  </p>
                </div>
                <Button
                  variant="gold"
                  disabled={!all4PsChecked}
                  onClick={handleFinalizeStudy}
                  className="gap-2 cursor-pointer font-bold"
                >
                  <Flame className="h-4 w-4 fill-current" />
                  <span>Concluir e Acender Menorá</span>
                </Button>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(3)}
                className="gap-2 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar para Etapa 3</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push("/diario")}
                className="gap-2 cursor-pointer"
              >
                <span>Ir para o Diário</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

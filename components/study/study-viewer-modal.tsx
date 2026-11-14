"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  FileDown,
  Edit3,
  Calendar,
  BookOpen,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  AlignLeft,
  LayoutList,
  Sparkles,
} from "lucide-react";
import { Study } from "@/lib/types/study";
import {
  formatStudyToDocument,
  formatStudyPlainText,
  downloadStudyPdf,
} from "@/lib/export/study-formatter";
import { formatStudyMarkdown } from "@/lib/backup/backup-service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StudyViewerModalProps {
  study: Study | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudyViewerModal({
  study,
  open,
  onOpenChange,
}: StudyViewerModalProps) {
  const [viewMode, setViewMode] = useState<"formatted" | "text">("formatted");
  const [copied, setCopied] = useState(false);

  if (!study) return null;

  const doc = formatStudyToDocument(study);
  const plainText = formatStudyPlainText(study);

  const handleExportMd = () => {
    const md = formatStudyMarkdown(study);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${study.book || "estudo"}-${study.chapter || "geral"}-${
      study.methodId
    }.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    downloadStudyPdf(study);
  };

  const handleCopyText = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(plainText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback silencioso caso clipboard não esteja disponível
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col p-0 overflow-hidden">
        {/* Cabeçalho Fixo do Modal */}
        <div className="px-6 pt-6 pb-4 border-b border-border bg-secondary/30">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex flex-wrap items-center gap-2 pr-6">
              <Badge
                variant={study.status === "completed" ? "blue" : "secondary"}
              >
                {study.status === "completed" ? "Concluído ✓" : "Rascunho"}
              </Badge>
              <Badge variant="gold">
                Método #{doc.methodOrder} • {doc.methodName}
              </Badge>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 ml-auto">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                {doc.updatedAtFormatted}
              </span>
            </div>

            <DialogTitle className="font-serif text-xl sm:text-2xl font-bold text-foreground">
              {doc.title}
            </DialogTitle>

            <DialogDescription className="text-xs flex flex-wrap items-center gap-2 text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <BookOpen
                  className="h-3.5 w-3.5 text-[var(--tabernacle-gold)]"
                  aria-hidden="true"
                />
                {doc.passage}
              </span>
              <span>•</span>
              <span>{doc.sanctuaryZoneLabel}</span>
            </DialogDescription>
          </DialogHeader>

          {/* Alternador de Visualização: Formatado vs. Em Texto */}
          <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border/60">
            <div
              role="tablist"
              aria-label="Modo de visualização do estudo"
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-background border border-border"
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "formatted"}
                onClick={() => setViewMode("formatted")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === "formatted"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutList className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Formatado</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "text"}
                onClick={() => setViewMode("text")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === "text"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <AlignLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Em Texto</span>
              </button>
            </div>

            {viewMode === "text" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyText}
                className="h-8 text-xs gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check
                      className="h-3.5 w-3.5 text-emerald-600"
                      aria-hidden="true"
                    />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Corpo Rolável do Estudo */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {viewMode === "formatted" ? (
            <>
              {doc.sections.length === 0 ? (
                <div className="rounded-xl border border-border/80 bg-secondary/20 p-4 text-xs text-muted-foreground">
                  Nenhum campo específico das etapas intermediárias foi
                  registrado neste estudo ainda. Clique em{" "}
                  <strong>
                    {study.status === "completed" ? "Revisar" : "Continuar"}
                  </strong>{" "}
                  para preencher ou editar os passos do método.
                </div>
              ) : (
                doc.sections.map((section, sIdx) => (
                  <section
                    key={sIdx}
                    className="rounded-2xl border border-border bg-card shadow-2xs overflow-hidden"
                  >
                    <div className="px-4 py-2.5 bg-secondary/50 border-b border-border flex items-center gap-2">
                      <Sparkles
                        className="h-3.5 w-3.5 text-[var(--tabernacle-gold)]"
                        aria-hidden="true"
                      />
                      <h3 className="font-serif text-sm font-semibold text-foreground">
                        {section.title}
                      </h3>
                    </div>
                    <div className="p-4 space-y-3.5">
                      {section.fields.map((field, fIdx) => (
                        <div
                          key={fIdx}
                          className="space-y-1 border-b border-border/40 last:border-b-0 pb-3 last:pb-0"
                        >
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {field.label}
                          </div>
                          <div className="text-xs sm:text-sm text-foreground whitespace-pre-line leading-relaxed">
                            {field.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))
              )}

              {/* Seção Destacada: Aplicação Pessoal (Regra dos 4Ps) */}
              <section className="rounded-2xl border border-[var(--tabernacle-gold)]/50 bg-[var(--tabernacle-gold)]/5 overflow-hidden">
                <div className="px-4 py-2.5 bg-[var(--tabernacle-gold)]/15 border-b border-[var(--tabernacle-gold)]/30 flex items-center justify-between">
                  <h3 className="font-serif text-sm font-semibold text-foreground">
                    Aplicação Pessoal (Regra dos 4Ps)
                  </h3>
                  <span className="text-[11px] text-muted-foreground">
                    Prazo: <strong>{doc.application4P.deadline}</strong>
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-xs sm:text-sm text-foreground whitespace-pre-line leading-relaxed">
                    {doc.application4P.text}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    {[
                      {
                        label: "Pessoal",
                        checked: doc.application4P.isPersonal,
                      },
                      {
                        label: "Prático",
                        checked: doc.application4P.isPractical,
                      },
                      {
                        label: "Possível",
                        checked: doc.application4P.isPossible,
                      },
                      {
                        label: "Mensurável",
                        checked: doc.application4P.isMeasurable,
                      },
                    ].map((crit) => (
                      <div
                        key={crit.label}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${
                          crit.checked
                            ? "border-emerald-600/30 bg-emerald-500/10 text-foreground font-medium"
                            : "border-border bg-background/60 text-muted-foreground"
                        }`}
                      >
                        {crit.checked ? (
                          <CheckCircle2
                            className="h-3.5 w-3.5 text-emerald-600 shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <Circle
                            className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        <span>{crit.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div className="rounded-xl border border-border bg-secondary/20 p-4">
              <pre
                aria-label="Conteúdo do estudo em texto puro"
                className="text-xs sm:text-sm font-mono text-foreground whitespace-pre-wrap break-words leading-relaxed"
              >
                {plainText}
              </pre>
            </div>
          )}
        </div>

        {/* Rodapé com Ações de Download (.md e .pdf) e Edição */}
        <DialogFooter className="px-6 py-3.5 border-t border-border bg-secondary/20 flex flex-wrap items-center justify-between gap-2 sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportMd}
              aria-label={`Baixar ${doc.title} em Markdown`}
              className="h-8 text-xs gap-1.5 cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>.md</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              aria-label={`Baixar ${doc.title} em PDF`}
              className="h-8 text-xs gap-1.5 cursor-pointer"
            >
              <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
              <span>.pdf</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs cursor-pointer"
            >
              Fechar
            </Button>
            <Link href={`/estudo/${study.methodId}/${study.id}`}>
              <Button size="sm" className="h-8 text-xs gap-1.5 cursor-pointer">
                <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {study.status === "completed" ? "Revisar" : "Continuar"}
                </span>
              </Button>
            </Link>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


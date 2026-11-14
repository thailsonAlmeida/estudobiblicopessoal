"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Search,
  Trash2,
  Edit3,
  Calendar,
  BookOpen,
  FileText,
  FileDown,
  Eye,
  Plus,
} from "lucide-react";
import { db } from "@/lib/db";
import { Study } from "@/lib/types/study";
import { BIBLE_STUDY_METHODS } from "@/lib/constants/methods";
import { formatStudyMarkdown } from "@/lib/backup/backup-service";
import { downloadStudyPdf } from "@/lib/export/study-formatter";
import { syncProgressWithDatabase } from "@/lib/gamification/progress-calculator";
import { StudyViewerModal } from "./study-viewer-modal";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function StudyLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedMethod, setSelectedMethod] = useState<string>("all");
  const [studyToView, setStudyToView] = useState<Study | null>(null);
  const [studyToDelete, setStudyToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Consulta reativa ao banco IndexedDB via Dexie
  const studies = useLiveQuery(
    () => db.studies.reverse().sortBy("updatedAt"),
    []
  );

  // Filtragem
  const filteredStudies = (studies || []).filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.book.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || s.status === selectedStatus;
    const matchesMethod =
      selectedMethod === "all" || s.methodId === selectedMethod;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Exportar estudo individual em Markdown
  const handleExportMarkdown = (study: Study) => {
    const md = formatStudyMarkdown(study);

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${study.book}-${study.chapter || "estudo"}-${study.methodId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Exportar estudo individual em PDF
  const handleExportPdf = (study: Study) => {
    downloadStudyPdf(study);
  };

  const handleConfirmDelete = async () => {
    if (!studyToDelete) return;
    await db.studies.delete(studyToDelete.id);
    await syncProgressWithDatabase();
    setStudyToDelete(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Cabeçalho da Biblioteca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Meu Diário de Estudos Bíblicos
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Seus registros espirituais guardados com segurança no seu
            dispositivo (IndexedDB).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/">
            <Button size="sm" className="gap-1.5 text-xs cursor-pointer">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Novo Estudo</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div
        role="search"
        aria-label="Busca e filtros de estudos bíblicos"
        className="flex flex-col sm:flex-row items-center gap-3 bg-secondary/40 p-3 rounded-2xl border border-border"
      >
        <div className="relative flex-1 w-full">
          <label htmlFor="study-search-input" className="sr-only">
            Buscar por livro, capítulo ou título
          </label>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="study-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por livro, capítulo ou título..."
            className="pl-9 h-10 text-xs bg-background"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <label htmlFor="study-status-filter" className="sr-only">
            Filtrar por status do estudo
          </label>
          <select
            id="study-status-filter"
            aria-label="Filtrar por status do estudo"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 w-full sm:w-auto px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="completed">Concluídos ✓</option>
            <option value="draft">Rascunhos</option>
          </select>

          <label htmlFor="study-method-filter" className="sr-only">
            Filtrar por método de estudo
          </label>
          <select
            id="study-method-filter"
            aria-label="Filtrar por método de estudo"
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="h-10 w-full sm:w-[210px] px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="all">Todos os Métodos</option>
            {Object.values(BIBLE_STUDY_METHODS).map((m) => (
              <option key={m.id} value={m.id}>
                #{m.order} {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Estudos */}
      {filteredStudies.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <BookOpen className="h-6 w-6" aria-hidden="true" />
              </div>
            </div>
            <CardTitle className="text-lg">Nenhum estudo localizado</CardTitle>
            <CardDescription className="max-w-md mx-auto text-xs">
              {searchTerm ||
              selectedStatus !== "all" ||
              selectedMethod !== "all"
                ? "Tente ajustar seus termos de busca ou filtros."
                : "Você ainda não iniciou estudos bíblicos. Escolha um método no Tabernáculo para começar!"}
            </CardDescription>
            <div className="pt-2">
              <Link href="/">
                <Button size="sm" className="gap-2 cursor-pointer">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>Iniciar Meu Primeiro Estudo</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStudies.map((study) => {
            const methodInfo = BIBLE_STUDY_METHODS[study.methodId];
            return (
              <Card
                key={study.id}
                className="flex flex-col justify-between hover:shadow-sm transition-all border border-border"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <Badge
                      variant={
                        study.status === "completed" ? "blue" : "secondary"
                      }
                    >
                      {study.status === "completed"
                        ? "Concluído ✓"
                        : "Rascunho"}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" aria-hidden="true" />
                      {new Date(study.updatedAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  <CardTitle className="text-base line-clamp-1">
                    {study.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {study.book} {study.chapter ? `cap. ${study.chapter}` : ""}{" "}
                    {study.verses ? `v. ${study.verses}` : ""} •{" "}
                    <span className="text-[var(--tabernacle-gold)] font-medium">
                      {methodInfo?.name}
                    </span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="text-xs text-muted-foreground line-clamp-2 pt-0 pb-3">
                  {study.application4P?.text || "Sem aplicação registrada."}
                </CardContent>

                <div className="px-6 py-3 border-t border-border/50 flex items-center justify-between gap-2 bg-muted/20">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStudyToView(study)}
                      title="Visualizar estudo formatado e em texto"
                      aria-label={`Visualizar ${study.title}`}
                      className="h-8 px-2 text-xs gap-1 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Ver</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExportMarkdown(study)}
                      title="Exportar Markdown (.md)"
                      aria-label={`Exportar ${study.title} em Markdown`}
                      className="h-8 px-2 text-xs gap-1 cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>.md</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExportPdf(study)}
                      title="Baixar PDF (.pdf)"
                      aria-label={`Baixar ${study.title} em PDF`}
                      className="h-8 px-2 text-xs gap-1 cursor-pointer"
                    >
                      <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>.pdf</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setStudyToDelete({ id: study.id, title: study.title })
                      }
                      title="Excluir Estudo"
                      aria-label={`Excluir ${study.title}`}
                      className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>

                  <Link href={`/estudo/${study.methodId}/${study.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1 cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {study.status === "completed" ? "Revisar" : "Continuar"}
                      </span>
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Visualização do Estudo Formatado e em Texto */}
      <StudyViewerModal
        study={studyToView}
        open={Boolean(studyToView)}
        onOpenChange={(open) => {
          if (!open) setStudyToView(null);
        }}
      />

      {/* Diálogo amigável de confirmação de exclusão */}
      <Dialog
        open={Boolean(studyToDelete)}
        onOpenChange={(open) => {
          if (!open) setStudyToDelete(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Trash2 className="h-5 w-5 text-destructive" aria-hidden="true" />
              <span>Remover estudo do diário?</span>
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed pt-1">
              Tem certeza de que deseja excluir o estudo{" "}
              <strong className="text-foreground">
                &ldquo;{studyToDelete?.title}&rdquo;
              </strong>
              ? Esta ação remove o registro apenas deste dispositivo e não pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStudyToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="crimson"
              size="sm"
              onClick={handleConfirmDelete}
            >
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

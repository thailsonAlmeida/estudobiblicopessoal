"use client";

import React, { useMemo, useState } from "react";
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
  LayoutGrid,
  List,
  FolderKanban,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
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

type ViewMode = "grid" | "list" | "grouped";
type SortOption = "recent" | "oldest" | "canonical" | "title";

/**
 * Ordem canônica dos 66 livros da Bíblia para ordenação e agrupamento.
 */
const CANONICAL_BOOKS: string[] = [
  "gênesis", "genesis",
  "êxodo", "exodo",
  "levítico", "levitico",
  "números", "numeros",
  "deuteronômio", "deuteronomio",
  "josué", "josue",
  "juízes", "juizes",
  "rute",
  "1 samuel", "i samuel",
  "2 samuel", "ii samuel",
  "1 reis", "i reis",
  "2 reis", "ii reis",
  "1 crônicas", "1 cronicas", "i crônicas",
  "2 crônicas", "2 cronicas", "ii crônicas",
  "esdras",
  "neemias",
  "ester",
  "jó", "jo",
  "salmos", "salmo",
  "provérbios", "proverbios",
  "eclesiastes",
  "cânticos", "cantares", "canticos",
  "isaías", "isaias",
  "jeremias",
  "lamentações", "lamentacoes",
  "ezequiel",
  "daniel",
  "oseias", "oséias",
  "joel",
  "amós", "amos",
  "obadias",
  "jonas",
  "miqueias", "miquéias",
  "naum",
  "habacuque",
  "sofonias",
  "ageu",
  "zacarias",
  "malaquias",
  "mateus",
  "marcos",
  "lucas",
  "joão", "joao",
  "atos", "atos dos apóstolos",
  "romanos",
  "1 coríntios", "1 corintios", "i coríntios",
  "2 coríntios", "2 corintios", "ii coríntios",
  "gálatas", "galatas",
  "efésios", "efesios",
  "filipenses",
  "colossenses",
  "1 tessalonicenses", "i tessalonicenses",
  "2 tessalonicenses", "ii tessalonicenses",
  "1 timóteo", "1 timoteo", "i timóteo",
  "2 timóteo", "2 timoteo", "ii timóteo",
  "tito",
  "filemom", "filemon",
  "hebreus",
  "tiago",
  "1 pedro", "i pedro",
  "2 pedro", "ii pedro",
  "1 joão", "1 joao", "i joão",
  "2 joão", "2 joao", "ii joão",
  "3 joão", "3 joao", "iii joão",
  "judas",
  "apocalipse",
];

function getCanonicalIndex(bookName: string): number {
  const normalized = (bookName || "").trim().toLowerCase();
  if (!normalized) return 999;
  const exactIdx = CANONICAL_BOOKS.indexOf(normalized);
  if (exactIdx !== -1) return exactIdx;
  const partialIdx = CANONICAL_BOOKS.findIndex((b) => normalized.includes(b));
  return partialIdx !== -1 ? partialIdx : 900;
}

export function StudyLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedMethod, setSelectedMethod] = useState<string>("all");
  const [selectedBook, setSelectedBook] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [pageSize, setPageSize] = useState<number>(12);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [collapsedBooks, setCollapsedBooks] = useState<Record<string, boolean>>({});

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

  // Lista única de livros existentes nos estudos para o filtro rápido
  const availableBooks = useMemo(() => {
    if (!studies) return [];
    const booksSet = new Set<string>();
    for (const s of studies) {
      const cleanBook = (s.book || "").trim();
      if (cleanBook) booksSet.add(cleanBook);
    }
    return Array.from(booksSet).sort(
      (a, b) => getCanonicalIndex(a) - getCanonicalIndex(b) || a.localeCompare(b, "pt-BR")
    );
  }, [studies]);

  // Filtragem e Ordenação combinadas
  const filteredAndSortedStudies = useMemo(() => {
    const base = (studies || []).filter((s) => {
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        s.title.toLowerCase().includes(query) ||
        s.book.toLowerCase().includes(query) ||
        (s.chapter ? String(s.chapter).includes(query) : false) ||
        (s.application4P?.text
          ? s.application4P.text.toLowerCase().includes(query)
          : false);

      const matchesStatus =
        selectedStatus === "all" || s.status === selectedStatus;
      const matchesMethod =
        selectedMethod === "all" || s.methodId === selectedMethod;
      const matchesBook =
        selectedBook === "all" ||
        (s.book || "").trim().toLowerCase() === selectedBook.toLowerCase();

      return matchesSearch && matchesStatus && matchesMethod && matchesBook;
    });

    return [...base].sort((a, b) => {
      if (sortBy === "recent") {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
      if (sortBy === "oldest") {
        return (
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
      }
      if (sortBy === "canonical") {
        const idxA = getCanonicalIndex(a.book);
        const idxB = getCanonicalIndex(b.book);
        if (idxA !== idxB) return idxA - idxB;
        return (a.chapter || 0) - (b.chapter || 0);
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title, "pt-BR");
      }
      return 0;
    });
  }, [
    studies,
    searchTerm,
    selectedStatus,
    selectedMethod,
    selectedBook,
    sortBy,
  ]);

  // Paginação segura
  const totalItems = filteredAndSortedStudies.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedStudies = useMemo(() => {
    if (viewMode === "grouped") return filteredAndSortedStudies;
    return filteredAndSortedStudies.slice(startIndex, endIndex);
  }, [filteredAndSortedStudies, startIndex, endIndex, viewMode]);

  // Agrupamento por Livro Bíblico (para o modo "grouped")
  const studiesByBook = useMemo(() => {
    const groups = new Map<string, Study[]>();
    for (const study of filteredAndSortedStudies) {
      const bookLabel = (study.book || "").trim() || "Tema Geral / Sem Livro";
      const existing = groups.get(bookLabel) || [];
      existing.push(study);
      groups.set(bookLabel, existing);
    }

    return Array.from(groups.entries()).sort(
      ([bookA], [bookB]) =>
        getCanonicalIndex(bookA) - getCanonicalIndex(bookB) ||
        bookA.localeCompare(bookB, "pt-BR")
    );
  }, [filteredAndSortedStudies]);

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    selectedStatus !== "all" ||
    selectedMethod !== "all" ||
    selectedBook !== "all";

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedMethod("all");
    setSelectedBook("all");
    setCurrentPage(1);
  };

  const toggleBookGroup = (bookLabel: string) => {
    setCollapsedBooks((prev) => ({
      ...prev,
      [bookLabel]: !prev[bookLabel],
    }));
  };

  // Exportar estudo individual em Markdown
  const handleExportMarkdown = (study: Study) => {
    const md = formatStudyMarkdown(study);

    const blob = new Blob([md], { type: "text/markdown;charset-utf-8" });
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

  // Componente de Linha Compacta (reutilizado no modo Lista e no modo Agrupado)
  const renderCompactRow = (study: Study) => {
    const methodInfo = BIBLE_STUDY_METHODS[study.methodId];
    return (
      <div
        key={study.id}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-secondary/25 transition-colors"
      >
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/70 border border-border text-[11px] font-bold text-foreground">
            #{methodInfo?.order ?? "01"}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-foreground truncate">
                {study.title}
              </span>
              <Badge
                variant={study.status === "completed" ? "blue" : "secondary"}
                className="text-[10px] px-1.5 py-0"
              >
                {study.status === "completed" ? "Concluído ✓" : "Rascunho"}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
              <span className="font-medium text-foreground/80">
                {study.book || "Bíblia"}{" "}
                {study.chapter ? `cap. ${study.chapter}` : ""}{" "}
                {study.verses ? `v. ${study.verses}` : ""}
              </span>
              <span>•</span>
              <span className="text-[var(--tabernacle-gold)] font-medium">
                {methodInfo?.name}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-[11px]">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                {new Date(study.updatedAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50 shrink-0">
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
      </div>
    );
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-16">
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

      {/* Barra Principal de Busca e Filtros */}
      <div
        role="search"
        aria-label="Busca e filtros de estudos bíblicos"
        className="space-y-3 bg-secondary/40 p-3.5 rounded-2xl border border-border"
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
          {/* Campo de Busca */}
          <div className="relative flex-1 min-w-0">
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
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por livro, capítulo ou título..."
              className="pl-9 h-10 text-xs bg-background"
            />
          </div>

          {/* Filtros de Livro, Método e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex items-center gap-2">
            <label htmlFor="study-book-filter" className="sr-only">
              Filtrar por livro bíblico
            </label>
            <select
              id="study-book-filter"
              aria-label="Filtrar por livro bíblico"
              value={selectedBook}
              onChange={(e) => {
                setSelectedBook(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full lg:w-[155px] px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            >
              <option value="all">Todos os Livros</option>
              {availableBooks.map((book) => (
                <option key={book} value={book}>
                  {book}
                </option>
              ))}
            </select>

            <label htmlFor="study-status-filter" className="sr-only">
              Filtrar por status do estudo
            </label>
            <select
              id="study-status-filter"
              aria-label="Filtrar por status do estudo"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full lg:w-[145px] px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
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
              onChange={(e) => {
                setSelectedMethod(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full lg:w-[195px] px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
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

        {/* Sub-barra de Controle: Contador, Ordenação e Modos de Visualização */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-border/60">
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <span>
              {totalItems === 0 ? (
                "Nenhum estudo encontrado"
              ) : viewMode === "grouped" ? (
                <>
                  Exibindo <strong className="text-foreground">{totalItems}</strong>{" "}
                  {totalItems === 1 ? "estudo" : "estudos"} em{" "}
                  <strong className="text-foreground">{studiesByBook.length}</strong>{" "}
                  {studiesByBook.length === 1 ? "livro" : "livros"}
                </>
              ) : (
                <>
                  Exibindo{" "}
                  <strong className="text-foreground">
                    {startIndex + 1}–{endIndex}
                  </strong>{" "}
                  de <strong className="text-foreground">{totalItems}</strong>{" "}
                  {totalItems === 1 ? "estudo" : "estudos"}
                </>
              )}
            </span>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>Limpar filtros</span>
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            {/* Ordenação */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown
                className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                aria-hidden="true"
              />
              <label htmlFor="study-sort-select" className="sr-only">
                Ordenar estudos por
              </label>
              <select
                id="study-sort-select"
                aria-label="Ordenar estudos por"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortOption);
                  setCurrentPage(1);
                }}
                className="h-8 px-2.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                <option value="recent">Mais recentes</option>
                <option value="oldest">Mais antigos</option>
                <option value="canonical">Ordem Bíblica (Gên–Ap)</option>
                <option value="title">Título (A–Z)</option>
              </select>
            </div>

            {/* Alternador de Visualização (Cards / Lista Compacta / Por Livro) */}
            <div
              role="group"
              aria-label="Modo de visualização da biblioteca"
              className="inline-flex items-center rounded-lg border border-input bg-background p-0.5"
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                title="Visualização em Grade (Cards)"
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden md:inline">Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                title="Visualização em Lista Compacta"
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden md:inline">Lista</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("grouped")}
                aria-pressed={viewMode === "grouped"}
                title="Agrupar por Livro Bíblico"
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === "grouped"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FolderKanban className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden md:inline">Por Livro</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Estudos */}
      {filteredAndSortedStudies.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <BookOpen className="h-6 w-6" aria-hidden="true" />
              </div>
            </div>
            <CardTitle className="text-lg">Nenhum estudo localizado</CardTitle>
            <CardDescription className="max-w-md mx-auto text-xs">
              {hasActiveFilters
                ? "Tente ajustar seus termos de busca ou limpar os filtros ativos."
                : "Você ainda não iniciou estudos bíblicos. Escolha um método no Tabernáculo para começar!"}
            </CardDescription>
            <div className="pt-2 flex items-center justify-center gap-2">
              {hasActiveFilters ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetFilters}
                  className="gap-2 cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>Limpar Filtros</span>
                </Button>
              ) : (
                <Link href="/">
                  <Button size="sm" className="gap-2 cursor-pointer">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span>Iniciar Meu Primeiro Estudo</span>
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        /* MODO 1: GRADE DE CARDS (2 Colunas) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedStudies.map((study) => {
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
      ) : viewMode === "list" ? (
        /* MODO 2: LISTA COMPACTA (Alta Densidade para 100+ Estudos) */
        <div className="space-y-2">
          {paginatedStudies.map((study) => renderCompactRow(study))}
        </div>
      ) : (
        /* MODO 3: AGRUPADO POR LIVRO BÍBLICO (Visão de Cânon) */
        <div className="space-y-3">
          {studiesByBook.map(([bookLabel, bookStudies]) => {
            const isCollapsed = Boolean(collapsedBooks[bookLabel]);
            const completedCount = bookStudies.filter(
              (s) => s.status === "completed"
            ).length;

            return (
              <div
                key={bookLabel}
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleBookGroup(bookLabel)}
                  aria-expanded={!isCollapsed}
                  className="w-full flex items-center justify-between px-4 py-3 bg-secondary/35 hover:bg-secondary/60 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen
                      className="h-4 w-4 text-[var(--tabernacle-gold)]"
                      aria-hidden="true"
                    />
                    <span className="font-serif font-bold text-base text-foreground">
                      {bookLabel}
                    </span>
                    <Badge variant="secondary" className="text-[11px]">
                      {bookStudies.length}{" "}
                      {bookStudies.length === 1 ? "estudo" : "estudos"}
                    </Badge>
                    {completedCount > 0 && (
                      <Badge variant="blue" className="text-[10px]">
                        {completedCount} concluído{completedCount > 1 ? "s" : ""} ✓
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{isCollapsed ? "Expandir" : "Recolher"}</span>
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <ChevronUp className="h-4 w-4" aria-hidden="true" />
                    )}
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="p-3 space-y-2 divide-y divide-border/30">
                    {bookStudies.map((study) => renderCompactRow(study))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rodapé de Paginação e Seletor de Densidade */}
      {viewMode !== "grouped" && totalItems > 0 && (
        <div
          aria-label="Paginação de estudos"
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/80"
        >
          {/* Seletor de itens por página */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <label htmlFor="study-page-size">Itens por página:</label>
            <select
              id="study-page-size"
              aria-label="Itens por página"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 px-2.5 rounded-lg border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
            >
              <option value={12}>12 por página</option>
              <option value={24}>24 por página</option>
              <option value={48}>48 por página</option>
              <option value={9999}>Mostrar todos ({totalItems})</option>
            </select>
          </div>

          {/* Controles de navegação de página */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Anterior</span>
              </Button>

              <span className="px-3 text-xs font-medium text-foreground">
                Página {safePage} de {totalPages}
              </span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
              >
                <span>Próxima</span>
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          )}
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

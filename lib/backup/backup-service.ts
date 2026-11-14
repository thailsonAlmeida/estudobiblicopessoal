import { z } from "zod";
import { db, type QuickNote } from "@/lib/db";
import { BIBLE_STUDY_METHODS } from "@/lib/constants/methods";
import { formatStudyToDocument } from "@/lib/export/study-formatter";
import {
  Study,
  StudySchema,
  UserProgress,
  UserProgressSchema,
} from "@/lib/types/study";
import { LAST_BACKUP_STORAGE_KEY } from "@/lib/storage/persistence";

export const QuickNoteSchema = z.object({
  id: z.string(),
  reference: z.string(),
  content: z.string(),
  updatedAt: z.string(),
});

export interface BackupPayload {
  version: number;
  appName: string;
  exportedAt: string;
  studies: Study[];
  progress?: UserProgress | null;
  quickNotes?: QuickNote[];
}

export type BackupValidationResult =
  | {
      success: true;
      studies: Study[];
      progress?: UserProgress | null;
      quickNotes?: QuickNote[];
    }
  | { success: false; error: string };

/**
 * Gera o payload estruturado de backup completo em JSON.
 */
export function createBackupPayload(
  studies: Study[],
  exportedAtIso: string,
  progress?: UserProgress | null,
  quickNotes?: QuickNote[]
): BackupPayload {
  return {
    version: 2,
    appName: "Estudo Bíblico Pessoal PWA",
    exportedAt: exportedAtIso,
    studies,
    ...(progress !== undefined ? { progress } : {}),
    ...(quickNotes !== undefined ? { quickNotes } : {}),
  };
}

/**
 * Valida atomicamente um arquivo JSON de backup com Zod (StudySchema, UserProgressSchema e QuickNoteSchema).
 * Se qualquer registro estiver adulterado ou corrompido, rejeita o lote inteiro.
 */
export function parseAndValidateBackupJson(
  jsonString: string
): BackupValidationResult {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonString);
  } catch {
    return {
      success: false,
      error: "Arquivo JSON malformado ou ilegível.",
    };
  }

  const candidateList = Array.isArray(raw)
    ? raw
    : typeof raw === "object" && raw !== null && "studies" in raw
    ? (raw as { studies: unknown }).studies
    : null;

  if (!Array.isArray(candidateList)) {
    return {
      success: false,
      error: "Formato inválido: lista de estudos não localizada.",
    };
  }

  const validatedStudies: Study[] = [];

  for (let i = 0; i < candidateList.length; i++) {
    const parsed = StudySchema.safeParse(candidateList[i]);
    if (!parsed.success) {
      return {
        success: false,
        error: `Dados corrompidos ou incompatíveis no registro #${i + 1}. Importação cancelada com segurança.`,
      };
    }
    validatedStudies.push(parsed.data as Study);
  }

  let validatedProgress: UserProgress | null | undefined = undefined;
  if (
    typeof raw === "object" &&
    raw !== null &&
    "progress" in raw &&
    (raw as { progress: unknown }).progress !== undefined &&
    (raw as { progress: unknown }).progress !== null
  ) {
    const parsedProgress = UserProgressSchema.safeParse(
      (raw as { progress: unknown }).progress
    );
    if (!parsedProgress.success) {
      return {
        success: false,
        error:
          "Dados de progresso da Menorá corrompidos. Importação cancelada com segurança.",
      };
    }
    validatedProgress = parsedProgress.data as UserProgress;
  }

  let validatedNotes: QuickNote[] | undefined = undefined;
  if (
    typeof raw === "object" &&
    raw !== null &&
    "quickNotes" in raw &&
    Array.isArray((raw as { quickNotes: unknown }).quickNotes)
  ) {
    const rawNotes = (raw as { quickNotes: unknown[] }).quickNotes;
    validatedNotes = [];
    for (let i = 0; i < rawNotes.length; i++) {
      const parsedNote = QuickNoteSchema.safeParse(rawNotes[i]);
      if (!parsedNote.success) {
        return {
          success: false,
          error: `Nota rápida #${i + 1} corrompida. Importação cancelada com segurança.`,
        };
      }
      validatedNotes.push(parsedNote.data);
    }
  }

  return {
    success: true,
    studies: validatedStudies,
    progress: validatedProgress,
    quickNotes: validatedNotes,
  };
}

/**
 * Coleta todos os dados do banco local (estudos, progresso da Menorá e notas rápidas)
 * e dispara o download de um arquivo JSON de backup.
 */
export async function exportFullBackupToFile(): Promise<{
  studiesCount: number;
  hasProgress: boolean;
}> {
  const [studies, progress, quickNotes] = await Promise.all([
    db.studies.toArray(),
    db.progress.get("progress"),
    db.quickNotes.toArray(),
  ]);

  const hasMeaningfulProgress =
    Boolean(progress) &&
    ((progress?.totalStudiesCompleted ?? 0) > 0 ||
      (progress?.streakCount ?? 0) > 0);

  if (
    studies.length === 0 &&
    !hasMeaningfulProgress &&
    quickNotes.length === 0
  ) {
    throw new Error("Nenhum dado encontrado no dispositivo para exportar.");
  }

  const nowIso = new Date().toISOString();
  const payload = createBackupPayload(
    studies,
    nowIso,
    progress ?? null,
    quickNotes
  );

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(LAST_BACKUP_STORAGE_KEY, nowIso);
    }
  } catch {
    // Ignora erro de localStorage em modo restrito
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup-estudos-biblicos-${nowIso.split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);

  return {
    studiesCount: studies.length,
    hasProgress: Boolean(progress),
  };
}

/**
 * Importa estudos, progresso e notas validadas em uma única transação ACID no IndexedDB.
 * Caso ocorra falha de validação ou de escrita, faz rollback completo.
 */
export async function importBackupTransactional(
  jsonString: string
): Promise<{ importedCount: number }> {
  const validation = parseAndValidateBackupJson(jsonString);
  if (!validation.success) {
    throw new Error(validation.error);
  }

  await db.transaction(
    "rw",
    db.studies,
    db.progress,
    db.quickNotes,
    async () => {
      if (validation.studies.length > 0) {
        await db.studies.bulkPut(validation.studies);
      }
      if (validation.progress) {
        await db.progress.put(validation.progress);
      }
      if (validation.quickNotes && validation.quickNotes.length > 0) {
        await db.quickNotes.bulkPut(validation.quickNotes);
      }
    }
  );

  return { importedCount: validation.studies.length };
}

/**
 * Formata um estudo bíblico em Markdown estruturado com YAML Frontmatter
 * compatível com Obsidian e Notion.
 */
export function formatStudyMarkdown(study: Study): string {
  const methodName =
    BIBLE_STUDY_METHODS[study.methodId]?.name || study.methodId;
  const doc = formatStudyToDocument(study);

  const sectionsMarkdown =
    doc.sections.length > 0
      ? doc.sections
          .map(
            (section) =>
              `## ${section.title}\n\n` +
              section.fields
                .map((field) => `### ${field.label}\n${field.value}`)
                .join("\n\n")
          )
          .join("\n\n---\n\n") + "\n\n---\n\n"
      : "";

  return `---
titulo: "${study.title}"
metodo: "${methodName}"
livro: "${study.book}"
capitulo: "${study.chapter || ""}"
versiculos: "${study.verses || ""}"
data: "${study.createdAt}"
status: "${study.status}"
---

# ${study.title}
*Método Utilizado: ${methodName}*
*Passagem: ${study.book} ${study.chapter || ""} ${study.verses || ""}*

---

${sectionsMarkdown}## Aplicação Pessoal (Regra dos 4Ps)
${study.application4P?.text || "Nenhuma aplicação registrada."}

- **Prazo:** ${study.application4P?.deadline || "Não informado"}
- **Critérios Validados:**
  - Pessoal: ${study.application4P?.isPersonal ? "Sim" : "Não"}
  - Prático: ${study.application4P?.isPractical ? "Sim" : "Não"}
  - Possível: ${study.application4P?.isPossible ? "Sim" : "Não"}
  - Mensurável: ${study.application4P?.isMeasurable ? "Sim" : "Não"}

---
*Gerado por Estudo Bíblico Pessoal PWA - Métodos de Rick Warren*
`;
}

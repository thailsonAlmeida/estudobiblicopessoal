const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const LAST_BACKUP_STORAGE_KEY = "tabernacle_last_backup_at";

/**
 * Solicita armazenamento durável ao navegador (StorageManager API) para evitar
 * limpeza automática do IndexedDB pelo sistema operacional móvel/desktop.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (
      typeof navigator === "undefined" ||
      !navigator.storage ||
      typeof navigator.storage.persist !== "function"
    ) {
      return false;
    }

    if (typeof navigator.storage.persisted === "function") {
      const alreadyPersisted = await navigator.storage.persisted();
      if (alreadyPersisted) {
        return true;
      }
    }

    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/**
 * Consulta se o armazenamento local já está marcado como persistente no navegador.
 */
export async function isStoragePersisted(): Promise<boolean> {
  try {
    if (
      typeof navigator === "undefined" ||
      !navigator.storage ||
      typeof navigator.storage.persisted !== "function"
    ) {
      return false;
    }

    return await navigator.storage.persisted();
  } catch {
    return false;
  }
}

/**
 * Verifica se deve sugerir backup semanal em JSON (quando há estudos salvos e
 * nenhum backup foi exportado nos últimos 7 dias).
 */
export function shouldSuggestWeeklyBackup(
  lastBackupIso: string | null | undefined,
  studiesCount: number,
  nowMs: number
): boolean {
  if (studiesCount <= 0) {
    return false;
  }

  if (!lastBackupIso) {
    return true;
  }

  const lastMs = Date.parse(lastBackupIso);
  if (Number.isNaN(lastMs)) {
    return true;
  }

  return nowMs - lastMs >= SEVEN_DAYS_MS;
}


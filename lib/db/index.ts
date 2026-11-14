import Dexie, { type EntityTable } from "dexie";
import type { Study, UserProgress } from "../types/study";

export interface QuickNote {
  id: string;
  reference: string;
  content: string;
  updatedAt: string;
}

export class TabernacleDatabase extends Dexie {
  studies!: EntityTable<Study, "id">;
  progress!: EntityTable<UserProgress, "id">;
  quickNotes!: EntityTable<QuickNote, "id">;

  constructor() {
    super("EstudoBiblicoTabernaculoDB");

    this.version(1).stores({
      studies: "id, methodId, status, book, chapter, createdAt, updatedAt",
      progress: "id",
      quickNotes: "id, reference, updatedAt"
    });
  }
}

export const db = new TabernacleDatabase();


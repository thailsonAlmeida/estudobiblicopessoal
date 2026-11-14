import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import type { Study } from "@/lib/types/study";

describe("TabernacleDatabase (IndexedDB via Dexie)", () => {
  beforeEach(async () => {
    await db.studies.clear();
    await db.progress.clear();
    await db.quickNotes.clear();
  });

  it("stores and retrieves a study record accurately", async () => {
    const mockStudy: Study = {
      id: "study-uuid-001",
      methodId: "01_DEVOCIONAL",
      title: "Meditação em João 15",
      book: "João",
      chapter: 15,
      verses: "1-8",
      status: "draft",
      currentStep: 1,
      formData: { prayerDone: true },
      application4P: {
        text: "Permanecerei em oração diária",
        isPersonal: true,
        isPractical: true,
        isPossible: true,
        isMeasurable: true,
      },
      tags: ["permanecer", "videira"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.studies.put(mockStudy);
    const retrieved = await db.studies.get("study-uuid-001");

    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe("Meditação em João 15");
    expect(retrieved?.status).toBe("draft");
    expect(retrieved?.application4P.isPersonal).toBe(true);
  });

  it("updates an existing study when auto-saving", async () => {
    const initialStudy: Study = {
      id: "study-uuid-002",
      methodId: "02_RESUMO_CAPITULO",
      title: "Romanos 8",
      book: "Romanos",
      chapter: 8,
      verses: "1-39",
      status: "draft",
      currentStep: 1,
      formData: { readingsCount: 1 },
      application4P: {
        text: "",
        isPersonal: false,
        isPractical: false,
        isPossible: false,
        isMeasurable: false,
      },
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.studies.put(initialStudy);

    // Simulate auto-save after advancing steps and completing readings
    await db.studies.update("study-uuid-002", {
      currentStep: 3,
      formData: { readingsCount: 5, chapterTitle: "Nenhuma Condenação" },
      updatedAt: new Date().toISOString(),
    });

    const updated = await db.studies.get("study-uuid-002");
    expect(updated?.currentStep).toBe(3);
    expect(updated?.formData.readingsCount).toBe(5);
    expect(updated?.formData.chapterTitle).toBe("Nenhuma Condenação");
  });

  it("persists and updates UserProgress for the Menorah streak", async () => {
    await db.progress.put({
      id: "progress",
      streakCount: 3,
      lastStudyDate: "2026-11-13",
      sanctuaryLevel: "atrio",
      completedMethodsCount: { "01_DEVOCIONAL": 2, "02_RESUMO_CAPITULO": 1 },
      earnedBadges: ["primeiro_estudo"],
      totalStudiesCompleted: 3,
    });

    const progress = await db.progress.get("progress");
    expect(progress?.streakCount).toBe(3);
    expect(progress?.sanctuaryLevel).toBe("atrio");
    expect(progress?.totalStudiesCompleted).toBe(3);
  });

  it("deletes a study record correctly", async () => {
    const studyToDelete: Study = {
      id: "study-to-delete",
      methodId: "01_DEVOCIONAL",
      title: "Para Deletar",
      book: "Gênesis",
      verses: "1",
      status: "draft",
      currentStep: 1,
      formData: {},
      application4P: {
        text: "",
        isPersonal: false,
        isPractical: false,
        isPossible: false,
        isMeasurable: false,
      },
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.studies.put(studyToDelete);
    expect(await db.studies.count()).toBe(1);

    await db.studies.delete("study-to-delete");
    expect(await db.studies.count()).toBe(0);
  });
});


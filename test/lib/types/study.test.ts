import { describe, it, expect } from "vitest";
import {
  MethodIdEnum,
  Application4PSchema,
  StudySchema,
  UserProgressSchema,
} from "@/lib/types/study";

describe("Study Zod Schemas", () => {
  describe("MethodIdEnum", () => {
    it("validates all 12 valid method IDs", () => {
      const validIds = [
        "01_DEVOCIONAL",
        "02_RESUMO_CAPITULO",
        "03_QUALIDADE_CARATER",
        "04_TEMATICO",
        "05_BIOGRAFICO",
        "06_TOPICOS",
        "07_MORFOLOGICO",
        "08_HISTORICO_CULTURAL",
        "09_INVESTIGATIVO",
        "10_ANALITICO_CAPITULO",
        "11_SINTETICO",
        "12_VERSICULO_POR_VERSICULO",
      ];

      for (const id of validIds) {
        const result = MethodIdEnum.safeParse(id);
        expect(result.success).toBe(true);
      }
    });

    it("rejects unknown method IDs", () => {
      const result = MethodIdEnum.safeParse("99_METODO_INVALIDO");
      expect(result.success).toBe(false);
    });
  });

  describe("Application4PSchema", () => {
    it("provides default false values for 4Ps criteria", () => {
      const parsed = Application4PSchema.parse({});
      expect(parsed.text).toBe("");
      expect(parsed.isPersonal).toBe(false);
      expect(parsed.isPractical).toBe(false);
      expect(parsed.isPossible).toBe(false);
      expect(parsed.isMeasurable).toBe(false);
    });

    it("accepts valid 4Ps evaluation", () => {
      const data = {
        text: "Eu vou perdoar meu irmão até o próximo domingo.",
        isPersonal: true,
        isPractical: true,
        isPossible: true,
        isMeasurable: true,
        deadline: "2026-11-20",
        accountabilityPartner: "Priscila",
      };
      const result = Application4PSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("StudySchema", () => {
    it("parses and validates a complete study record", () => {
      const studyData = {
        id: "test-study-123",
        methodId: "01_DEVOCIONAL",
        title: "Salmo 23 - O Bom Pastor",
        book: "Salmos",
        chapter: 23,
        verses: "1-6",
        status: "draft",
        currentStep: 2,
        formData: { meditationChoice: "acrostic" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = StudySchema.safeParse(studyData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Salmo 23 - O Bom Pastor");
        expect(result.data.status).toBe("draft");
        expect(result.data.application4P.isPersonal).toBe(false);
      }
    });

    it("rejects missing id or invalid methodId", () => {
      const invalidData = {
        title: "Sem ID",
        methodId: "INVALIDO",
      };
      const result = StudySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("UserProgressSchema", () => {
    it("enforces literal 'progress' id and default values", () => {
      const result = UserProgressSchema.safeParse({ id: "progress" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.streakCount).toBe(0);
        expect(result.data.sanctuaryLevel).toBe("atrio");
        expect(result.data.totalStudiesCompleted).toBe(0);
      }
    });

    it("rejects IDs other than 'progress'", () => {
      const result = UserProgressSchema.safeParse({ id: "custom_id" });
      expect(result.success).toBe(false);
    });
  });
});


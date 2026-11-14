import { describe, it, expect } from "vitest";
import { BIBLE_STUDY_METHODS } from "@/lib/constants/methods";
import {
  METHOD_BIBLICAL_ENCOURAGEMENTS,
  getMethodBiblicalEncouragement,
} from "@/lib/constants/biblical-encouragements";
import { MethodIdEnum, type MethodId } from "@/lib/types/study";

describe("BIBLE_STUDY_METHODS", () => {
  it("defines exactly 12 methods according to Rick Warren methodology", () => {
    const methods = Object.values(BIBLE_STUDY_METHODS);
    expect(methods.length).toBe(12);
  });

  it("assigns each method to one of the 3 sanctuary levels", () => {
    const validLevels = ["atrio", "lugar_santo", "santo_dos_santos"];
    const methods = Object.values(BIBLE_STUDY_METHODS);

    for (const method of methods) {
      expect(validLevels).toContain(method.sanctuaryLevel);
      expect(method.name).toBeDefined();
      expect(method.shortDescription).toBeDefined();
      expect(method.timeEstimate).toBeDefined();
      expect(method.totalSteps).toBeGreaterThan(0);
      expect(method.iconName).toBeDefined();
    }
  });

  it("places Devotional and Chapter Summary in the Atrio Exterior (foundational)", () => {
    expect(BIBLE_STUDY_METHODS["01_DEVOCIONAL"].sanctuaryLevel).toBe("atrio");
    expect(BIBLE_STUDY_METHODS["02_RESUMO_CAPITULO"].sanctuaryLevel).toBe("atrio");
  });

  it("places the advanced exegesis trilogy in the Santo dos Santos", () => {
    expect(BIBLE_STUDY_METHODS["09_INVESTIGATIVO"].sanctuaryLevel).toBe("santo_dos_santos");
    expect(BIBLE_STUDY_METHODS["10_ANALITICO_CAPITULO"].sanctuaryLevel).toBe("santo_dos_santos");
    expect(BIBLE_STUDY_METHODS["11_SINTETICO"].sanctuaryLevel).toBe("santo_dos_santos");
    expect(BIBLE_STUDY_METHODS["12_VERSICULO_POR_VERSICULO"].sanctuaryLevel).toBe("santo_dos_santos");
  });

  it("associates each of the 12 methods with a biblical character quote of encouragement and hope", () => {
    const allMethods: MethodId[] = MethodIdEnum.options;
    expect(allMethods).toHaveLength(12);

    for (const methodId of allMethods) {
      const encouragement = getMethodBiblicalEncouragement(methodId);
      expect(encouragement).toBeDefined();
      expect(encouragement.character.trim().length).toBeGreaterThan(0);
      expect(encouragement.quote.trim().length).toBeGreaterThan(0);
      expect(encouragement.reference.trim().length).toBeGreaterThan(0);
      expect(METHOD_BIBLICAL_ENCOURAGEMENTS[methodId]).toBeDefined();
    }

    // Exemplos específicos esperados
    expect(getMethodBiblicalEncouragement("01_DEVOCIONAL").character).toBe("Tiago");
    expect(getMethodBiblicalEncouragement("02_RESUMO_CAPITULO").character).toBe("Salomão");
    expect(getMethodBiblicalEncouragement("03_QUALIDADE_CARATER").character).toBe("Paulo");
    expect(getMethodBiblicalEncouragement("05_BIOGRAFICO").character).toContain("Hebreus");
    expect(getMethodBiblicalEncouragement("07_MORFOLOGICO").character).toBe("Jeremias");
    expect(getMethodBiblicalEncouragement("10_ANALITICO_CAPITULO").character).toBe("Davi");
  });
});

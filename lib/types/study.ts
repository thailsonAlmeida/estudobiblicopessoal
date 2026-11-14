import { z } from "zod";

export const MethodIdEnum = z.enum([
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
  "12_VERSICULO_POR_VERSICULO"
]);

export type MethodId = z.infer<typeof MethodIdEnum>;

export const Application4PSchema = z.object({
  text: z.string().default(""),
  isPersonal: z.boolean().default(false),
  isPractical: z.boolean().default(false),
  isPossible: z.boolean().default(false),
  isMeasurable: z.boolean().default(false),
  deadline: z.string().optional(),
  accountabilityPartner: z.string().optional()
});

export type Application4P = z.infer<typeof Application4PSchema>;

export const StudyStatusEnum = z.enum(["draft", "completed"]);
export type StudyStatus = z.infer<typeof StudyStatusEnum>;

export const StudySchema = z.object({
  id: z.string(),
  methodId: MethodIdEnum,
  title: z.string().default("Novo Estudo"),
  book: z.string().default(""),
  chapter: z.number().int().optional(),
  verses: z.string().default(""),
  status: StudyStatusEnum.default("draft"),
  currentStep: z.number().int().default(1),
  formData: z.record(z.string(), z.any()).default({}),
  application4P: Application4PSchema.default({
    text: "",
    isPersonal: false,
    isPractical: false,
    isPossible: false,
    isMeasurable: false
  }),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional()
});

export type Study = z.infer<typeof StudySchema>;

export const UserProgressSchema = z.object({
  id: z.literal("progress"),
  streakCount: z.number().default(0),
  lastStudyDate: z.string().default(""),
  sanctuaryLevel: z.enum(["atrio", "lugar_santo", "santo_dos_santos"]).default("atrio"),
  completedMethodsCount: z.record(z.string(), z.number()).default({}),
  earnedBadges: z.array(z.string()).default([]),
  totalStudiesCompleted: z.number().default(0)
});

export type UserProgress = z.infer<typeof UserProgressSchema>;


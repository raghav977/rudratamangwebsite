import crypto from "node:crypto";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { config } from "../config.js";
import { db } from "../db.js";
import { slugify, type Row } from "./content.js";

/**
 * Surveys are Google-Forms-style: a list of questions stored as JSON on the
 * survey row, and each response stores its answers as JSON keyed by question id.
 * Questions can be edited after responses arrive; old answers are kept as-is.
 */

export const QUESTION_TYPES = [
  "short",
  "long",
  "single",
  "multi",
  "dropdown",
  "rating",
  "scale",
  "number",
  "date",
  "email",
  "phone",
  "section",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const CHOICE_TYPES = new Set<QuestionType>(["single", "multi", "dropdown"]);

export const questionSchema = z.object({
  id: z.string().min(1).max(40),
  type: z.enum(QUESTION_TYPES),
  title: z.string().trim().max(500).default(""),
  help: z.string().trim().max(1000).optional().default(""),
  required: z.boolean().optional().default(false),
  options: z.array(z.string().trim().max(200)).max(100).optional().default([]).transform((a) => a.filter(Boolean)),
  allowOther: z.boolean().optional().default(false),
  min: z.number().int().min(-1000).max(1000).optional(),
  max: z.number().int().min(-1000).max(1000).optional(),
  minLabel: z.string().trim().max(80).optional().default(""),
  maxLabel: z.string().trim().max(80).optional().default(""),
});
export type Question = z.infer<typeof questionSchema>;

export const STATUSES = ["draft", "open", "closed"] as const;

export const surveyInput = z.object({
  title: z.string().trim().min(1, "Give the survey a title.").max(300),
  description: z.string().trim().max(5000).nullish().transform((v) => v ?? ""),
  questions: z.array(questionSchema).max(200),
  status: z.enum(STATUSES),
  thank_you: z.string().trim().max(2000).nullish().transform((v) => v ?? ""),
  closes_at: z.string().trim().max(30).nullable().optional(),
  one_per_device: z.boolean().optional().default(false),
  slug: z.string().trim().max(80).optional(),
});

// ---- Rows ---------------------------------------------------------------

export interface Survey {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  questions: Question[];
  status: (typeof STATUSES)[number];
  thank_you: string | null;
  closes_at: string | null;
  one_per_device: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export function decodeSurvey(row: Row): Survey {
  let questions: Question[] = [];
  try {
    questions = JSON.parse(String(row.questions ?? "[]"));
  } catch {}
  return { ...(row as unknown as Survey), questions, one_per_device: Boolean(row.one_per_device) };
}

export async function getSurvey(idOrSlug: number | string) {
  const row = await db.get<Row>(`SELECT * FROM surveys WHERE ${typeof idOrSlug === "number" ? "id" : "slug"} = ?`, [idOrSlug]);
  return row ? decodeSurvey(row) : null;
}

/** An open survey past its closing time counts as closed. */
export function isAccepting(survey: Pick<Survey, "status" | "closes_at">) {
  if (survey.status !== "open") return false;
  if (survey.closes_at) {
    // closes_at is entered in Nepal time (UTC+5:45), like event times.
    const nowNepal = new Date(Date.now() + 345 * 60 * 1000).toISOString().slice(0, 16);
    if (String(survey.closes_at) <= nowNepal) return false;
  }
  return true;
}

const randomSlug = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 8);

export async function uniqueSurveySlug(base: string, ignoreId = -1) {
  const root = slugify(base) || randomSlug();
  let slug = root;
  let n = 2;
  while (await db.get(`SELECT id FROM surveys WHERE slug = ? AND id != ?`, [slug, ignoreId])) slug = `${root}-${n++}`;
  return slug;
}

export const newQuestionId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

export function hashIp(ip: string | undefined) {
  return crypto.createHmac("sha256", config.jwtSecret).update(ip ?? "").digest("hex").slice(0, 16);
}

// ---- Validating a visitor's answers ------------------------------------

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Returns cleaned answers, or a map of question id → error message.
 * Only answers to questions that exist are kept.
 */
export function validateAnswers(questions: Question[], raw: unknown, lang: "en" | "np") {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const np = lang === "np";
  const msg = {
    required: np ? "यो प्रश्नको उत्तर आवश्यक छ।" : "This question is required.",
    invalid: np ? "उत्तर मिलेन।" : "This answer isn't valid.",
    email: np ? "मान्य इमेल लेख्नुहोस्।" : "Enter a valid email.",
    phone: np ? "मान्य फोन नम्बर लेख्नुहोस्।" : "Enter a valid phone number.",
    number: np ? "अंकमा लेख्नुहोस्।" : "Enter a number.",
  };
  const answers: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  for (const q of questions) {
    if (q.type === "section") continue;
    let v = input[q.id];
    if (typeof v === "string") v = v.trim();
    const empty = v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
    if (empty) {
      if (q.required) errors[q.id] = msg.required;
      continue;
    }

    switch (q.type) {
      case "short":
      case "long": {
        answers[q.id] = String(v).slice(0, q.type === "short" ? 500 : 5000);
        break;
      }
      case "single":
      case "dropdown": {
        const s = String(v).slice(0, 300);
        if (!q.options.includes(s) && !q.allowOther) errors[q.id] = msg.invalid;
        else answers[q.id] = s;
        break;
      }
      case "multi": {
        const arr = (Array.isArray(v) ? v : [v]).map((x) => String(x).trim().slice(0, 300)).filter(Boolean);
        const bad = arr.some((x) => !q.options.includes(x)) && !q.allowOther;
        if (bad) errors[q.id] = msg.invalid;
        else if (arr.length) answers[q.id] = [...new Set(arr)];
        else if (q.required) errors[q.id] = msg.required;
        break;
      }
      case "rating":
      case "scale":
      case "number": {
        const n = Number(v);
        if (!Number.isFinite(n)) {
          errors[q.id] = msg.number;
          break;
        }
        if (q.type !== "number") {
          const { min, max } = scaleRange(q);
          if (!Number.isInteger(n) || n < min || n > max) {
            errors[q.id] = msg.invalid;
            break;
          }
        } else if ((q.min !== undefined && n < q.min) || (q.max !== undefined && n > q.max)) {
          errors[q.id] = msg.invalid;
          break;
        }
        answers[q.id] = n;
        break;
      }
      case "date": {
        const s = String(v);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) errors[q.id] = msg.invalid;
        else answers[q.id] = s;
        break;
      }
      case "email": {
        const s = String(v).slice(0, 200);
        if (!EMAIL.test(s)) errors[q.id] = msg.email;
        else answers[q.id] = s;
        break;
      }
      case "phone": {
        const s = String(v).slice(0, 30);
        if (!/^[+\d][\d\s-]{6,}$/.test(s)) errors[q.id] = msg.phone;
        else answers[q.id] = s;
        break;
      }
    }
  }
  return { answers, errors };
}

export function scaleRange(q: Pick<Question, "type" | "min" | "max">) {
  if (q.type === "rating") return { min: 1, max: Math.min(Math.max(q.max ?? 5, 3), 10) };
  const min = q.min === 0 ? 0 : 1;
  return { min, max: Math.min(Math.max(q.max ?? 10, min + 1), 10) };
}

// ---- Starter templates -------------------------------------------------

type Draft = Partial<Question> & Pick<Question, "type" | "title">;

const WARDS = ["१", "२", "३", "४", "५", "६", "७", "८", "९"].map((n) => `वडा ${n}`);
const AGE = ["१८–२५", "२६–३५", "३६–४५", "४६–६०", "६० भन्दा माथि"];
const GENDER = ["महिला", "पुरुष", "अन्य", "भन्न चाहन्न"];

const who: Draft[] = [
  { type: "section", title: "तपाईंको बारेमा", help: "यो जानकारी विश्लेषणका लागि मात्र प्रयोग हुन्छ।" },
  { type: "dropdown", title: "तपाईं कुन वडामा बस्नुहुन्छ?", options: WARDS, required: true },
  { type: "single", title: "उमेर समूह", options: AGE },
  { type: "single", title: "लिङ्ग", options: GENDER },
];

export interface SurveyTemplate {
  key: string;
  name: string;
  description: string;
  title: string;
  intro: string;
  questions: Draft[];
}

export const templates: SurveyTemplate[] = [
  {
    key: "blank",
    name: "Blank survey",
    description: "Start from an empty form and add your own questions.",
    title: "Untitled survey",
    intro: "",
    questions: [{ type: "short", title: "Question 1" }],
  },
  {
    key: "community-needs",
    name: "Community needs",
    description: "What people in each ward need most: priorities, problems and how to help.",
    title: "समुदायको आवश्यकता सर्वेक्षण",
    intro: "तपाईंको टोल र समुदायलाई सबैभन्दा बढी के चाहिन्छ? तपाईंको उत्तरले हाम्रा सामाजिक कार्यक्रम योजना बनाउन मद्दत गर्छ। ३ मिनेट लाग्छ।",
    questions: [
      ...who,
      { type: "section", title: "तपाईंको समुदायको आवश्यकता" },
      {
        type: "multi",
        title: "तपाईंको समुदायमा सबैभन्दा बढी सहयोग कुन क्षेत्रमा चाहिन्छ? (तीनवटासम्म छान्नुहोस्)",
        options: ["शिक्षा", "स्वास्थ्य", "युवा रोजगारी तथा सीप", "महिला सशक्तीकरण", "ज्येष्ठ नागरिक", "खानेपानी तथा सरसफाइ", "वातावरण", "कृषि", "विपद् तथा राहत"],
        allowOther: true,
        required: true,
      },
      { type: "long", title: "तपाईंको टोलको सबैभन्दा ठूलो समस्या के हो?" },
      { type: "single", title: "सामाजिक कार्यक्रममा तपाईं सहभागी हुन चाहनुहुन्छ?", options: ["चाहन्छु", "कहिलेकाहीँ", "अहिले होइन"] },
      { type: "phone", title: "फोन नम्बर (ऐच्छिक)", help: "कार्यक्रमको जानकारी दिन मात्र प्रयोग हुन्छ।" },
    ],
  },
  {
    key: "programme-registration",
    name: "Programme registration",
    description: "Sign-ups for a training, health camp, relief distribution or other programme.",
    title: "कार्यक्रम दर्ता",
    intro: "कार्यक्रममा सहभागी हुन तलको फारम भर्नुहोस्। हामी फोनमार्फत सम्पर्क गर्नेछौं।",
    questions: [
      { type: "short", title: "पूरा नाम", required: true },
      { type: "phone", title: "फोन नम्बर", required: true },
      { type: "dropdown", title: "वडा", options: WARDS, required: true },
      { type: "single", title: "उमेर समूह", options: AGE },
      { type: "single", title: "लिङ्ग", options: GENDER },
      { type: "long", title: "केही भन्न चाहनुहुन्छ? (ऐच्छिक)" },
    ],
  },
  {
    key: "event-feedback",
    name: "Event feedback",
    description: "Quick feedback after a programme, meeting or community event.",
    title: "कार्यक्रम प्रतिक्रिया",
    intro: "कार्यक्रममा सहभागी हुनुभएकोमा धन्यवाद। कृपया छोटो प्रतिक्रिया दिनुहोस्।",
    questions: [
      { type: "rating", title: "कार्यक्रम कस्तो लाग्यो?", max: 5, required: true },
      { type: "multi", title: "कुन कुरा राम्रो लाग्यो?", options: ["विषयवस्तु", "प्रश्नोत्तर", "व्यवस्थापन", "समय", "स्थान"], allowOther: true },
      { type: "long", title: "अर्को पटक के सुधार गर्नुपर्छ?" },
      { type: "single", title: "हाम्रा कार्यक्रममा स्वयंसेवक बन्न चाहनुहुन्छ?", options: ["चाहन्छु", "अहिले होइन"] },
      { type: "phone", title: "फोन नम्बर (ऐच्छिक)" },
    ],
  },
];

export function fromTemplate(key: string) {
  const t = templates.find((x) => x.key === key) ?? templates[0];
  const questions: Question[] = t.questions.map((q) =>
    questionSchema.parse({ ...q, id: newQuestionId() }),
  );
  return { title: t.title, description: t.intro, questions };
}

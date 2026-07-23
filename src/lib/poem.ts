// POEM — Patient-Oriented Eczema Measure.
//
// Pure, dependency-free maths — Node-testable (scripts/poem.test.ts) and safe
// to import from client components. No server-only deps, no network.
//
// POEM (Charman, Venn & Williams, 2004) is a validated 7-item patient
// questionnaire. Each item asks how many days in the last week a symptom was
// present, scored 0–4:
//   0 = No days · 1 = 1–2 days · 2 = 3–4 days · 3 = 5–6 days · 4 = Every day
// Total 0–28. Used here as an educational self-tracking measure — the UI must
// label it as such, not as a diagnosis.

export interface PoemQuestion {
  id: string;
  /** "Over the last week, on how many days has …" */
  text: string;
}

export const POEM_QUESTIONS: PoemQuestion[] = [
  { id: "itch", text: "…your skin been itchy?" },
  { id: "sleep", text: "…your sleep been disturbed because of your skin?" },
  { id: "bleeding", text: "…your skin been bleeding?" },
  { id: "weeping", text: "…your skin been weeping or oozing clear fluid?" },
  { id: "cracking", text: "…your skin been cracked?" },
  { id: "flaking", text: "…your skin been flaking off?" },
  { id: "dryness", text: "…your skin felt dry or rough?" },
];

export const POEM_ANSWERS: { value: number; label: string }[] = [
  { value: 0, label: "No days" },
  { value: 1, label: "1–2 days" },
  { value: 2, label: "3–4 days" },
  { value: 3, label: "5–6 days" },
  { value: 4, label: "Every day" },
];

export type PoemAnswers = Record<string, number | null>;

export function emptyPoemAnswers(): PoemAnswers {
  return Object.fromEntries(POEM_QUESTIONS.map((q) => [q.id, null]));
}

/** True once every question has an answer. */
export function poemComplete(answers: PoemAnswers): boolean {
  return POEM_QUESTIONS.every((q) => typeof answers[q.id] === "number");
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Total POEM score 0–28. Unanswered questions count as 0. */
export function poemScore(answers: PoemAnswers): number {
  return POEM_QUESTIONS.reduce(
    (sum, q) => sum + clamp(Math.round(answers[q.id] ?? 0), 0, 4),
    0
  );
}

export const POEM_MAX = 28;

export interface PoemBand {
  label: string;
  tone: "emerald" | "amber" | "orange" | "rose";
  blurb: string;
}

/** Standard POEM severity bands (Charman et al., 2013). */
export function poemBand(score: number): PoemBand {
  if (score <= 2)
    return { label: "Clear / almost clear", tone: "emerald", blurb: "Little to no eczema this week." };
  if (score <= 7)
    return { label: "Mild", tone: "amber", blurb: "Mild eczema over the last week." };
  if (score <= 16)
    return { label: "Moderate", tone: "orange", blurb: "Moderate eczema over the last week." };
  if (score <= 24)
    return { label: "Severe", tone: "rose", blurb: "Severe eczema over the last week." };
  return { label: "Very severe", tone: "rose", blurb: "Very severe eczema over the last week." };
}

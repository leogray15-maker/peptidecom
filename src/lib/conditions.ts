// Condition registry: everything condition-specific the tracking engine needs
// — stages, symptoms, body zones, trigger suggestions, copy — lives here so
// the same infrastructure serves TSW, eczema, psoriasis, acne and rosacea
// without per-condition rebuilds.
//
// Safe for both server and client code (no server-only deps).
//
// Conventions that keep the rest of the app simple:
//  - A missing/unknown condition ALWAYS resolves to TSW (every account that
//    existed before this feature is a TSW user — no data migration needed).
//  - Every condition's final stage id is "recovered", so milestone logic
//    (earnedMilestones) works unchanged across conditions.
//  - Zone/symptom ids are globally unique strings; API validation accepts the
//    union across conditions (ALL_ZONE_IDS / ALL_SYMPTOM_IDS) so switching
//    condition never invalidates previously-logged data.

import { BODY_ZONES, SYMPTOMS, TSW_STAGES, type BodyZone, type TswStage } from "@/lib/tsw";

export interface ConditionSymptom {
  id: string;
  label: string;
}

export interface TriggerSuggestion {
  kind: string; // TRIGGER_KINDS id
  name: string;
}

export interface ConditionConfig {
  id: string;
  label: string;
  emoji: string;
  /** Shown under the picker option. */
  blurb: string;
  stages: TswStage[];
  symptoms: readonly ConditionSymptom[];
  zones: BodyZone[];
  /** Quick-add chips on the triggers page. */
  triggerSuggestions: TriggerSuggestion[];
  /** Timeline page copy — TSW says "withdrawal", nothing else should. */
  timeline: { title: string; subtitle: string };
  startDateQuestion: string;
}

// Extra zones for face-centric conditions (chip-only — the body-map SVG keeps
// its generic shapes and these appear in the chip row).
const FACE_ZONES: BodyZone[] = [
  { id: "forehead", label: "Forehead" },
  { id: "cheeks", label: "Cheeks" },
  { id: "nose", label: "Nose" },
  { id: "chin", label: "Chin" },
  { id: "jawline", label: "Jawline" },
  { id: "shoulders", label: "Shoulders" },
];

const zones = (ids: string[]): BodyZone[] =>
  ids.map((id) => [...BODY_ZONES, ...FACE_ZONES].find((z) => z.id === id)!).filter(Boolean);

/** Generic non-withdrawal stage journeys. Tone rule matches lib/tsw.ts: warm,
 * never clinical, framed as "many people experience…". */
function stages(
  defs: [id: string, name: string, timeframe: string, summary: string, experiences: string[]][]
): TswStage[] {
  return defs.map(([id, name, timeframe, summary, experiences]) => ({
    id,
    name,
    timeframe,
    summary,
    experiences,
  }));
}

export const CONDITIONS: ConditionConfig[] = [
  {
    id: "tsw",
    label: "TSW / steroid withdrawal",
    emoji: "🌊",
    blurb: "Coming off topical steroids and riding the rebound.",
    stages: TSW_STAGES,
    symptoms: SYMPTOMS,
    zones: BODY_ZONES,
    triggerSuggestions: [
      { kind: "product", name: "New moisturiser" },
      { kind: "environment", name: "Hot shower" },
      { kind: "environment", name: "Sweating / exercise" },
      { kind: "stress", name: "Stressful day" },
      { kind: "food", name: "Alcohol" },
      { kind: "routine", name: "Skipped moisturiser" },
    ],
    timeline: {
      title: "Where am I in this?",
      subtitle:
        "A rough map of the road many people walk. Mark where you are — not to be graded, just so this place can meet you there.",
    },
    startDateQuestion: "When did you stop steroids?",
  },
  {
    id: "eczema",
    label: "Eczema / dermatitis",
    emoji: "🌿",
    blurb: "Managing flares and building calmer skin.",
    stages: stages([
      [
        "flaring",
        "In a bad flare",
        "Right now",
        "Flares feel endless from the inside. They aren't — they crest and pass, and what you do between them is what changes the next one.",
        [
          "Intense itch, broken sleep and raw patches",
          "Frustration when a good run ends suddenly",
          "Trial-and-error with products and routines",
        ],
      ],
      [
        "stabilising",
        "Getting it under control",
        "The turning point",
        "You're finding what calms your skin and what sets it off. Progress here is often invisible day to day and obvious month to month.",
        [
          "Shorter, less angry flares",
          "A routine that's starting to feel repeatable",
          "First stretches of properly calm skin",
        ],
      ],
      [
        "managing",
        "Managing well",
        "Most days",
        "Your routine mostly holds. Flares still happen, but they're events with causes you can often name — not a way of life.",
        [
          "Calm stretches measured in weeks",
          "Knowing your top triggers and dodging most of them",
          "Sleep mostly back",
        ],
      ],
      [
        "recovered",
        "Clear & maintaining",
        "You define this one",
        "Skin is no longer the first thing you think about. Maintenance is habit, not survival — and your notes can shortcut someone else's worst year.",
        [
          "Stable skin with ordinary ups and downs",
          "Confidence back — clothes, exercise, social plans",
          "A maintenance routine on autopilot",
        ],
      ],
    ]),
    symptoms: SYMPTOMS,
    zones: BODY_ZONES,
    triggerSuggestions: [
      { kind: "product", name: "New detergent / soap" },
      { kind: "food", name: "Dairy" },
      { kind: "environment", name: "Dust / pollen" },
      { kind: "environment", name: "Cold dry weather" },
      { kind: "stress", name: "Stressful day" },
      { kind: "routine", name: "Skipped moisturiser" },
    ],
    timeline: {
      title: "Where am I in this?",
      subtitle:
        "A rough map of the road from constant flares to calm, managed skin. Mark where you are so this place can meet you there.",
    },
    startDateQuestion: "When did you start tackling your eczema seriously?",
  },
  {
    id: "psoriasis",
    label: "Psoriasis",
    emoji: "🛡️",
    blurb: "Calming plaques and finding what keeps them away.",
    stages: stages([
      [
        "flaring",
        "In a bad flare",
        "Right now",
        "Plaques spreading or angry. It's exhausting — and it's also the stage where tracking pays off fastest, because patterns hide in bad weeks.",
        [
          "Spreading or thickening plaques, heavy scaling",
          "Itch, cracking and sometimes joint aches",
          "Self-consciousness that's heavier than the symptoms",
        ],
      ],
      [
        "stabilising",
        "Getting it under control",
        "The turning point",
        "Treatment and routine are starting to bite. Plaques thin before they shrink — many people miss their own progress at this stage.",
        [
          "Plaques flattening and fading from red toward pink",
          "Less daily scaling",
          "A clearer picture of your personal triggers",
        ],
      ],
      [
        "managing",
        "Managing well",
        "Most days",
        "Mostly quiet skin with known trouble spots. Flares have causes you can often name, and a playbook you've already run.",
        [
          "Long calm stretches with a few stubborn patches",
          "Confidence returning about clothes and swimming",
          "Routine maintenance rather than firefighting",
        ],
      ],
      [
        "recovered",
        "Clear & maintaining",
        "You define this one",
        "Clear or near-clear, with a routine that holds. Your map of what works is now worth a lot to someone at stage one.",
        [
          "Skin that's mostly an afterthought",
          "Occasional small patches handled early",
          "Maintenance on autopilot",
        ],
      ],
    ]),
    symptoms: [
      { id: "plaques", label: "Plaques / scaling" },
      { id: "itch", label: "Itch" },
      { id: "redness", label: "Redness" },
      { id: "cracking", label: "Cracking" },
      { id: "flaking", label: "Flaking" },
      { id: "joint-pain", label: "Joint pain" },
    ],
    zones: BODY_ZONES,
    triggerSuggestions: [
      { kind: "stress", name: "Stressful day" },
      { kind: "food", name: "Alcohol" },
      { kind: "environment", name: "Cold dry weather" },
      { kind: "environment", name: "Skin injury / scratch" },
      { kind: "routine", name: "Missed treatment day" },
      { kind: "food", name: "Gluten" },
    ],
    timeline: {
      title: "Where am I in this?",
      subtitle:
        "A rough map of the road from angry plaques to clear, managed skin. Mark where you are so this place can meet you there.",
    },
    startDateQuestion: "When did you start tackling your psoriasis seriously?",
  },
  {
    id: "acne",
    label: "Acne",
    emoji: "✨",
    blurb: "Clearing breakouts and keeping them gone.",
    stages: stages([
      [
        "active",
        "Active breakouts",
        "Right now",
        "Frequent or painful breakouts. The fix is rarely one product — it's finding your pattern, and that starts with writing things down.",
        [
          "New spots most weeks, some deep and painful",
          "Temptation to throw every product at it at once",
          "Confidence taking a hit",
        ],
      ],
      [
        "treatment",
        "Routine bedding in",
        "The patient stretch",
        "You've picked a lane — skincare, prescription, diet, all of the above — and now it needs weeks to work. Purging and slow progress are normal here.",
        [
          "Possible early purging before it improves",
          "Learning what your skin tolerates",
          "Progress that photos catch before mirrors do",
        ],
      ],
      [
        "improving",
        "Clearly improving",
        "Momentum",
        "Fewer, smaller, shorter-lived breakouts. The routine is working — the job now is consistency, not novelty.",
        [
          "Longer gaps between breakouts",
          "Marks fading faster than new spots arrive",
          "Confidence coming back",
        ],
      ],
      [
        "recovered",
        "Clear & maintaining",
        "You define this one",
        "Mostly clear, with the occasional spot that doesn't spiral. You know your skin now — that knowledge is the actual cure.",
        [
          "A simple routine you barely think about",
          "Occasional spots handled without panic",
          "Scars and marks fading",
        ],
      ],
    ]),
    symptoms: [
      { id: "whiteheads", label: "Whiteheads" },
      { id: "blackheads", label: "Blackheads" },
      { id: "cysts", label: "Painful / cystic" },
      { id: "redness", label: "Redness" },
      { id: "oiliness", label: "Oiliness" },
      { id: "scarring", label: "Marks / scarring" },
    ],
    zones: zones(["forehead", "cheeks", "nose", "chin", "jawline", "neck", "chest", "back", "shoulders"]),
    triggerSuggestions: [
      { kind: "food", name: "Dairy" },
      { kind: "food", name: "Sugar / junk food" },
      { kind: "product", name: "New skincare product" },
      { kind: "routine", name: "Slept in makeup" },
      { kind: "stress", name: "Stressful week" },
      { kind: "environment", name: "Sweating / gym" },
    ],
    timeline: {
      title: "Where am I in this?",
      subtitle:
        "A rough map of the road from constant breakouts to clear, low-effort skin. Mark where you are so this place can meet you there.",
    },
    startDateQuestion: "When did you start tackling your acne seriously?",
  },
  {
    id: "rosacea",
    label: "Rosacea",
    emoji: "🌸",
    blurb: "Taming flushing and finding your triggers.",
    stages: stages([
      [
        "flaring",
        "Flaring often",
        "Right now",
        "Flushing, burning or bumps most days. Rosacea is intensely trigger-driven — which is bad news for comfort and great news for tracking.",
        [
          "Unpredictable flushing and heat",
          "Sensitivity to products that used to be fine",
          "Guessing at causes",
        ],
      ],
      [
        "mapping",
        "Mapping triggers",
        "The detective stage",
        "You're building your personal trigger map — sun, heat, alcohol, stress, foods. Every logged flare narrows the suspect list.",
        [
          "Clear culprits starting to emerge",
          "Fewer surprise flares",
          "A gentler routine that your skin accepts",
        ],
      ],
      [
        "managing",
        "Managing well",
        "Most days",
        "You know your triggers and dodge most of them. Flares are shorter, rarer, and less of a mystery.",
        [
          "Calm stretches measured in weeks",
          "Confidence in social settings coming back",
          "A short list of known no-gos",
        ],
      ],
      [
        "recovered",
        "Calm & maintaining",
        "You define this one",
        "Mostly calm skin and a trigger map you trust. The occasional flush doesn't spiral — you know exactly what it was.",
        [
          "Rare, short-lived flares",
          "Routine and diet on autopilot",
          "Your face no longer runs your calendar",
        ],
      ],
    ]),
    symptoms: [
      { id: "flushing", label: "Flushing" },
      { id: "redness", label: "Redness" },
      { id: "bumps", label: "Bumps / pustules" },
      { id: "burning", label: "Burning / stinging" },
      { id: "dryness", label: "Dryness" },
      { id: "eye-irritation", label: "Eye irritation" },
    ],
    zones: zones(["forehead", "cheeks", "nose", "chin", "neck", "chest"]),
    triggerSuggestions: [
      { kind: "food", name: "Alcohol" },
      { kind: "food", name: "Spicy food" },
      { kind: "environment", name: "Sun exposure" },
      { kind: "environment", name: "Heat / hot drinks" },
      { kind: "stress", name: "Stressful day" },
      { kind: "product", name: "New skincare product" },
    ],
    timeline: {
      title: "Where am I in this?",
      subtitle:
        "A rough map of the road from daily flushing to calm, predictable skin. Mark where you are so this place can meet you there.",
    },
    startDateQuestion: "When did you start tackling your rosacea seriously?",
  },
  {
    id: "other",
    label: "Something else",
    emoji: "🧭",
    blurb: "A different skin journey — the tools still work.",
    stages: stages([
      [
        "rough",
        "In the thick of it",
        "Right now",
        "Whatever your skin is doing, the pattern is hiding in the days. Logging is how you make it visible.",
        [
          "Symptoms most days",
          "Trial-and-error with routines",
          "More questions than answers — for now",
        ],
      ],
      [
        "stabilising",
        "Getting it under control",
        "The turning point",
        "Patterns are emerging and your routine is starting to hold. Keep logging — this is where the data starts paying rent.",
        [
          "Fewer bad days per week",
          "A shortlist of likely triggers",
          "A routine that's starting to feel repeatable",
        ],
      ],
      [
        "improving",
        "Clearly improving",
        "Momentum",
        "The trend line points the right way. Consistency beats intensity from here.",
        ["Longer calm stretches", "Setbacks that recover faster", "Confidence returning"],
      ],
      [
        "recovered",
        "Calm & maintaining",
        "You define this one",
        "Your skin is no longer the loudest thing in your day. Maintenance is habit, and your notes could carry someone else through their worst week.",
        ["Stable skin with ordinary ups and downs", "Maintenance on autopilot", "Looking back and seeing how far you've come"],
      ],
    ]),
    symptoms: [
      { id: "itch", label: "Itch" },
      { id: "redness", label: "Redness" },
      { id: "flaking", label: "Flaking" },
      { id: "pain", label: "Pain / soreness" },
      { id: "swelling", label: "Swelling" },
      { id: "dryness", label: "Dryness" },
    ],
    zones: BODY_ZONES,
    triggerSuggestions: [
      { kind: "product", name: "New product" },
      { kind: "food", name: "Alcohol" },
      { kind: "environment", name: "Weather change" },
      { kind: "stress", name: "Stressful day" },
      { kind: "routine", name: "Routine change" },
    ],
    timeline: {
      title: "Where am I in this?",
      subtitle:
        "A rough map of the road many people walk. Mark where you are — not to be graded, just so this place can meet you there.",
    },
    startDateQuestion: "When did this journey start?",
  },
];

export const DEFAULT_CONDITION = "tsw";

/** Resolve a condition id (or nothing) to its config. Unknown/missing → TSW,
 * which is what every pre-existing account is. */
export function getCondition(id?: string | null): ConditionConfig {
  return CONDITIONS.find((c) => c.id === id) ?? CONDITIONS[0];
}

export const conditionLabel = (id?: string | null) => getCondition(id).label;

export const CONDITION_IDS = CONDITIONS.map((c) => c.id) as [string, ...string[]];

// Validation unions: logs stay valid across condition switches.
export const ALL_ZONE_IDS = [
  ...new Set(CONDITIONS.flatMap((c) => c.zones.map((z) => z.id))),
] as [string, ...string[]];

export const ALL_SYMPTOM_IDS = [
  ...new Set(CONDITIONS.flatMap((c) => c.symptoms.map((s) => s.id))),
] as [string, ...string[]];

/** Label lookup across every condition's zones (for history rows etc.). */
export function anyZoneLabel(id: string): string {
  for (const c of CONDITIONS) {
    const z = c.zones.find((x) => x.id === id);
    if (z) return z.label;
  }
  return id;
}

export function anySymptomLabel(id: string): string {
  for (const c of CONDITIONS) {
    const s = c.symptoms.find((x) => x.id === id);
    if (s) return s.label;
  }
  return id;
}

/** Stage name across all conditions (stage ids are per-condition journeys). */
export function anyStageName(stageId?: string | null, conditionId?: string | null): string | null {
  if (!stageId) return null;
  const own = getCondition(conditionId).stages.find((s) => s.id === stageId);
  if (own) return own.name;
  for (const c of CONDITIONS) {
    const s = c.stages.find((x) => x.id === stageId);
    if (s) return s.name;
  }
  return null;
}

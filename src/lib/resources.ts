// Curated resource library. Curation IS the value here — a short, vetted list
// with honest editorial summaries beats an endless link dump. Content is
// static/in-repo so editors review changes via PR.

export interface Resource {
  title: string;
  source: string;
  url: string;
  kind: "org" | "article" | "study" | "video" | "community" | "guide";
  summary: string;
}

export interface ResourceSection {
  title: string;
  blurb: string;
  items: Resource[];
}

export const RESOURCE_SECTIONS: ResourceSection[] = [
  {
    title: "Understand TSW",
    blurb: "Start here if you're new to this — what topical steroid withdrawal is, and why you're not imagining it.",
    items: [
      {
        title: "ITSAN — International Topical Steroid Awareness Network",
        source: "itsan.org",
        url: "https://www.itsan.org/",
        kind: "org",
        summary:
          "The nonprofit at the centre of TSW awareness. Clear explanations, caregiver resources and a directory of support options. If you read one site, read this one.",
      },
      {
        title: "Topical steroid withdrawal overview",
        source: "National Eczema Association",
        url: "https://nationaleczema.org/blog/topical-steroid-withdrawal/",
        kind: "article",
        summary:
          "A mainstream eczema organisation acknowledging TSW — useful both for understanding and for showing sceptical family members that this is recognised.",
      },
      {
        title: "A systematic review of topical corticosteroid withdrawal (Hajar et al., 2015)",
        source: "Journal of the American Academy of Dermatology",
        url: "https://pubmed.ncbi.nlm.nih.gov/25592622/",
        kind: "study",
        summary:
          "The most-cited academic review of TSW. Dense, but powerful to bring to appointments — it's the paper many dermatologists have actually heard of.",
      },
    ],
  },
  {
    title: "Skin science & barrier repair",
    blurb: "Understanding how skin heals makes the slow parts easier to sit with.",
    items: [
      {
        title: "Understanding your skin barrier",
        source: "National Eczema Society (UK)",
        url: "https://eczema.org/information-and-advice/",
        kind: "guide",
        summary:
          "Plain-English guides on the skin barrier, emollients and eczema care from the UK's national charity. Good grounding before you experiment with routines.",
      },
      {
        title: "Eczema (atopic dermatitis) overview",
        source: "NHS",
        url: "https://www.nhs.uk/conditions/atopic-eczema/",
        kind: "guide",
        summary:
          "A sober, no-hype baseline on eczema itself. Useful for separating underlying eczema from withdrawal effects when you talk to clinicians.",
      },
      {
        title: "Topical steroid addiction in atopic dermatitis (Fukaya et al., 2014)",
        source: "Drug, Healthcare and Patient Safety",
        url: "https://pubmed.ncbi.nlm.nih.gov/25378953/",
        kind: "study",
        summary:
          "An open-access paper from Japanese dermatologists describing steroid addiction and withdrawal patterns. Another good one for the appointment folder.",
      },
    ],
  },
  {
    title: "Daily comfort & coping",
    blurb: "Small, practical things members reach for on hard days. Peer wisdom, not prescriptions.",
    items: [
      {
        title: "Itch management strategies",
        source: "National Eczema Association",
        url: "https://nationaleczema.org/eczema/itchy-skin/",
        kind: "guide",
        summary:
          "A grab-bag of legitimate itch-coping techniques — cooling, habit reversal, wet wraps. Try them on a calm day so they're ready on a bad one.",
      },
      {
        title: "Sleep and eczema",
        source: "National Eczema Society (UK)",
        url: "https://eczema.org/information-and-advice/living-with-eczema/sleep/",
        kind: "guide",
        summary:
          "Sleep loss makes everything harder. Realistic tactics for itchy nights — worth pairing with your own itch-vs-sleep chart in Insights.",
      },
    ],
  },
  {
    title: "Community & stories",
    blurb: "Places where people who get it gather. Read with care on rough days — dose your exposure.",
    items: [
      {
        title: "r/TS_Withdrawal",
        source: "Reddit",
        url: "https://www.reddit.com/r/TS_Withdrawal/",
        kind: "community",
        summary:
          "The largest open TSW community. Unfiltered and sometimes heavy — the recovery-story flair is the gold in it.",
      },
      {
        title: "ITSAN recovery stories",
        source: "itsan.org",
        url: "https://www.itsan.org/community-stories/",
        kind: "community",
        summary:
          "Long-form recovery accounts collected by ITSAN. Bookmark for flare days — proof in other people's words that this ends.",
      },
    ],
  },
  {
    title: "For your appointments",
    blurb: "TSW goes better with a clinician on your side. These help you find one and brief them.",
    items: [
      {
        title: "Questions for your doctor (in-app tool)",
        source: "The Arcane Lab",
        url: "/doctor",
        kind: "guide",
        summary:
          "Our appointment-prep builder: it pulls your recent tracker data into a printable summary and helps you build a question list before you go.",
      },
      {
        title: "Finding an eczema specialist",
        source: "National Eczema Association",
        url: "https://nationaleczema.org/eczema-provider-finder/",
        kind: "guide",
        summary:
          "A provider directory. A clinician who listens is worth several who don't — it's okay to keep looking until you find one.",
      },
    ],
  },
];

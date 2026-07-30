export const VISIBLE_TOUR_PACE = Object.freeze({
  slowMotion: 55,
  scenePause: 450,
  routePause: 180,
  cursorSteps: 24,
});

export const HEADLESS_TOUR_PACE = Object.freeze({
  slowMotion: 0,
  scenePause: 60,
  routePause: 30,
  cursorSteps: 2,
});

export const TOUR_STEP_TOTALS = Object.freeze({
  empty: 10,
  demo: 10,
  llm: 10,
});

const DEFAULT_GUIDANCE = Object.freeze({
  description: "Follow the next movement through Dream Atlas.",
  holdWeight: 0.8,
});

const STEP_GUIDANCE = Object.freeze({
  "Open the empty Atlas": {
    description:
      "Every personal archive begins quietly: 0 memories and 0 constellations.",
    holdWeight: 0.9,
  },
  "Open the preservation flow": {
    description: "One remembered fragment is enough to begin.",
    holdWeight: 0.65,
  },
  "Preserve one dream": {
    description:
      "The memory pipeline shapes a title, narration, motifs, and connections without rewriting the dreamer.",
    holdWeight: 1.15,
  },
  "Reveal the new star": {
    description:
      "The preserved memory returns to the Atlas as a new silver star.",
    holdWeight: 0.9,
  },
  "Open Dream Cards": {
    description:
      "The same memory also enters the visual archive of Dream Cards.",
    holdWeight: 0.8,
  },
  "Open the 38-dream demo Atlas": {
    description:
      "A separate synthetic library fills the sky with 38 memories and 8 living constellations.",
    holdWeight: 1,
  },
  "Trace the living constellation": {
    description:
      "The cursor visits five connected stars; each hover reveals a memory and its silver paths.",
    holdWeight: 0.65,
  },
  "Search and choose a returning motif": {
    description:
      "Searching for “water” reveals matching memories. Choosing one focuses its star and opens a preview.",
    holdWeight: 0.9,
  },
  "Open the searched Dream Memory": {
    description:
      "The focused search result opens as a complete Dream Memory.",
    holdWeight: 0.75,
  },
  "Return to all Dream Cards": {
    description:
      "Dream Cards gather the archive into a visual gallery.",
    holdWeight: 0.75,
  },
  "Switch to the flowing Timeline": {
    description:
      "The same memories can be followed as a chronological river.",
    holdWeight: 0.85,
  },
  "Return to cards and open a Dream Memory": {
    description:
      "A Dream Card opens the complete memory and its surrounding traces.",
    holdWeight: 0.9,
  },
  "Wander across the Dream Memory": {
    description:
      "The whole memory is an interactive canvas: drag it to travel from the opening card into the deeper trace.",
    holdWeight: 0.75,
  },
  "Try the Dream Memory controls": {
    description:
      "The controls in the lower-right corner zoom out, zoom in, and restore the full composition.",
    holdWeight: 0.8,
  },
  "Find this memory in the Atlas": {
    description:
      "From its Dream Memory card, one click returns to the Atlas with the exact same star glowing in focus.",
    holdWeight: 1,
  },
});

export function getTourStepCount(mode) {
  return TOUR_STEP_TOTALS[mode] ?? 0;
}

export function getTourStepGuidance(label) {
  return STEP_GUIDANCE[label] ?? DEFAULT_GUIDANCE;
}

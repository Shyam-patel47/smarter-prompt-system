/**
 * Complexity Classifier — zero-cost heuristic for dynamic token ceiling.
 *
 * Scores a user's input 0.0–1.0 based on multiple signals, then converts
 * that score into a maxOutputTokens ceiling for the Gemini generation call.
 *
 * Design principles:
 *   - Keyword overrides dominate when word count and true complexity diverge.
 *   - No minimum length enforced anywhere — the ceiling is a safety cap, not a target.
 *   - Continuous score, not rigid buckets.
 */

// ─── Signal weights ──────────────────────────────────────────────────────────

const DEPTH_KEYWORDS = [
  'exhaustive', 'comprehensive', 'in-depth', 'in depth', 'detailed analysis',
  'full report', 'multi-section', 'multi section', 'step by step', 'step-by-step',
  'thorough', 'complete guide', 'deep dive', 'extensive',
  'cover all', 'cover every', 'leave nothing out',
  'due diligence', 'white paper', 'whitepaper', 'feasibility study',
];

const MULTI_SECTION_MARKERS = [
  /\d+-section/i, /\d+ section/i, /\d+-part/i, /\d+ part/i,
  /\d+-page/i, /\d+ page/i,
];

const BREVITY_KEYWORDS = [
  'one sentence', 'one-sentence', 'single sentence', 'one line', 'one-line',
  'briefly', 'short', 'concise', 'summarize in', 'summary in one',
  'tweet', 'tagline', 'headline', 'caption', 'subject line',
  'yes or no', 'true or false',
];

const TASK_TYPE_WEIGHT: Record<string, number> = {
  'Social Media Post': 0.1,
  'Email': 0.25,
  'Marketing Copy': 0.35,
  'Code': 0.4,
  'Blog Post': 0.55,
  'Research Summary': 0.6,
};

const MULTI_PART_MARKERS = [
  'and also', 'additionally', 'furthermore', 'moreover', 'as well as',
  'on top of that', 'in addition',
];

// ─── Core classifier ─────────────────────────────────────────────────────────

export interface ComplexityResult {
  score: number;          // 0.0 – 1.0, continuous
  maxOutputTokens: number;
  signals: {
    wordCount: number;
    wordCountSignal: number;
    depthKeywordHit: boolean;
    brevityKeywordHit: boolean;
    multiSectionHit: boolean;
    multiPartCount: number;
    taskTypeWeight: number;
  };
}

export function classifyComplexity(
  detailsInput: string,
  taskType: string
): ComplexityResult {
  const lower = detailsInput.toLowerCase();
  const words = detailsInput.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Word count signal (0.0–1.0), soft-clamped with diminishing returns
  //    10 words → ~0.15, 30 words → ~0.38, 60 words → ~0.55, 150+ words → ~0.8
  const wordCountSignal = Math.min(1, wordCount / 200) ** 0.6;

  // 2. Depth keyword detection
  const depthKeywordHit = DEPTH_KEYWORDS.some(kw => lower.includes(kw));

  // 3. Multi-section marker detection (e.g. "10-section", "5 part")
  const multiSectionHit = MULTI_SECTION_MARKERS.some(rx => rx.test(lower));

  // 4. Brevity keyword detection
  const brevityKeywordHit = BREVITY_KEYWORDS.some(kw => lower.includes(kw));

  // 5. Multi-part marker count
  const multiPartCount = MULTI_PART_MARKERS.reduce(
    (count, marker) => count + (lower.includes(marker) ? 1 : 0), 0
  );

  // 6. Task type weight (default 0.35 for unknown/custom)
  const taskWeight = TASK_TYPE_WEIGHT[taskType] ?? 0.35;

  // ─── Combine signals ────────────────────────────────────────────────

  // Base score: blend word count signal (60%) and task type (40%)
  let score = (wordCountSignal * 0.6) + (taskWeight * 0.4);

  // Multi-part boost: each marker adds 0.08
  score += multiPartCount * 0.08;

  // Multi-section marker boost
  if (multiSectionHit) score += 0.15;

  // ─── Keyword overrides (dominate when word count diverges) ──────────

  // Depth override: floor at 0.7 regardless of word count
  if (depthKeywordHit) score = Math.max(score, 0.7);

  // Brevity override: cap at 0.2 regardless of other signals
  if (brevityKeywordHit) score = Math.min(score, 0.2);

  // Clamp final score
  score = Math.max(0, Math.min(1, score));

  // ─── Token ceiling ─────────────────────────────────────────────────
  // Gemini 3.6 Flash is a thinking model: maxOutputTokens includes both
  // internal reasoning tokens (~800 overhead) AND visible output tokens.
  // Observed: 724 total tokens → 221 visible words (~300 visible tokens),
  // meaning ~400-500 tokens consumed by thinking.
  //
  // Target visible output range: 150–1000 tokens (trivial → complex prompt).
  // Add 1000-token offset for thinking overhead.
  // Total range: 1200 → 2200 tokens.
  const maxOutputTokens = Math.round(1200 + (score * 1000));

  return {
    score,
    maxOutputTokens,
    signals: {
      wordCount,
      wordCountSignal: Math.round(wordCountSignal * 100) / 100,
      depthKeywordHit,
      brevityKeywordHit,
      multiSectionHit,
      multiPartCount,
      taskTypeWeight: taskWeight,
    },
  };
}

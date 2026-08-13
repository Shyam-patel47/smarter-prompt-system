/**
 * Deterministic prompt template engine.
 * Assembles a clean, reusable prompt from the builder fields.
 * No LLM calls — pure string construction.
 */

export interface PromptBuildInput {
  title: string;
  taskType: string;
  details: string;
  tone: string;
  outputFormat: string;
  targetModel?: string;
  variables: Array<{ key: string; label: string; defaultValue?: string }>;
}

const TONE_DESCRIPTORS: Record<string, string> = {
  PROFESSIONAL: "professional, clear, and authoritative",
  CASUAL: "casual, conversational, and approachable",
  PERSUASIVE: "persuasive, compelling, and action-oriented",
  FRIENDLY: "warm, friendly, and encouraging",
  TECHNICAL: "precise, technical, and detail-oriented",
  WITTY: "witty, creative, and engaging",
  CUSTOM: "in the most appropriate tone for the context",
};

const OUTPUT_FORMAT_INSTRUCTIONS: Record<string, string> = {
  BULLET_POINTS: "Format your response as a clean bulleted list.",
  PARAGRAPH: "Write your response in well-structured paragraphs.",
  JSON: "Return your response as valid JSON only, with no additional explanation.",
  TABLE: "Structure your response as a markdown table with clear headers.",
  STEP_BY_STEP: "Present your response as a numbered step-by-step guide.",
  CUSTOM: "Use the most appropriate format for clarity and usability.",
};

const TASK_TYPE_VERBS: Record<string, string> = {
  MARKETING_COPY: "Write compelling marketing copy",
  EMAIL: "Draft a professional email",
  BLOG_POST: "Write a blog post",
  SOCIAL_MEDIA: "Create engaging social media content",
  CODE: "Write clean, well-commented code",
  RESEARCH_SUMMARY: "Provide a research summary",
  CUSTOM: "Complete the following task",
};

export function buildPrompt(input: PromptBuildInput): string {
  const {
    taskType, details, tone, outputFormat, variables,
  } = input;

  const toneDesc = TONE_DESCRIPTORS[tone] ?? TONE_DESCRIPTORS.PROFESSIONAL;
  const formatInstr = OUTPUT_FORMAT_INSTRUCTIONS[outputFormat] ?? OUTPUT_FORMAT_INSTRUCTIONS.PARAGRAPH;
  const taskVerb = TASK_TYPE_VERBS[taskType] ?? TASK_TYPE_VERBS.CUSTOM;

  // Replace variable keys with tokens in the details
  let processedDetails = details;
  for (const variable of variables) {
    // Ensure the variable token exists in details
    if (!processedDetails.includes(`{${variable.key}}`)) {
      // If user didn't manually add it, we'll reference it after
    }
  }

  const variableSection = variables.length > 0
    ? `\n\n**Variables:**\n${variables.map(v =>
      `- {${v.key}} — ${v.label}${v.defaultValue ? ` (default: "${v.defaultValue}")` : ""}`
    ).join("\n")}\n\nFill in the variables above with specific values before using this prompt.`
    : "";

  const prompt = [
    `**Task:** ${taskVerb}.`,
    ``,
    `**Instructions:**`,
    processedDetails,
    ``,
    `**Tone:** Write in a ${toneDesc} style.`,
    ``,
    `**Output format:** ${formatInstr}`,
    variableSection,
  ].filter(l => l !== undefined).join("\n");

  return prompt.trim();
}

export const TASK_TYPES = [
  { value: "MARKETING_COPY", label: "Marketing Copy" },
  { value: "EMAIL", label: "Email" },
  { value: "BLOG_POST", label: "Blog Post" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "CODE", label: "Code" },
  { value: "RESEARCH_SUMMARY", label: "Research Summary" },
  { value: "CUSTOM", label: "Custom" },
];

export const TONES = [
  { value: "PROFESSIONAL", label: "Professional" },
  { value: "CASUAL", label: "Casual" },
  { value: "PERSUASIVE", label: "Persuasive" },
  { value: "FRIENDLY", label: "Friendly" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "WITTY", label: "Witty" },
  { value: "CUSTOM", label: "Custom" },
];

export const OUTPUT_FORMATS = [
  { value: "PARAGRAPH", label: "Paragraph" },
  { value: "BULLET_POINTS", label: "Bullet Points" },
  { value: "STEP_BY_STEP", label: "Step-by-Step" },
  { value: "JSON", label: "JSON" },
  { value: "TABLE", label: "Table" },
  { value: "CUSTOM", label: "Custom" },
];

export const TARGET_MODELS = [
  { value: "GPT_4O", label: "GPT-4o" },
  { value: "CLAUDE", label: "Claude" },
  { value: "GEMINI", label: "Gemini" },
  { value: "OTHER", label: "Other" },
];

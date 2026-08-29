import { Response } from 'express';
import Prompt from '../models/Prompt';
import PromptVersion from '../models/PromptVersion';
import { AuthRequest } from '../middleware/auth';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getPrompts = async (req: AuthRequest, res: Response) => {
  try {
    const { folderId, q, tags, isTemplate, isFavorite, page = '1', limit = '20' } = req.query;
    const query: any = { userId: req.user?.id, deletedAt: null };
    
    if (folderId) query.folderId = folderId;
    if (isTemplate === 'true') query.isTemplate = true;
    if (isFavorite === 'true') query.isFavorite = true;
    
    if (tags) {
      const tagArray = (tags as string).split(',');
      query.tagIds = { $all: tagArray };
    }

    if (q) {
      query.$text = { $search: q as string };
    }

    const skipNum = (parseInt(page as string) - 1) * parseInt(limit as string);
    const limitNum = parseInt(limit as string);

    const prompts = await Prompt.find(query)
      .populate('tagIds')
      .sort(q ? { score: { $meta: "textScore" } } : { updatedAt: -1 })
      .skip(skipNum)
      .limit(limitNum);
      
    res.status(200).json(prompts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPrompt = async (req: AuthRequest, res: Response) => {
  try {
    const prompt = await Prompt.findOne({ _id: req.params.id, userId: req.user?.id, deletedAt: null }).populate('tagIds');
    if (!prompt) return res.status(404).json({ message: 'Prompt not found' });
    res.status(200).json(prompt);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createPrompt = async (req: AuthRequest, res: Response) => {
  try {
    const promptData = { ...req.body, userId: req.user?.id };
    
    if (promptData.detailsInput && promptData.detailsInput.length < 10) {
      return res.status(400).json({ message: 'Details must be at least 10 characters long' });
    }

    const prompt = await Prompt.create(promptData);
    res.status(201).json(prompt);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error creating prompt' });
  }
};

export const updatePrompt = async (req: AuthRequest, res: Response) => {
  try {
    const promptData = req.body;
    
    if (promptData.detailsInput && promptData.detailsInput.length < 10) {
      return res.status(400).json({ message: 'Details must be at least 10 characters long' });
    }

    // Find original to check if body changed
    const originalPrompt = await Prompt.findOne({ _id: req.params.id, userId: req.user?.id, deletedAt: null });
    if (!originalPrompt) return res.status(404).json({ message: 'Prompt not found' });

    // If body changed, save old version to PromptVersion
    if (promptData.generatedBody && originalPrompt.generatedBody !== promptData.generatedBody) {
      if (originalPrompt.generatedBody) {
        await PromptVersion.create({
          promptId: originalPrompt._id,
          bodySnapshot: originalPrompt.generatedBody
        });
      }
    }

    const prompt = await Prompt.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.id, deletedAt: null },
      promptData,
      { new: true, runValidators: true }
    ).populate('tagIds');
    
    res.status(200).json(prompt);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error updating prompt' });
  }
};

export const deletePrompt = async (req: AuthRequest, res: Response) => {
  try {
    const purgeDate = new Date();
    purgeDate.setDate(purgeDate.getDate() + 30);

    const prompt = await Prompt.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.id, deletedAt: null },
      { deletedAt: new Date(), purgeAt: purgeDate },
      { new: true }
    );
    
    if (!prompt) return res.status(404).json({ message: 'Prompt not found' });
    res.status(200).json({ message: 'Prompt moved to trash' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getVersions = async (req: AuthRequest, res: Response) => {
  try {
    // Verify ownership
    const prompt = await Prompt.findOne({ _id: req.params.id, userId: req.user?.id, deletedAt: null });
    if (!prompt) return res.status(404).json({ message: 'Prompt not found' });

    const versions = await PromptVersion.find({ promptId: prompt._id }).sort({ createdAt: -1 }).limit(10);
    res.status(200).json(versions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const restoreVersion = async (req: AuthRequest, res: Response) => {
  try {
    const originalPrompt = await Prompt.findOne({ _id: req.params.id, userId: req.user?.id, deletedAt: null });
    if (!originalPrompt) return res.status(404).json({ message: 'Prompt not found' });

    const version = await PromptVersion.findOne({ _id: req.params.versionId, promptId: originalPrompt._id });
    if (!version) return res.status(404).json({ message: 'Version not found' });

    // Snapshot current before restoring
    if (originalPrompt.generatedBody) {
      await PromptVersion.create({
        promptId: originalPrompt._id,
        bodySnapshot: originalPrompt.generatedBody
      });
    }

    originalPrompt.generatedBody = version.bodySnapshot;
    await originalPrompt.save();

    res.status(200).json(originalPrompt);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTrash = async (req: AuthRequest, res: Response) => {
  try {
    const prompts = await Prompt.find({ userId: req.user?.id, deletedAt: { $ne: null } })
      .sort({ deletedAt: -1 });
    res.status(200).json(prompts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const restorePrompt = async (req: AuthRequest, res: Response) => {
  try {
    const prompt = await Prompt.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.id, deletedAt: { $ne: null } },
      { $set: { deletedAt: null, purgeAt: null } },
      { new: true }
    );
    if (!prompt) return res.status(404).json({ message: 'Prompt not found in trash' });
    res.status(200).json(prompt);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const hardDeletePrompt = async (req: AuthRequest, res: Response) => {
  try {
    const prompt = await Prompt.findOneAndDelete({ _id: req.params.id, userId: req.user?.id, deletedAt: { $ne: null } });
    if (!prompt) return res.status(404).json({ message: 'Prompt not found in trash' });
    
    // Cleanup versions
    await PromptVersion.deleteMany({ promptId: prompt._id });
    
    res.status(200).json({ message: 'Prompt permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

import { classifyComplexity } from '../services/complexityClassifier';

export const generatePromptWithAI = async (req: AuthRequest, res: Response) => {
  try {
    const { taskType, detailsInput, tone, outputFormat, variables } = req.body;
    
    if (!detailsInput) {
      return res.status(400).json({ message: 'Details input is required' });
    }

    // ── Step 1: Classify complexity & compute dynamic token ceiling ────
    const complexity = classifyComplexity(detailsInput, taskType || '');
    const { score, maxOutputTokens, signals } = complexity;

    // ── Step 2: Build the system prompt ───────────────────────────────
    const systemPrompt = `You are an expert AI Prompt Engineer. Convert the user's task description into a ready-to-paste LLM prompt.

CORE RULE: Output a PROMPT the user will paste into ChatGPT/Gemini/Claude — NOT the solution itself.

LENGTH CALIBRATION:
Match prompt length to the complexity of the request. A simple task gets a concise 2–4 sentence prompt. A complex multi-part task gets a detailed multi-section prompt. Do not default to a medium length. Let the actual complexity determine the length. The shortest complete prompt that fully covers every constraint is the correct length.

ANTI-FILLER (MANDATORY):
- Do not restate the user's input back to them.
- No "In conclusion" wrappers or summary paragraphs.
- No transitional filler ("Let's dive in", "Here's what I need you to do").
- No over-explaining simple constraints.
- Every sentence must carry unique instructional value. If removing a sentence loses zero information, delete it.

TOKEN EFFICIENCY (MANDATORY):
- Use precise, information-dense phrasing: "Write a 300-word product description in professional tone" NOT "I would like you to please write a product description that is about 300 words long and uses a tone that comes across as professional."
- Structure as direct instructions (task → constraints → format), not narrative paragraphs.
- Do not restate the same constraint multiple ways.
- Only include context details that actually change the output — drop filler framing.

QUALITY RULES:
1. SPECIFICITY: Name concrete entities — no "such as X or Y" placeholders.
2. DATA GROUNDING: Demand specific sources/dates, or instruct "use illustrative figures and flag them as such."
3. LENGTH TARGET: Include a quantifiable length target in the generated prompt.
4. AUDIENCE: Define one primary audience.
5. STYLE REFERENCE: Translate tone into a concrete publication/style reference (e.g. "in the style of a Bloomberg Opinion column") instead of vague adjectives.
6. DISCLAIMER: For business/finance tasks, instruct inclusion of an illustrative/hypothetical disclaimer.

FEW-SHOT EXAMPLES:

Example 1 — SIMPLE input, SHORT output:
Input: "Tweet about a coffee sale"
Output: "Write a 280-character tweet announcing a 20% off coffee sale at [Store Name] this weekend, targeting urban commuters aged 25–35. Casual, punchy tone — one emoji max. End with a CTA linking to [URL]."

Example 2 — COMPLEX input, LONG output:
Input: "Competitive analysis of Tesla vs BYD covering financials, technology, market strategy, and regulatory risks"
Output: "Write a structured competitive analysis comparing Tesla, Inc. and BYD Company Ltd., formatted as a professional equity research note in the style of Morgan Stanley's sector coverage reports.

Target audience: institutional portfolio managers with strong EV sector familiarity.
Length: 1200–1500 words across four clearly labeled sections.
Data baseline: FY2024 financials. Use approximate/illustrative figures and flag them as such.

Sections:
1. Financial Performance — compare revenue, gross margins, EBITDA, and unit economics per vehicle delivered.
2. Technology & Product Pipeline — battery chemistry roadmaps (LFP vs NMC vs solid-state), autonomous driving stack maturity, manufacturing innovation (gigacasting, cell-to-pack).
3. Market Strategy — geographic expansion priorities, pricing strategy across segments, brand positioning in China vs Europe vs North America.
4. Regulatory & Geopolitical Risk — US IRA subsidy eligibility, EU Carbon Border Adjustment Mechanism impact, China export tariff exposure, supply chain concentration risk.

Close with a 2-sentence forward-looking thesis on which company is better positioned for 2025–2027 market share gains and why.

Include a disclaimer stating this is an illustrative analysis for educational purposes, not investment advice."

CONTEXT FOR THIS REQUEST:
- Task Type: ${taskType || 'General text generation'}
- Tone: ${tone || 'Professional'} → translate to a concrete style reference
- Format: ${outputFormat || 'Paragraphs'}
- Variables as placeholders: ${variables && variables.length > 0 ? variables.join(', ') : 'None'}

Output ONLY the generated prompt. No preamble, no meta-commentary, no labels like "Task:" or "Output:", no bullet points wrapping the prompt, no markdown formatting. Begin your very first word with the actual prompt instruction text.`;

    // ── Step 3: Call Gemini with dynamic ceiling & retry logic ─────────
    let generatedBody = '';
    let aiSuccess = false;
    let attempt = 0;
    const maxRetries = 2;

    while (attempt <= maxRetries && !aiSuccess) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: detailsInput,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
            maxOutputTokens: maxOutputTokens,
          }
        });
        generatedBody = response.text?.trim() || '';
        if (generatedBody) {
          aiSuccess = true;
        } else {
          throw new Error('AI returned empty response');
        }
      } catch (error: any) {
        attempt++;
        const errorMessage = error.message || '';
        const isRateLimit = error.status === 429 || errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED');
        
        if (isRateLimit && attempt <= maxRetries) {
          console.warn(`[AI-GEN] Rate limit hit (attempt ${attempt}). Retrying in 2 seconds...`);
          await new Promise(res => setTimeout(res, 2000));
        } else {
          console.error(`[AI-GEN] Failed after ${attempt} attempts. Falling back to deterministic template. Error:`, errorMessage);
          break; // Give up on AI, proceed to fallback
        }
      }
    }

    // ── Step 4: Deterministic Fallback ───────────────────────────────
    if (!aiSuccess) {
      // Deterministic template from original spec, used only when AI fails
      generatedBody = `Write a ${taskType ? taskType.toLowerCase() : 'piece of text'} based on the following instructions:
${detailsInput}

Key Requirements:
- Target Tone: ${tone || 'Professional'}
- Format: ${outputFormat || 'Paragraphs'}${variables && variables.length > 0 ? `\n- Variables to include: ${variables.join(', ')}` : ''}

Make sure to follow the tone and format constraints strictly.`;
      
      console.log(`[AI-GEN-FALLBACK] Served deterministic template due to AI failure.`);
    } else {
      // ── Step 5: Production logging (point 10) ────────────────────────
      const actualWords = generatedBody.split(/\s+/).filter(Boolean).length;
      console.log(
        `[AI-GEN] complexity=${score.toFixed(2)} maxTokens=${maxOutputTokens} actualWords=${actualWords} taskType="${taskType || 'General'}" signals=${JSON.stringify(signals)}`
      );
    }

    // Always succeed — either with AI or fallback
    res.status(200).json({ generatedBody });
  } catch (error: any) {
    // This top-level catch only fires if something outside the AI call crashes
    console.error('Unexpected Controller Error:', error);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
  }
};


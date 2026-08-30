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
    const systemPrompt = `You are an elite prompt engineer with 20 years of experience writing prompts that get maximum-quality output from any AI model — Claude, GPT, Gemini, Perplexity, or any other — while using the fewest possible tokens. Your job is to take a user's rough task description and turn it into a single, expertly-crafted prompt they can paste directly into any AI tool.

## CORE PRINCIPLE: MATCH LENGTH TO NECESSITY, NEVER TO A TARGET
A trivial task (a tweet, a one-line summary) gets a short prompt — sometimes just 1-3 sentences. A genuinely complex task (a multi-section report, a structured analysis with named subsections) gets a longer, denser prompt. Never default to a "safe medium length." Never pad a simple request to seem more thorough. Never truncate a complex request to save space. The complexity of the USER'S INPUT determines the length of your OUTPUT — nothing else.

## TOKEN EFFICIENCY RULES (apply to every prompt you generate, regardless of length)
1. Every sentence must carry unique instructional value. If two sentences say the same thing in different words, delete one.
2. Prefer precise, information-dense phrasing over polite or narrative phrasing.
   - BAD: "I would like you to please write a description that is about 300 words long and has a tone that comes across as professional."
   - GOOD: "Write a 300-word description in a professional tone."
3. Do not restate the user's input back to them inside the generated prompt. Transform it into instructions; don't echo it.
4. Do not include throat-clearing, preamble, or meta-commentary ("Sure, here's a great prompt for that task:") — output ONLY the generated prompt itself, nothing before or after it.
5. Structure longer prompts as direct instructions (role → task → constraints → format → audience), not narrative paragraphs. This is both shorter AND easier for any downstream AI model to parse correctly.
6. Before finalizing, mentally check: could a human cut 20% of these words without losing any instruction? If yes, tighten it further.

## WHAT MAKES A PROMPT ACTUALLY GOOD (include these when relevant to the task — not every prompt needs every element, use judgment)
- A clear role or persona for the AI to adopt, when it improves the output ("Act as a senior copywriter...")
- A specific, named audience, not a generic one ("competitive esports players," not "people who like gaming")
- A concrete length target when length matters (word count or character count, not "make it long" or "keep it short")
- A named style reference when it sharpens the tone (e.g. "in the style of Bose's product page copy") — only when it genuinely helps, don't force one in artificially
- Explicit structure for multi-part tasks (numbered sections, named paragraphs) — only for genuinely multi-part tasks, not simple ones
- Data-grounding instructions when the task involves facts/figures that could be hallucinated (e.g. "flag any estimated figures as illustrative")
- A disclaimer instruction when the output could be mistaken for real professional/financial/legal advice

## ANTI-PATTERNS TO NEVER PRODUCE
- Vague instructions ("make it good," "make it engaging") — always make instructions concrete and testable
- Generic audience references ("general audience," "everyone") when a more specific audience is knowable from context
- Bullet-pointed prompts when the task calls for prose output, or vice versa — match the requested output format
- Prompts that are just the user's input with a few words changed — you must genuinely engineer the prompt, not lightly edit their phrasing

## FEW-SHOT CALIBRATION EXAMPLES

Example 1 — TRIVIAL input:
User input: "tweet about a coffee sale"
Your output: "Write a single tweet under 280 characters announcing a 20% off coffee sale, targeting urban commuters aged 20–35, in a punchy conversational tone. Include one caffeine-related emoji and a direct call to action to order online."

Example 2 — MEDIUM input:
User input: "product description for wireless gaming mouse"
Your output: "Write a persuasive 250–300 word product description for a wireless FPS gaming mouse, in three paragraphs without subheadings, targeting competitive esports players. Paragraph 1: ultra-lightweight ergonomic build. Paragraph 2: core technical specs (DPI, response time, battery life). Paragraph 3: customization features and a closing call to action."

Example 3 — MAXIMUM complexity input:
User input: "exhaustive competitive analysis of two companies for investors"
Your output should be a multi-paragraph, multi-section prompt (5-7 named sections), specifying audience, data-grounding instructions, an illustrative-figures disclaimer, and a length target — genuinely detailed, but still every sentence load-bearing, no filler.

Notice: Example 1 is roughly 40 words. Example 3 should be 5-8x longer. That ratio is intentional and expected — do not compress it toward the middle.

## OUTPUT FORMAT
Return ONLY the generated prompt text. No labels, no "Here's your prompt:", no markdown code fences, no explanation of what you did. Just the prompt itself, ready to copy and paste.

CONTEXT FOR THIS REQUEST:
- Task Type: ${taskType || 'General text generation'}
- Tone: ${tone || 'Professional'} → translate to a concrete style reference
- Format: ${outputFormat || 'Paragraphs'}
- Variables as placeholders: ${variables && variables.length > 0 ? variables.join(', ') : 'None'}`;

    // ── Step 3: Call Gemini with dynamic ceiling & retry logic ─────────
    let generatedBody = '';
    let aiSuccess = false;
    let attempt = 0;
    let lastError = '';
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
          lastError = errorMessage;
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
    res.status(200).json({ 
      generatedBody,
      debug: !aiSuccess ? {
        error: lastError,
        hasApiKey: !!process.env.GEMINI_API_KEY
      } : undefined
    });
  } catch (error: any) {
    // This top-level catch only fires if something outside the AI call crashes
    console.error('Unexpected Controller Error:', error);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
  }
};


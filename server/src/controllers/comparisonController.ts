import { Response } from 'express';
import Comparison from '../models/Comparison';
import { AuthRequest } from '../middleware/auth';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const calculateWinner = (scoreA?: number, scoreB?: number) => {
  if (scoreA === undefined && scoreB === undefined) return 'none';
  if (scoreA !== undefined && scoreB === undefined) return 'a';
  if (scoreA === undefined && scoreB !== undefined) return 'b';
  
  if (scoreA! > scoreB!) return 'a';
  if (scoreB! > scoreA!) return 'b';
  return 'tie';
};

export const getComparisons = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const comparisons = await Comparison.find({ userId: req.user?.id })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.status(200).json(comparisons);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createComparison = async (req: AuthRequest, res: Response) => {
  try {
    const compData = req.body;
    compData.userId = req.user?.id;
    compData.winner = calculateWinner(compData.promptAScore, compData.promptBScore);

    const comparison = await Comparison.create(compData);
    res.status(201).json(comparison);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error creating comparison' });
  }
};

export const updateComparison = async (req: AuthRequest, res: Response) => {
  try {
    const compData = req.body;
    compData.winner = calculateWinner(compData.promptAScore, compData.promptBScore);

    const comparison = await Comparison.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.id },
      compData,
      { new: true }
    );
    if (!comparison) return res.status(404).json({ message: 'Comparison not found' });
    
    res.status(200).json(comparison);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Error updating comparison' });
  }
};

export const evaluateWithAI = async (req: AuthRequest, res: Response) => {
  try {
    const { baseTaskDescription, promptABody, promptBBody } = req.body;

    if (!baseTaskDescription || !promptABody || !promptBBody) {
      return res.status(400).json({ message: 'Missing fields for evaluation' });
    }

    const systemPrompt = `You are an expert AI Prompt Evaluator. Your job is to evaluate two different prompts (Prompt A and Prompt B) against a Base Task Description.
You must score each prompt from 0 to 100 based on how effectively it would instruct an LLM to achieve the Base Task.
Criteria for scoring:
- Specificity and detail
- Clear constraints and format instructions
- Style and tone guidance
- Absence of ambiguity

Return a JSON object containing:
- scoreA: Number (0-100)
- scoreB: Number (0-100)
- reasoning: A short, 1-2 sentence explanation of why you scored them this way.`;

    const userPrompt = `Base Task Description: ${baseTaskDescription}

--- PROMPT A ---
${promptABody}

--- PROMPT B ---
${promptBBody}

Evaluate both prompts and return the scores.`;

    let result: any = null;
    let aiSuccess = false;
    let attempt = 0;
    const maxRetries = 2;

    while (attempt <= maxRetries && !aiSuccess) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                scoreA: { type: Type.INTEGER },
                scoreB: { type: Type.INTEGER },
                reasoning: { type: Type.STRING }
              },
              required: ["scoreA", "scoreB", "reasoning"]
            }
          }
        });

        result = JSON.parse(response.text || '{}');
        if (result && result.scoreA !== undefined && result.scoreB !== undefined) {
          aiSuccess = true;
        } else {
          throw new Error('AI returned invalid JSON');
        }
      } catch (error: any) {
        attempt++;
        const errorMessage = error.message || '';
        const isRateLimit = error.status === 429 || errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED');
        
        if (isRateLimit && attempt <= maxRetries) {
          console.warn(`[AI-COMPARE] Rate limit hit (attempt ${attempt}). Retrying in 2 seconds...`);
          await new Promise(res => setTimeout(res, 2000));
        } else {
          console.error(`[AI-COMPARE] Failed after ${attempt} attempts. Falling back to default scores. Error:`, errorMessage);
          break;
        }
      }
    }

    if (!aiSuccess) {
      // Deterministic fallback if AI goes down or we completely run out of quota
      result = {
        scoreA: 50,
        scoreB: 50,
        reasoning: 'AI evaluation unavailable due to API limits. Defaulting to a tie.'
      };
      console.log(`[AI-COMPARE-FALLBACK] Served default evaluation due to AI failure.`);
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Unexpected Compare Controller Error:', error);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
  }
};

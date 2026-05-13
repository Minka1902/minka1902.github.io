import { GoogleGenerativeAI } from '@google/generative-ai';
import type { TrainingSession } from '@/types';

const SYSTEM_PROMPT = `You are an expert K-9 unit trainer evaluating a training session for unit suitability.
Score 1-100 based on: engagement shown, focus/attention, exercise completion, handler-dog teamwork, environmental adaptation.
Be fair, objective, and accurate — for the dog's benefit.
Return ONLY valid JSON with exactly two keys: {"score": number, "analysis": "1-2 sentences"}`;

export interface AIScoreResult {
  score: number;
  analysis: string;
}

export async function scoreTrainingSession(session: TrainingSession): Promise<AIScoreResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const payload = {
    trainingType: session.trainingType,
    objective: session.objective,
    durationActualMin: session.durationActualMin,
    location: session.location,
    notes: session.notes,
    result: session.result,
    typeSpecificData: session.typeSpecificData,
    exercises: session.exercises,
  };

  const result = await model.generateContent(SYSTEM_PROMPT + '\n\nSession data:\n' + JSON.stringify(payload, null, 2));
  const text = result.response.text().trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI returned non-JSON response');

  const parsed = JSON.parse(jsonMatch[0]) as { score: unknown; analysis: unknown };
  const score = typeof parsed.score === 'number' ? Math.max(1, Math.min(100, Math.round(parsed.score))) : 50;
  const analysis = typeof parsed.analysis === 'string' ? parsed.analysis : '';

  return { score, analysis };
}

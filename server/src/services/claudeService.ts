import Anthropic from '@anthropic-ai/sdk';
import type { RecommendationResponse } from '../types';
import type { MuscleVolumeSummary } from './workoutService';
import type { WorkoutDetail } from '../types';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert strength and conditioning coach. Your job is to analyze a user's recent workout history and recommend which muscle groups to prioritize and which exercises to perform next.

Guidelines:
- Identify undertrained muscle groups relative to overtrained ones based on set volume.
- Respect recovery: a muscle trained heavily in the last 48–72 hours should generally NOT be the top priority.
- For "Strength" goals: prioritize compound movements, rep ranges of 3–6 for primary lifts.
- For "Muscle Balance" goals: actively flag and target neglected muscle groups.
- Suggest 4–7 exercises total.
- Keep rationale strings concise (1–2 sentences each).

CRITICAL: Respond ONLY with a valid JSON object matching the exact schema provided. No markdown, no explanation, no extra text outside the JSON.`;

export async function getRecommendation(
  goals: string[],
  lookbackDays: number,
  muscleVolume: MuscleVolumeSummary[],
  recentWorkouts: WorkoutDetail[],
  exerciseLibrary: { id: number; name: string; primary_muscle: string }[],
): Promise<RecommendationResponse> {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - lookbackDays);

  const muscleVolumeTable = muscleVolume
    .map(
      (m) =>
        `  ${m.muscle_group_name} (${m.parent_name ?? 'top-level'}): ${m.total_sets} sets, last trained: ${m.last_trained_date ?? 'never'}`,
    )
    .join('\n');

  const workoutHistory = recentWorkouts.map((w) => ({
    date: w.logged_at,
    exercises: w.exercises.map((e) => ({
      name: e.exercise_name,
      muscles: e.muscles.map((m) => `${m.muscle_group_name} (${m.role})`),
      sets: e.sets.map((s) => ({
        reps: s.reps,
        weight_lb: s.weight_lb,
        rpe: s.rpe,
      })),
    })),
  }));

  const exerciseLibrarySummary = exerciseLibrary.map((e) => ({
    id: e.id,
    name: e.name,
    primary_muscle: e.primary_muscle,
  }));

  const userMessage = `## User Goals
${goals.join(', ')}

## Lookback Window
${lookbackDays} days (from ${fromDate.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]})

## Muscle Group Volume Summary (sets in lookback window)
${muscleVolumeTable || '  No workout data found.'}

## Recent Workout History (last ${recentWorkouts.length} workouts)
${JSON.stringify(workoutHistory, null, 2)}

## Available Exercise Library
${JSON.stringify(exerciseLibrarySummary, null, 2)}

## Required Response Schema
{
  "target_muscle_groups": [
    { "muscle_group_name": string, "priority": "high" | "medium" | "low", "reason": string }
  ],
  "suggested_exercises": [
    {
      "exercise_id": number | null,
      "exercise_name": string,
      "sets": number,
      "rep_range": string,
      "rationale": string
    }
  ],
  "overall_reasoning": string
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    temperature: 0.4,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `## Exercise Library (cached)\n${JSON.stringify(exerciseLibrarySummary, null, 2)}`,
            cache_control: { type: 'ephemeral' },
          },
          {
            type: 'text',
            text: userMessage,
          },
        ],
      },
    ],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('');

  let parsed: Omit<RecommendationResponse, 'generated_at'>;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Failed to parse AI response: ${text.slice(0, 200)}`);
  }

  return { ...parsed, generated_at: new Date().toISOString() };
}

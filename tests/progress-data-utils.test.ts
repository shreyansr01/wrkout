import { describe, it, expect } from 'vitest';
import { calculateWorkoutVolume, buildExerciseVolumeTrendMap } from '@/lib/progress-data-utils';
import type { WorkoutLog } from '@/lib/types';

describe('calculateWorkoutVolume', () => {
  it('calculates standard weighted exercise volume correctly', () => {
    // 100kg x 10 reps x 3 sets = 3000
    expect(calculateWorkoutVolume(100, 10, 3, 'Bench Press')).toBe(3000);
  });

  it('calculates bodyweight exercise with 0 external weight as reps * sets', () => {
    // 0kg x 12 reps x 4 sets = 48
    expect(calculateWorkoutVolume(0, 12, 4, 'Pull Up')).toBe(48);
  });

  it('calculates weighted bodyweight exercise using full formula', () => {
    // 20kg added x 8 reps x 3 sets = 480
    expect(calculateWorkoutVolume(20, 8, 3, 'Weighted Dip')).toBe(480);
  });

  it('handles negative or invalid numbers defensively', () => {
    expect(calculateWorkoutVolume(-50, 10, 3)).toBe(0);
    expect(calculateWorkoutVolume(NaN, 10, 3)).toBe(0);
    expect(calculateWorkoutVolume(100, -5, 3)).toBe(0);
  });
});

describe('buildExerciseVolumeTrendMap', () => {
  it('identifies new exercises without prior history', () => {
    const today = '2026-11-10';
    const logs: WorkoutLog[] = [
      {
        id: '1',
        user_id: 'u1',
        workout_id: 'w1',
        workout_day_id: 'd1',
        exercise_id: 'ex1',
        exercise_name: 'Overhead Press',
        weight: 50,
        avg_reps: 8,
        sets: 3,
        performed_at: today,
        created_at: today,
        updated_at: today,
      },
    ];

    const trendMap = buildExerciseVolumeTrendMap(logs, today);
    const trend = trendMap.get('ex1');

    expect(trend).toBeDefined();
    expect(trend?.trend).toBe('new');
    expect(trend?.todayVolume).toBe(1200);
    expect(trend?.previousVolume).toBeNull();
  });

  it('detects volume increases compared to previous sessions', () => {
    const today = '2026-11-10';
    const prevDate = '2026-11-03';
    const logs: WorkoutLog[] = [
      {
        id: '1',
        user_id: 'u1',
        workout_id: 'w1',
        workout_day_id: 'd1',
        exercise_id: 'ex1',
        exercise_name: 'Squat',
        weight: 100,
        avg_reps: 5,
        sets: 5,
        performed_at: prevDate,
        created_at: prevDate,
        updated_at: prevDate,
      },
      {
        id: '2',
        user_id: 'u1',
        workout_id: 'w1',
        workout_day_id: 'd1',
        exercise_id: 'ex1',
        exercise_name: 'Squat',
        weight: 105,
        avg_reps: 5,
        sets: 5,
        performed_at: today,
        created_at: today,
        updated_at: today,
      },
    ];

    const trendMap = buildExerciseVolumeTrendMap(logs, today);
    const trend = trendMap.get('ex1');

    expect(trend?.trend).toBe('up');
    expect(trend?.todayVolume).toBe(2625);
    expect(trend?.previousVolume).toBe(2500);
  });
});

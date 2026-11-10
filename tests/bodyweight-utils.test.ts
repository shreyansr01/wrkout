import { describe, it, expect } from 'vitest';
import { isBodyweightExerciseName } from '@/lib/bodyweight-utils';

describe('isBodyweightExerciseName', () => {
  it('correctly matches standard bodyweight exercises', () => {
    expect(isBodyweightExerciseName('Pull-Up')).toBe(true);
    expect(isBodyweightExerciseName('Pushups')).toBe(true);
    expect(isBodyweightExerciseName('Dips')).toBe(true);
    expect(isBodyweightExerciseName('Hanging Leg Raise')).toBe(true);
    expect(isBodyweightExerciseName('Plank')).toBe(true);
  });

  it('rejects barbell or free weight exercises without bodyweight keywords', () => {
    expect(isBodyweightExerciseName('Barbell Bench Press')).toBe(false);
    expect(isBodyweightExerciseName('Bicep Curl')).toBe(false);
    expect(isBodyweightExerciseName('Lateral Raise')).toBe(false);
    expect(isBodyweightExerciseName('Lat Pulldown')).toBe(false);
  });

  it('handles empty or whitespace strings safely', () => {
    expect(isBodyweightExerciseName('')).toBe(false);
    expect(isBodyweightExerciseName('   ')).toBe(false);
  });
});

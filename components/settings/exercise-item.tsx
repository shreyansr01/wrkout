"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkoutExercise } from "@/lib/types";

export interface ExerciseItemProps {
  exercise: WorkoutExercise;
  index: number;
  totalExercises: number;
  dayId: string;
  workoutId: string;
  onMoveUp: (dayId: string, index: number) => void;
  onMoveDown: (dayId: string, index: number) => void;
  onDelete: (workoutId: string, dayId: string, exerciseId: string, exerciseName: string) => void;
  isEditMode: boolean;
}

export const ExerciseItem = memo(function ExerciseItem({
  exercise,
  index,
  totalExercises,
  dayId,
  workoutId,
  onMoveUp,
  onMoveDown,
  onDelete,
  isEditMode,
}: ExerciseItemProps) {
  return (
    <li
      className={cn(
        "flex items-center justify-between py-2 px-2.5 rounded-lg transition-colors",
        isEditMode ? "bg-zinc-900/60" : "hover:bg-zinc-800/30"
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {isEditMode ? (
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onMoveUp(dayId, index)}
              disabled={index === 0}
              className="h-6 w-6 p-0 rounded-md transition-all text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-20"
              aria-label={`Move ${exercise.name} up`}
            >
              <ArrowUp className="h-3 w-3" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onMoveDown(dayId, index)}
              disabled={index === totalExercises - 1}
              className="h-6 w-6 p-0 rounded-md transition-all text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-20"
              aria-label={`Move ${exercise.name} down`}
            >
              <ArrowDown className="h-3 w-3" aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <div className="h-1.5 w-1.5 rounded-full bg-zinc-600 flex-shrink-0 ml-1" />
        )}
        <span className="text-xs font-medium text-zinc-200 truncate py-0.5" title={exercise.name}>
          {exercise.name}
        </span>
      </div>
      {isEditMode && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(workoutId, dayId, exercise.id, exercise.name)}
          className="h-6 w-6 p-0 rounded-md transition-all text-zinc-400 hover:bg-red-950/40 hover:text-red-400 border border-transparent hover:border-red-900/40"
          aria-label={`Delete ${exercise.name} exercise`}
        >
          <Trash2 className="h-3 w-3" aria-hidden="true" />
        </Button>
      )}
    </li>
  );
});

ExerciseItem.displayName = "ExerciseItem";

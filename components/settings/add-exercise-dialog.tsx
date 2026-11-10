"use client";

import { useRef } from "react";
import { Dumbbell } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AddExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
  onExerciseNameChange: (name: string) => void;
  filteredExercises: Array<{ id?: string; name: string }>;
  highlightedIndex: number;
  setHighlightedIndex: React.Dispatch<React.SetStateAction<number>>;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  onAddExercise: () => void;
  isCreatingExercise: boolean;
  selectedWorkoutId: string | null;
  selectedDayId: string | null;
}

export function AddExerciseDialog({
  open,
  onOpenChange,
  exerciseName,
  onExerciseNameChange,
  filteredExercises,
  highlightedIndex,
  setHighlightedIndex,
  showSuggestions,
  setShowSuggestions,
  onAddExercise,
  isCreatingExercise,
  selectedWorkoutId,
  selectedDayId,
}: AddExerciseDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        centerMobile
        className="w-[90%] max-w-[320px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/95 p-6 shadow-[0_24px_64px_rgba(0,0,0,0.85)] backdrop-blur-2xl outline-none select-none mx-auto flex flex-col items-center"
      >
        <DialogHeader className="w-full flex flex-col items-center space-y-0 text-center">
          <div className="mx-auto mb-3.5 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-300 shadow-sm">
            <Dumbbell className="h-5 w-5" strokeWidth={2} />
          </div>
          <DialogTitle className="text-base font-bold tracking-tight text-white text-center w-full">
            New Exercise
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 text-center w-full mt-1">
            Search or enter a custom exercise name.
          </DialogDescription>
        </DialogHeader>

        <div className="w-full my-4 relative">
          <Label htmlFor="exercise-name" className="sr-only">
            Exercise Name
          </Label>
          <div className="w-full">
            <Input
              id="exercise-name"
              ref={inputRef}
              aria-label="Exercise name"
              value={exerciseName}
              onChange={(e) => {
                onExerciseNameChange(e.target.value);
                setShowSuggestions(true);
                setHighlightedIndex(-1);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlightedIndex((prev) => Math.min(prev + 1, filteredExercises.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlightedIndex((prev) => Math.max(prev - 1, -1));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (highlightedIndex >= 0 && highlightedIndex < filteredExercises.length) {
                    onExerciseNameChange(filteredExercises[highlightedIndex].name);
                    setShowSuggestions(false);
                  } else if (exerciseName.trim()) {
                    onAddExercise();
                  }
                } else if (e.key === "Escape") {
                  setShowSuggestions(false);
                }
              }}
              placeholder="e.g. Incline Bench Press"
              className="h-10 rounded-xl border-zinc-800 bg-zinc-900/60 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700/50 w-full transition-colors"
              autoComplete="off"
              autoFocus
            />
            <AnimatePresence>
              {showSuggestions && exerciseName.trim().length > 0 && filteredExercises.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden mt-2"
                >
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/95 p-1 max-h-[130px] overflow-y-auto hide-scrollbar space-y-0.5 shadow-xl">
                    {filteredExercises.map((ex, idx) => (
                      <button
                        key={ex.id || ex.name}
                        type="button"
                        className={cn(
                          "w-full px-3 py-1.5 rounded-lg text-left text-xs font-medium transition-colors cursor-pointer",
                          idx === highlightedIndex
                            ? "bg-zinc-800 text-white font-semibold"
                            : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
                        )}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          onExerciseNameChange(ex.name);
                          setShowSuggestions(false);
                        }}
                        onClick={() => {
                          onExerciseNameChange(ex.name);
                          setShowSuggestions(false);
                          inputRef.current?.focus();
                        }}
                      >
                        <span className="truncate">{ex.name}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-row justify-between gap-2.5 w-full">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-10 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-all active:scale-[0.98] shadow-none cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onAddExercise}
            disabled={!exerciseName.trim() || !selectedWorkoutId || !selectedDayId || isCreatingExercise}
            className="flex-1 h-10 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold px-3 text-xs transition-all active:scale-[0.98] disabled:opacity-25 disabled:pointer-events-none shadow-sm cursor-pointer border-none"
          >
            {isCreatingExercise ? "Adding..." : "Add"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

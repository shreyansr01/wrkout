"use client";

import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface AddWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutName: string;
  onWorkoutNameChange: (name: string) => void;
  onAddWorkout: () => void;
}

export function AddWorkoutDialog({
  open,
  onOpenChange,
  workoutName,
  onWorkoutNameChange,
  onAddWorkout,
}: AddWorkoutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        centerMobile
        className="w-[90%] max-w-[320px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/95 p-6 shadow-[0_24px_64px_rgba(0,0,0,0.85)] backdrop-blur-2xl outline-none select-none mx-auto flex flex-col items-center"
      >
        <DialogHeader className="w-full flex flex-col items-center space-y-0 text-center">
          <div className="mx-auto mb-3.5 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-300 shadow-sm">
            <Plus className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <DialogTitle className="text-base font-bold tracking-tight text-white text-center w-full">
            New Routine
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 text-center w-full mt-1">
            Name your routine to get started.
          </DialogDescription>
        </DialogHeader>

        <div className="w-full my-4">
          <Label htmlFor="workout-name" className="sr-only">
            Routine Name
          </Label>
          <Input
            id="workout-name"
            aria-label="Routine name"
            value={workoutName}
            onChange={(e) => onWorkoutNameChange(e.target.value)}
            placeholder="e.g. Summer Cut, Bulking..."
            className="h-10 rounded-xl border-zinc-800 bg-zinc-900/60 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700/50 w-full transition-colors"
            autoFocus
          />
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
            onClick={onAddWorkout}
            disabled={!workoutName.trim()}
            className="flex-1 h-10 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold px-3 text-xs transition-all active:scale-[0.98] disabled:opacity-25 disabled:pointer-events-none shadow-sm cursor-pointer border-none"
          >
            Create
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  PlusCircle,
  Trash2,
  Plus,
  Dumbbell,
  Calendar,
  ArrowUp,
  ArrowDown,
  Footprints,
  Sparkles,
  GripVertical,
  Settings,
  AlertCircle,
  ChevronDown,
} from "lucide-react"

const DEFAULT_EXERCISE_SUGGESTIONS = [
  "Incline Dumbbell Press", "Bench Press", "Shoulder Press", "Triceps Pushdown",
  "Lat Pulldown", "Barbell Row", "Bicep Curl", "Squat", "Romanian Deadlift",
  "Calf Raise", "Leg Press", "Leg Curl", "Hammer Curl", "Chest Fly", "Overhead Extension",
  "Core Plank", "Jumping Jacks", "Kettlebell Swings", "Russian Twists", "Burpees",
  "Lateral Raise", "Face Pull"
]
import { useToast } from "@/hooks/use-toast"
import { formatDate, cn } from "@/lib/utils"
import { v4 as uuidv4 } from 'uuid'
import type { Workout, WorkoutDay, WorkoutExercise } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from '@/lib/auth/auth-context'
import { useHaptics } from "@/hooks/use-haptics"
import { DeletionConfirmationModal } from "@/components/modals/deletion-confirmation-modal"
import { ResetConfirmationModal } from "@/components/modals/reset-confirmation-modal" // Re-trigger import check
import { updateWorkoutDayExercises, loadUserWorkoutDays, createDefaultRoutinesForWorkout } from '@/lib/supabase-data'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import dynamic from 'next/dynamic'
import { ShowcaseFooter } from "@/components/dashboard/showcase-footer"
import { ExerciseItem, AddWorkoutDialog, AddExerciseDialog, AccountSettingsCard } from "@/components/settings"

const OnboardingGuide = dynamic(() => import("@/components/onboarding/onboarding-guide").then(mod => mod.OnboardingGuide), {
  loading: () => null,
  ssr: false
})

interface SettingsScreenProps {
  workouts: Workout[]
  workoutDays: WorkoutDay[]
  onUpdateWorkoutsAndDays: (workouts: Workout[], workoutDays: WorkoutDay[]) => void
}

export function SettingsScreen({ workouts, workoutDays, onUpdateWorkoutsAndDays }: SettingsScreenProps) {
  const [isAddWorkoutOpen, setIsAddWorkoutOpen] = useState(false)
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false)
  const [newWorkoutName, setNewWorkoutName] = useState("")
  const [newExerciseName, setNewExerciseName] = useState("")
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [expandedWorkouts, setExpandedWorkouts] = useState<Record<string, boolean>>({})
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({})
  const [showOnboarding, setShowOnboarding] = useState(false)
  const { toast } = useToast()
  const { signOut, user, username } = useAuth()
  const { trigger: haptic } = useHaptics()
  const [isSignOutOpen, setIsSignOutOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isAccountExpanded, setIsAccountExpanded] = useState(false)
  const supabase = createClientComponentClient();

  const [recoveryEmailState, setRecoveryEmailState] = useState(user?.user_metadata?.recovery_email || '');
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (user?.user_metadata?.recovery_email) {
      setRecoveryEmailState(user.user_metadata.recovery_email);
    }
  }, [user]);

  const toggleWorkoutExpanded = (workoutId: string) => {
    haptic("light")
    setExpandedWorkouts((prev) => {
      const isCurrentlyExpanded = !!prev[workoutId]
      const nextExpanded = !isCurrentlyExpanded

      if (!nextExpanded) {
        // Reset nested day accordions after exit animation finishes so closing is smooth
        setTimeout(() => {
          setExpandedDays((prevDays) => {
            const newDays = { ...prevDays }
            let changed = false
            Object.keys(newDays).forEach((key) => {
              if (key.startsWith(`${workoutId}-`)) {
                delete newDays[key]
                changed = true
              }
            })
            return changed ? newDays : prevDays
          })
        }, 300)
      } else {
        // Guarantee that upon opening, all nested days start in default closed state
        setExpandedDays((prevDays) => {
          const newDays = { ...prevDays }
          let changed = false
          Object.keys(newDays).forEach((key) => {
            if (key.startsWith(`${workoutId}-`)) {
              delete newDays[key]
              changed = true
            }
          })
          return changed ? newDays : prevDays
        })
      }

      return {
        ...prev,
        [workoutId]: nextExpanded,
      }
    })
  }

  const toggleDayExpanded = (dayKey: string) => {
    haptic("light")
    setExpandedDays((prev) => ({
      ...prev,
      [dayKey]: !prev[dayKey],
    }))
  }

  const handleUpdateRecoveryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMessage('');
    setEmailError('');
    setUpdatingEmail(true);

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!recoveryEmailState) {
        setEmailError('Recovery email is required.');
        setUpdatingEmail(false);
        return;
      }
      if (!emailRegex.test(recoveryEmailState)) {
        setEmailError('Please enter a valid email address.');
        setUpdatingEmail(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          recovery_email: recoveryEmailState.trim().toLowerCase()
        }
      });

      if (error) {
        setEmailError(error.message);
      } else {
        setEmailMessage('Recovery email updated successfully.');
      }
    } catch (err) {
      setEmailError('Failed to update recovery email.');
    } finally {
      setUpdatingEmail(false);
    }
  };

  // Add a new state to track a pending exercise open request
  const [pendingExerciseOpen, setPendingExerciseOpen] = useState<{ workoutId: string, dayId: string } | null>(null)
  const [isDeleteAllWorkoutsOpen, setIsDeleteAllWorkoutsOpen] = useState(false);
  const [pendingDeleteWorkoutId, setPendingDeleteWorkoutId] = useState<string | null>(null);
  const [isDeleteWorkoutOpen, setIsDeleteWorkoutOpen] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<{ id: string, name: string } | null>(null);
  const [isDeleteExerciseOpen, setIsDeleteExerciseOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<{ workoutId: string, dayId: string, id: string, name: string } | null>(null);

  // Autocomplete state
  const [availableExercises, setAvailableExercises] = useState<{ id: string, name: string }[]>([]);
  const [isCreatingExercise, setIsCreatingExercise] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const filteredExercises = useMemo(() => {
    if (!newExerciseName.trim()) return [];
    const query = newExerciseName.toLowerCase().trim();
    const combinedMap = new Map<string, { id?: string; name: string }>();
    DEFAULT_EXERCISE_SUGGESTIONS.forEach(name => {
      combinedMap.set(name.toLowerCase(), { name });
    });
    availableExercises.forEach(e => {
      combinedMap.set(e.name.toLowerCase(), { id: e.id, name: e.name });
    });
    return Array.from(combinedMap.values()).filter(e => 
      e.name.toLowerCase().includes(query)
    );
  }, [availableExercises, newExerciseName]);

  useEffect(() => {
    if (user) {
      import('@/lib/supabase-data').then(m => {
        m.loadUserExercises(supabase, user.id).then(setAvailableExercises);
      });
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!user) return;
    // Check if user has demo data
    // (Demo data check removed)
  }, [user]);

  // Removed: handleAddDemoData and handleRemoveDemoData

  // Reset scroll position when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!isAddExerciseOpen) {
      setSelectedWorkoutId(null)
      setSelectedDayId(null)
      setNewExerciseName("")
      setShowSuggestions(false)
      setHighlightedIndex(-1)
      setIsCreatingExercise(false)
    }
  }, [isAddExerciseOpen])

  // Add a useEffect to open the dialog only after IDs are set
  useEffect(() => {
    if (pendingExerciseOpen) {
      setSelectedWorkoutId(pendingExerciseOpen.workoutId)
      setSelectedDayId(pendingExerciseOpen.dayId)
      setIsAddExerciseOpen(true)
      setPendingExerciseOpen(null)
    }
  }, [pendingExerciseOpen])

  const handleAddWorkout = async () => {
    if (!newWorkoutName.trim() || !user) return

    const newWorkoutId = uuidv4()
    const newWorkout: Workout = {
      id: newWorkoutId,
      user_id: user.id,
      name: newWorkoutName,
      days: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      const defaultDays = await createDefaultRoutinesForWorkout(supabase, user.id, newWorkoutId)
      onUpdateWorkoutsAndDays([...workouts, newWorkout], [...workoutDays, ...defaultDays])
      setNewWorkoutName("")
      setIsAddWorkoutOpen(false)

      // Auto-expand the new workout
      setExpandedWorkouts((prev) => ({
        ...prev,
        [newWorkout.id]: true,
      }))

      toast({
        title: "Routine created",
        description: newWorkoutName,
      })
    } catch (error) {
      console.error("Failed to add workout with default days:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create workout.",
      })
    }
  }

  const handleDeleteWorkout = (workoutId: string, workoutName: string) => {
    if (workouts.length === 1) {
      setPendingDeleteWorkoutId(workoutId);
      setIsDeleteAllWorkoutsOpen(true);
      return;
    }
    setWorkoutToDelete({ id: workoutId, name: workoutName });
    setIsDeleteWorkoutOpen(true);
  }

  const confirmDeleteWorkout = async () => {
    if (!workoutToDelete || !user) return;

    onUpdateWorkoutsAndDays(
      workouts.filter((w) => w.id !== workoutToDelete.id),
      workoutDays.filter((d) => d.workout_id !== workoutToDelete.id)
    );

    toast({
      variant: "destructive",
      title: "Routine deleted",
      description: workoutToDelete.name,
    });
    setWorkoutToDelete(null);
    setIsDeleteWorkoutOpen(false);
  }

  // Custom day modification handlers removed since we pre-populate and restrict to default Push, Pull, and Legs routines

  const handleAddExercise = async () => {
    if (!newExerciseName.trim() || !selectedWorkoutId || !selectedDayId || !user) return;
    
    setIsCreatingExercise(true);
    
    try {
      const dayToUpdate = workoutDays.find(day => day.id === selectedDayId);
      if (!dayToUpdate) return;
      
      const { createExercise } = await import('@/lib/supabase-data');
      
      // Check if exact match exists in availableExercises
      const exactMatchName = newExerciseName.trim().toLowerCase();
      const existing = availableExercises.find(e => e.name.toLowerCase() === exactMatchName);
      
      let exercise_id = existing?.id;
      let finalExerciseName = existing ? existing.name : newExerciseName.trim();
      
      if (!exercise_id) {
         exercise_id = await createExercise(supabase, user.id, finalExerciseName) || undefined;
         if (exercise_id) {
            setAvailableExercises(prev => 
              [...prev, { id: exercise_id as string, name: finalExerciseName }]
              .sort((a, b) => a.name.localeCompare(b.name))
            );
         }
      }

      const updatedExercises = [
        ...(dayToUpdate.exercises || []),
        { id: uuidv4(), exercise_id, name: finalExerciseName }
      ];

      // Use map to update correct day in list
      const updatedWorkoutDays = workoutDays.map(day => {
        if (day.id === selectedDayId) {
          return {
            ...day,
            exercises: updatedExercises
          };
        }
        return day;
      });

      onUpdateWorkoutsAndDays(workouts, updatedWorkoutDays);
      setNewExerciseName("");
      setIsAddExerciseOpen(false);
      toast({
        title: "Exercise added",
        description: finalExerciseName,
      });
    } catch (err) {
      console.error("Failed to add exercise:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save exercise.",
      });
    } finally {
      setIsCreatingExercise(false);
    }
  }

  const handleDeleteExercise = async (workoutId: string, dayId: string, exerciseId: string, exerciseName: string) => {
    setExerciseToDelete({ workoutId, dayId, id: exerciseId, name: exerciseName });
    setIsDeleteExerciseOpen(true);
  }

  // Move exercise up in the list
  const moveExerciseUp = async (dayId: string, index: number) => {
    if (index === 0) return;

    // Find the workout day to update
    const dayIndex = workoutDays.findIndex(day => day.id === dayId);
    if (dayIndex === -1 || !user) return;

    const dayToUpdate = workoutDays[dayIndex];

    // Create a new array with the exercises reordered
    const exercises = [...dayToUpdate.exercises];
    [exercises[index], exercises[index - 1]] = [exercises[index - 1], exercises[index]];

    // Update local state directly
    const updatedWorkoutDays = [...workoutDays];
    updatedWorkoutDays[dayIndex] = {
      ...dayToUpdate,
      exercises
    };

    onUpdateWorkoutsAndDays(workouts, updatedWorkoutDays);

    toast({
      title: "Exercise reordered",
      description: "Moved up.",
    });
  };

  // Move exercise down in the list
  const moveExerciseDown = async (dayId: string, index: number) => {
    const dayIndex = workoutDays.findIndex(day => day.id === dayId);
    if (dayIndex === -1 || !user) return;

    const dayToUpdate = workoutDays[dayIndex];

    if (index === dayToUpdate.exercises.length - 1) return;

    // Create a new array with the exercises reordered
    const exercises = [...dayToUpdate.exercises];
    [exercises[index], exercises[index + 1]] = [exercises[index + 1], exercises[index]];

    // Update local state directly without reloading from database
    const updatedWorkoutDays = [...workoutDays];
    updatedWorkoutDays[dayIndex] = {
      ...dayToUpdate,
      exercises
    };

    onUpdateWorkoutsAndDays(workouts, updatedWorkoutDays);

    toast({
      title: "Exercise reordered",
      description: "Moved down.",
    });
  };

  const confirmDeleteExercise = async () => {
    if (!exerciseToDelete || !user) return;

    const updatedWorkoutDays = workoutDays.map(day => {
      if (day.id === exerciseToDelete.dayId) {
        const updatedExercises = (day.exercises || []).filter((exercise) => exercise.id !== exerciseToDelete.id);
        return {
          ...day,
          exercises: updatedExercises
        };
      }
      return day;
    });

    onUpdateWorkoutsAndDays(workouts, updatedWorkoutDays);
    toast({
      variant: "destructive",
      title: "Exercise deleted",
      description: exerciseToDelete.name,
    });
    setExerciseToDelete(null);
    setIsDeleteExerciseOpen(false);
  }

  // ExerciseItem moved outside component for performance



  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.02,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: [0.25, 1, 0.5, 1],
      },
    },
  }

  // Use username from context (case-sensitive)
  const displayUsername = username || (user?.email ? user.email.replace(/@wrkout\.app$/, '') : '');

  const handleSignOut = async () => {
    signOut();
  }

  return (
    <div className="w-full max-w-[410px] mx-auto pb-24 px-3 sm:px-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Unified Page Header */}
        <motion.div variants={itemVariants} className="flex flex-col mb-6 pt-2 sm:pt-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Settings
          </h1>
        </motion.div>

      <div className="space-y-6">
        {/* Workouts Section */}
        <motion.section variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-base font-extrabold text-zinc-100 tracking-tight">
              Routines
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsEditMode(!isEditMode)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                  isEditMode
                    ? "bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/50"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                )}
              >
                {isEditMode ? "Done" : "Edit"}
              </button>
              <button
                type="button"
                onClick={() => setIsAddWorkoutOpen(true)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors cursor-pointer flex items-center justify-center"
                aria-label="New Routine"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {workouts.length > 0 ? (
              workouts.map((workout) => {
                const categoryOrderMap: Record<string, number> = { push: 0, pull: 1, leg: 2, legs: 2, flex: 3, flexible: 3, custom: 3 }
                const daysForWorkout = workoutDays
                  .filter((day) => day.workout_id === workout.id)
                  .sort((a, b) => (categoryOrderMap[a.day_id.toLowerCase()] ?? 99) - (categoryOrderMap[b.day_id.toLowerCase()] ?? 99))
                const isExpanded = expandedWorkouts[workout.id]

                return (
                  <motion.div
                    key={workout.id}
                    layout
                    className="group relative bg-zinc-900/90 hover:bg-zinc-900/95 border border-zinc-800 rounded-2xl transition-all duration-200 overflow-hidden shadow-sm"
                  >
                    <div
                      className="flex items-center justify-between py-3 px-3.5 cursor-pointer select-none"
                      onClick={() => toggleWorkoutExpanded(workout.id)}
                    >
                      <span className="font-bold text-zinc-100 text-sm tracking-tight">
                        {workout.name}
                      </span>

                      <div className="flex items-center gap-2">
                        {isEditMode && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteWorkout(workout.id, workout.name)
                            }}
                            className="h-7 w-7 text-zinc-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900/40 rounded-lg transition-all"
                            aria-label={`Delete ${workout.name} routine`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <ChevronDown className={cn("h-4 w-4 text-zinc-400 transition-transform duration-200", isExpanded && "rotate-180")} />
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="border-t border-zinc-800/80"
                        >
                          <div className="p-3 sm:p-3.5">
                            {daysForWorkout.length > 0 ? (
                              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                                {daysForWorkout.map((day) => {
                                  const dayKey = `${workout.id}-${day.id}`
                                  const isDayExpanded = expandedDays[dayKey]

                                  return (
                                    <div
                                      key={dayKey}
                                      className="relative rounded-xl border border-zinc-700/60 bg-zinc-800/70 hover:bg-zinc-800/90 transition-colors overflow-hidden"
                                    >
                                      <div
                                        className="flex items-center justify-between py-2.5 px-3.5 cursor-pointer hover:bg-zinc-700/30 transition-colors"
                                        onClick={() => toggleDayExpanded(dayKey)}
                                      >
                                        <p className="text-sm font-semibold text-zinc-100 truncate leading-tight pr-2">
                                          {(day.name === 'Flex / Custom' || day.name === 'Custom' || day.name === 'Custom Day' || day.name === 'Flex') ? 'Flex Day' : day.name}
                                        </p>
                                        <ChevronDown className={cn("h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 flex-shrink-0", isDayExpanded && "rotate-180")} />
                                      </div>

                                      <AnimatePresence>
                                        {isDayExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="border-t border-zinc-700/50"
                                          >
                                            <div className="p-1">
                                              {day.exercises.length > 0 ? (
                                                <ul className="divide-y divide-zinc-700/30">
                                                  {day.exercises.map((exercise, index) => (
                                                    <ExerciseItem
                                                      key={exercise.id}
                                                      exercise={exercise}
                                                      index={index}
                                                      totalExercises={day.exercises.length}
                                                      dayId={day.id}
                                                      workoutId={workout.id}
                                                      onMoveUp={moveExerciseUp}
                                                      onMoveDown={moveExerciseDown}
                                                      onDelete={handleDeleteExercise}
                                                      isEditMode={isEditMode}
                                                    />
                                                  ))}
                                                </ul>
                                              ) : (
                                                <div className="py-2.5 text-center text-xs text-zinc-500 font-medium">
                                                  No exercises added yet
                                                </div>
                                              )}

                                              {/* Clean Unboxed Add Exercise Row */}
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  setPendingExerciseOpen({ workoutId: workout.id, dayId: day.id })
                                                }}
                                                className="w-full flex items-center gap-2 py-2 px-2.5 mt-0.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/25 transition-all cursor-pointer group/add"
                                              >
                                                <Plus className="h-3.5 w-3.5 text-zinc-500 group-hover/add:text-zinc-300 transition-colors" />
                                                <span>Add exercise</span>
                                              </button>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-6 rounded-xl border border-zinc-800/70 bg-zinc-900/30 select-none">
                                <p className="text-xs text-zinc-400 font-medium">No days in this routine</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })
            ) : (
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md select-none"
              >
                <div className="w-12 h-12 rounded-2xl border border-zinc-800/90 bg-zinc-900/80 flex items-center justify-center mb-3.5 shadow-sm text-zinc-400">
                  <Dumbbell className="h-5 w-5 text-zinc-400" strokeWidth={1.8} />
                </div>
                <h3 className="text-base font-bold text-zinc-100 mb-1 tracking-tight">No routines yet</h3>
                <p className="text-xs text-zinc-400 mb-4 max-w-xs mx-auto leading-relaxed font-medium">
                  Create your first routine to start tracking.
                </p>
                <Button
                  size="sm"
                  onClick={() => setIsAddWorkoutOpen(true)}
                  className="h-8 px-3.5 text-xs font-semibold rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/70 shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Create Routine</span>
                </Button>
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* Account Section */}
        <motion.section variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-base font-extrabold text-zinc-100 tracking-tight">
              Account
            </h2>
          </div>

          <AccountSettingsCard
            displayUsername={displayUsername}
            userEmail={user?.email}
            isAccountExpanded={isAccountExpanded}
            setIsAccountExpanded={setIsAccountExpanded}
            recoveryEmailState={recoveryEmailState}
            setRecoveryEmailState={setRecoveryEmailState}
            handleUpdateRecoveryEmail={handleUpdateRecoveryEmail}
            emailMessage={emailMessage}
            emailError={emailError}
            updatingEmail={updatingEmail}
            currentRecoveryEmail={user?.user_metadata?.recovery_email}
            onViewGuide={() => {
              haptic("light");
              setShowOnboarding(true);
            }}
            onSignOutClick={() => {
              haptic("warning");
              setIsSignOutOpen(true);
            }}
            onHaptic={haptic}
          />
        </motion.section>
      </div>

      {/* Showcase Footer */}
      <motion.div variants={itemVariants}>
        <ShowcaseFooter />
      </motion.div>
    </motion.div>

      {/* Dialogs */}
      <AddWorkoutDialog
        open={isAddWorkoutOpen}
        onOpenChange={setIsAddWorkoutOpen}
        workoutName={newWorkoutName}
        onWorkoutNameChange={setNewWorkoutName}
        onAddWorkout={handleAddWorkout}
      />

      <AddExerciseDialog
        open={isAddExerciseOpen}
        onOpenChange={setIsAddExerciseOpen}
        exerciseName={newExerciseName}
        onExerciseNameChange={setNewExerciseName}
        filteredExercises={filteredExercises}
        highlightedIndex={highlightedIndex}
        setHighlightedIndex={setHighlightedIndex}
        showSuggestions={showSuggestions}
        setShowSuggestions={setShowSuggestions}
        onAddExercise={handleAddExercise}
        isCreatingExercise={isCreatingExercise}
        selectedWorkoutId={selectedWorkoutId}
        selectedDayId={selectedDayId}
      />

      <ResetConfirmationModal
        isOpen={isSignOutOpen}
        onClose={() => setIsSignOutOpen(false)}
        onConfirm={handleSignOut}
        dayColor="#EA4335"
        message={"Are you sure you want to sign out?"}
      />

      <OnboardingGuide
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      <ResetConfirmationModal
        isOpen={isDeleteAllWorkoutsOpen}
        onClose={() => setIsDeleteAllWorkoutsOpen(false)}
        intent="delete"
        onConfirm={() => {
          if (pendingDeleteWorkoutId) {
            onUpdateWorkoutsAndDays(workouts.filter((w) => w.id !== pendingDeleteWorkoutId), workoutDays);
            toast({
              variant: "destructive",
              title: "Routine deleted",
              description: "Last routine removed.",
            });
            setPendingDeleteWorkoutId(null);
          }
        }}
        dayColor="#EA4335"
        message={"Are you sure you want to delete your last routine? All associated days and exercises will be removed."}
      />

      <DeletionConfirmationModal
        isOpen={isDeleteWorkoutOpen}
        onClose={() => {
          setIsDeleteWorkoutOpen(false);
          setWorkoutToDelete(null);
        }}
        onConfirm={confirmDeleteWorkout}
        itemType="workout"
        itemName={workoutToDelete?.name || ""}
      />



      <DeletionConfirmationModal
        isOpen={isDeleteExerciseOpen}
        onClose={() => {
          setIsDeleteExerciseOpen(false);
          setExerciseToDelete(null);
        }}
        onConfirm={confirmDeleteExercise}
        itemType="exercise"
        itemName={exerciseToDelete?.name || ""}
      />



      <div className="my-6"></div>
    </div>
  )
}

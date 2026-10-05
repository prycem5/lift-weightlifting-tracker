"use client";

import { useState, useEffect, useRef } from "react";
import { PRModal } from "./prModal";
import { Exercise, Workout, PR } from "@/types/liftEntities";
import { ActiveSet, ActiveWorkout } from "@/utils/db";
import {
  saveActiveWorkout,
  saveActiveSet,
  updateActiveSet,
  deleteActiveSet,
  clearActiveSession,
} from "@/utils/cache";
import { ChevronUp, ChevronDown, Plus, Minus } from "lucide-react";
import { ConfirmModal } from "@/components/themed/confirmModal";
import { SearchBar } from "@/components/themed/searchBar";
import { THEME_TOKENS, Theme } from "@/types/themes";
import { RestoredWorkoutData } from "@/app/(pwa)/dashboard/page";
import {
  createRequest,
  updateRequest,
  readRequest,
} from "@/utils/api";

interface ActiveWorkoutSheetProps {
  theme?: Theme;
  restoredData?: RestoredWorkoutData | null;
  onWorkoutEnd: () => void;
}

interface SelectedExerciseGroup {
  exerciseId: string;
  exerciseName: string;
  sets: ActiveSet[];
}

export const ActiveWorkoutSheet = ({
  theme = "dark",
  restoredData,
  onWorkoutEnd,
}: ActiveWorkoutSheetProps) => {
  const t = THEME_TOKENS[theme];

  const [workoutStart, setWorkoutStart] = useState<Date>(() => {
    return restoredData ? new Date(restoredData.workout.timestamp) : new Date();
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    if (restoredData) {
      const startTime = new Date(restoredData.workout.timestamp).getTime();
      return Math.max(0, Math.floor((Date.now() - startTime) / 1000));
    }
    return 0;
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmModal, setConfirmModal] = useState<"cancel" | "finish" | null>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prSummaryList, setPrSummaryList] = useState<Array<{ exerciseName: string; weight: number; previousWeight?: number }>>([]);
  const [showPRModal, setShowPRModal] = useState(false);

  // Rebuild grouped exercise cards from restored sets if resuming
  const [exerciseGroups, setExerciseGroups] = useState<SelectedExerciseGroup[]>(() => {
    if (!restoredData || restoredData.sets.length === 0) return [];

    const map: Record<string, SelectedExerciseGroup> = {};
    for (const set of restoredData.sets) {
      if (!map[set.exerciseId]) {
        map[set.exerciseId] = {
          exerciseId: set.exerciseId,
          exerciseName: set.exerciseName,
          sets: [],
        };
      }
      map[set.exerciseId].sets.push(set);
    }
    return Object.values(map);
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer interval
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Save active session record to Dexie if not restored
  useEffect(() => {
    if (!restoredData) {
      const initialWorkout: ActiveWorkout = {
        localId: "active-session",
        PK: "!",
        SK: "!",
        timestamp: workoutStart.toISOString(),
        duration: 0,
      };
      saveActiveWorkout(initialWorkout);
    }
  }, [restoredData, workoutStart]);

  // Delay scrolling during layout animation
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isExpanded) {
      timeout = setTimeout(() => setCanScroll(true), 250);
    } else {
      setCanScroll(false);
    }
    return () => clearTimeout(timeout);
  }, [isExpanded]);

  const formatElapsed = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const formatWorkoutDate = (date: Date): string => {
    return `${date.getMonth() + 1}/${date.getDate()} Workout`;
  };

  const onSelectExercise = async (exercise: Exercise): Promise<void> => {
    const exerciseId = exercise.entityId;
    const existing = exerciseGroups.find((g) => g.exerciseId === exerciseId);
    const setIndex = existing ? existing.sets.length + 1 : 1;

    const newSetData: Omit<ActiveSet, "localId"> = {
      PK: "!",
      SK: "!",
      exerciseId: exerciseId,
      exerciseName: exercise.name,
      reps: 0,
      weight: 0,
      setIndex: setIndex,
    };

    const localId = await saveActiveSet(newSetData);
    const createdSet: ActiveSet = { ...newSetData, localId: localId ?? Date.now() };

    setExerciseGroups((prev) => {
      const match = prev.find((g) => g.exerciseId === exerciseId);
      if (match) {
        return prev.map((g) =>
          g.exerciseId === exerciseId ? { ...g, sets: [...g.sets, createdSet] } : g
        );
      }
      return [
        ...prev,
        {
          exerciseId,
          exerciseName: exercise.name,
          sets: [createdSet],
        },
      ];
    });
  };

  const handleAddSetToGroup = async (exerciseId: string, exerciseName: string) => {
    const existing = exerciseGroups.find((g) => g.exerciseId === exerciseId);
    const setIndex = existing ? existing.sets.length + 1 : 1;
    const newSetData: Omit<ActiveSet, "localId"> = {
      PK: "!",
      SK: "!",
      exerciseId: exerciseId,
      exerciseName: exerciseName,
      reps: 0,
      weight: 0,
      setIndex,
    };

    const localId = await saveActiveSet(newSetData);
    const createdSet: ActiveSet = { ...newSetData, localId: localId ?? Date.now() };

    setExerciseGroups((prev) =>
      prev.map((g) =>
        g.exerciseId === exerciseId ? { ...g, sets: [...g.sets, createdSet] } : g
      )
    );
  };

  const handleRemoveSetFromGroup = async (exerciseId: string) => {
    const targetGroup = exerciseGroups.find((g) => g.exerciseId === exerciseId);
    if (!targetGroup || targetGroup.sets.length === 0) return;

    // Delete the last set from Dexie
    const setToRemove = targetGroup.sets[targetGroup.sets.length - 1];
    if (setToRemove.localId !== undefined) {
      await deleteActiveSet(setToRemove.localId);
    }

    // Update state: pop the set, or drop the group if empty
    setExerciseGroups((prev) => {
      return prev
        .map((g) => {
          if (g.exerciseId !== exerciseId) return g;
          return { ...g, sets: g.sets.slice(0, -1) };
        })
        .filter((g) => g.sets.length > 0);
    });
  };

  const handleUpdateSetValue = (
    exerciseId: string,
    setIndex: number,
    field: "reps" | "weight",
    value: number
  ) => {
    setExerciseGroups((prev) => {
      let targetLocalId: number | undefined;

      const updatedGroups = prev.map((g) => {
        if (g.exerciseId !== exerciseId) return g;

        const nextSets = [...g.sets];
        const targetSet = nextSets[setIndex];
        if (targetSet) {
          targetLocalId = targetSet.localId;
          nextSets[setIndex] = { ...targetSet, [field]: value };
        }
        return { ...g, sets: nextSets };
      });

      if (targetLocalId !== undefined) {
        updateActiveSet(targetLocalId, { [field]: value }).catch((err) => {
          console.error("Failed to persist set update to Dexie:", err);
        });
      }

      return updatedGroups;
    });
  };

  const handleConfirmCancel = async () => {
    setConfirmModal(null);
    await clearActiveSession();
    onWorkoutEnd();
  };

  const handleConfirmFinish = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const finalDuration = elapsedSeconds;
      const workoutTimestamp = workoutStart.toISOString();

      const workoutResponse = await createRequest<Workout>("workout", {
        attributes: {
          timestamp: workoutTimestamp,
          duration: finalDuration,
        },
      });

      const workoutId = workoutResponse?.SK;
      if (!workoutId) {
        throw new Error("Failed to retrieve generated workoutId from response.");
      }

      const allSetsToSync: Array<{
        exerciseId: string;
        reps: number;
        weight: number;
        setIndex: number;
      }> = [];

      for (const group of exerciseGroups) {
        group.sets.forEach((setItem, idx) => {
          allSetsToSync.push({
            exerciseId: group.exerciseId,
            reps: setItem.reps,
            weight: setItem.weight,
            setIndex: idx + 1,
          });
        });
      }

      if (allSetsToSync.length > 0) {
        await Promise.all(
          allSetsToSync.map((set) =>
            createRequest("set", {
              workoutId: workoutId,
              setIndex: set.setIndex,
              attributes: {
                exerciseId: set.exerciseId,
                reps: set.reps,
                weight: set.weight,
              },
            })
          )
        );
      }

      const brokenPRs: Array<{ exerciseName: string; weight: number; previousWeight?: number }> = [];

      try {
        let existingPRs: PR[] = [];
        try {
          const fetched = await readRequest<PR[]>("pr");
          existingPRs = Array.isArray(fetched) ? fetched : [];
        } catch {
          existingPRs = [];
        }

        const prMap = new Map(existingPRs.map((p) => [p.exerciseId, p]));

        for (const group of exerciseGroups) {
          const maxWeight = Math.max(...group.sets.map((s) => s.weight || 0), 0);
          if (maxWeight <= 0) continue;

          const currentPR = prMap.get(group.exerciseId);

          if (!currentPR) {
            await createRequest("pr", {
              exerciseId: group.exerciseId,
              attributes: { weight: maxWeight },
            });
            brokenPRs.push({ exerciseName: group.exerciseName, weight: maxWeight });
          } else if (maxWeight > currentPR.weight) {
            const rawExerciseId = group.exerciseId.replace("exercise#","");
            await updateRequest(`pr/${rawExerciseId}`, {
              attributes: { weight: maxWeight },
            });
            brokenPRs.push({
              exerciseName: group.exerciseName,
              weight: maxWeight,
              previousWeight: currentPR.weight,
            });
          }
        }
      } catch (prErr) {
        console.error("Non-blocking PR calculation error:", prErr);
      }

      await clearActiveSession();
      setConfirmModal(null);
      setPrSummaryList(brokenPRs);
      setShowPRModal(true);
    } catch (error) {
      console.error("Error finalizing workout:", error);
      alert("Failed to save workout to server. Your progress is kept locally.");
      setConfirmModal(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className={`w-full ${
          isExpanded
            ? "fixed inset-x-0 bottom-0 z-40 p-4 max-h-screen flex flex-col justify-end backdrop-blur-sm"
            : "relative mb-2"
        }`}
      >
        <div
          className={`${t.barBg} ${t.barBorder} border rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
            isExpanded ? "h-[85vh] p-0" : "max-h-20 px-4 py-3"
          }`}
        >
          {!isExpanded ? (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="w-full flex items-center justify-between focus:outline-none"
              aria-expanded={isExpanded}
            >
              <div className="text-left">
                <p className={`text-xs ${t.barSubtext} leading-tight`}>
                  {formatWorkoutDate(workoutStart)}
                </p>
                <p className={`text-base font-semibold ${t.barText} leading-tight tabular-nums`}>
                  {formatElapsed(elapsedSeconds)}
                </p>
              </div>
              <ChevronUp size={18} className={t.barSubtext} />
            </button>
          ) : (
            <div className="w-full flex-1 flex flex-col h-full overflow-hidden">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className={`w-full py-2.5 flex items-center justify-center border-b ${t.barBorder} ${t.collapseHeaderBg} transition-colors focus:outline-none`}
                aria-label="Collapse workout view"
              >
                <ChevronDown size={20} className={t.barSubtext} />
              </button>

              <div
                className={`p-4 flex-1 flex flex-col justify-between space-y-4 ${
                  canScroll
                    ? "overflow-y-auto"
                    : "overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                }`}
              >
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <div>
                      <p className={`text-xs ${t.barSubtext}`}>{formatWorkoutDate(workoutStart)}</p>
                      <p className={`text-xl font-bold ${t.barText} tabular-nums`}>
                        {formatElapsed(elapsedSeconds)}
                      </p>
                    </div>
                  </div>

                  <div className="w-full">
                    <SearchBar onSelectExercise={onSelectExercise} />
                  </div>

                  {/* Render Exercise Cards with Sets */}
                  <div className="w-full space-y-3">
                    {exerciseGroups.map((group) => (
                      <div
                        key={group.exerciseId}
                        className="bg-zinc-950/30 border border-zinc-800 rounded-xl p-3.5 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-zinc-200">
                            {group.exerciseName}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleAddSetToGroup(group.exerciseId, group.exerciseName)
                              }
                              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                              aria-label={`Add set to ${group.exerciseName}`}
                            >
                              <Plus size={14} />
                              <span>Set</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSetFromGroup(group.exerciseId)}
                              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                              aria-label={`Remove last set from ${group.exerciseName}`}
                            >
                              <Minus size={14} />
                              <span>Set</span>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {group.sets.map((item, index) => (
                            <div
                              key={item.localId ?? index}
                              className="flex items-center gap-3 text-xs text-zinc-400"
                            >
                              <span className="w-8 font-mono">#{index + 1}</span>
                              <div className="flex items-center gap-1.5 flex pr-10">
                                <label htmlFor={`reps-${group.exerciseId}-${index}`}>Reps:</label>
                                <input
                                  id={`reps-${group.exerciseId}-${index}`}
                                  type="number"
                                  min="0"
                                  value={item.reps || ""}
                                  placeholder="0"
                                  onChange={(e) =>
                                    handleUpdateSetValue(
                                      group.exerciseId,
                                      index,
                                      "reps",
                                      parseInt(e.target.value, 10) || 0
                                    )
                                  }
                                  className="w-16 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-100 text-center focus:outline-none focus:border-zinc-600"
                                />
                              </div>
                              <div className="flex items-center gap-1.5 flex">
                                <label htmlFor={`weight-${group.exerciseId}-${index}`}>Weight:</label>
                                <input
                                  id={`weight-${group.exerciseId}-${index}`}
                                  type="number"
                                  min="0"
                                  value={item.weight || ""}
                                  placeholder="0"
                                  onChange={(e) =>
                                    handleUpdateSetValue(
                                      group.exerciseId,
                                      index,
                                      "weight",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-16 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-100 text-center focus:outline-none focus:border-zinc-600"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmModal("cancel")}
                    className="flex-1 py-2.5 rounded-xl text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmModal("finish")}
                    className="flex-1 py-2.5 rounded-xl text-xs font-medium text-zinc-950 bg-zinc-100 hover:bg-white transition-colors"
                  >
                    Finish
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal === "cancel"}
        title="Cancel this workout?"
        description="Your progress won't be saved."
        confirmLabel="Cancel workout"
        cancelLabel="Keep going"
        variant="destructive"
        onConfirm={handleConfirmCancel}
        onClose={() => setConfirmModal(null)}
      />

      <ConfirmModal
        isOpen={confirmModal === "finish"}
        title="Finish this workout?"
        description="This will end and save your session."
        confirmLabel={isSubmitting ? "Saving..." : "Finish workout"}
        cancelLabel="Keep going"
        variant="default"
        onConfirm={() => handleConfirmFinish()}
        onClose={() => {
          if (!isSubmitting) setConfirmModal(null);
        }}
      />

      <PRModal
        isOpen={showPRModal}
        newPRs={prSummaryList}
        onClose={() => {
          setShowPRModal(false);
          onWorkoutEnd();
        }}
      />
    </>
  );
};
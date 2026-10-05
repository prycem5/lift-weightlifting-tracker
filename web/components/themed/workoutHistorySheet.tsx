"use client";

import { useEffect, useState } from "react";
import { Workout, Set as LiftSet, Exercise } from "@/types/liftEntities";
import { readRequest } from "@/utils/api";
import { X, Calendar, Clock, Dumbbell } from "lucide-react";

interface WorkoutDetailModalProps {
  workout: Workout | null;
  exercises: Exercise[];
  onClose: () => void;
}

interface DisplayGroup {
  exerciseId: string;
  exerciseName: string;
  sets: LiftSet[];
}

export const WorkoutDetailModal = ({
  workout,
  exercises,
  onClose,
}: WorkoutDetailModalProps) => {
  const [sets, setSets] = useState<LiftSet[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!workout) return;

    const fetchSets = async () => {
      setIsLoading(true);
      try {
        const cleanTimestamp = workout?.timestamp.replace(/^workout#/, "");
        console.log(cleanTimestamp);
        const data = await readRequest<LiftSet[]>(
          `set?workoutId=${encodeURIComponent(cleanTimestamp)}`
        );
        setSets(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading workout sets:", err);
        setSets([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSets();
  }, [workout]);

  if (!workout) return null;

  // Build a lookup map from exerciseId to name
  const exerciseMap = new Map(
    exercises.map((ex) => [ex.entityId || ex.SK, ex.name])
  );

  // Group sets by exercise
  const groups: DisplayGroup[] = [];
  const groupMap = new Map<string, DisplayGroup>();

  // Sort sets by setIndex ascending
  const sortedSets = [...sets].sort((a, b) => a.setIndex - b.setIndex);

  for (const set of sortedSets) {
    let group = groupMap.get(set.exerciseId);
    if (!group) {
      group = {
        exerciseId: set.exerciseId,
        exerciseName:
          exerciseMap.get(set.exerciseId) ||
          set.exerciseId.replace(/^exercise#/, "Exercise "),
        sets: [],
      };
      groupMap.set(set.exerciseId, group);
      groups.push(group);
    }
    group.sets.push(set);
  }

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const totalVolume = sets.reduce(
    (acc, curr) => acc + (curr.reps || 0) * (curr.weight || 0),
    0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-1.5">
              <Calendar size={16} className="text-zinc-400" />
              {formatDate(workout.timestamp)}
            </h2>
            <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <Clock size={12} /> {formatDuration(workout.duration || 0)}
              </span>
              <span className="flex items-center gap-1">
                <Dumbbell size={12} /> {totalVolume.toLocaleString()} lbs total
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              Loading session sets...
            </div>
          ) : groups.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No sets recorded for this workout.
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.exerciseId}
                className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3.5 space-y-2.5"
              >
                <p className="text-sm font-semibold text-zinc-200">
                  {group.exerciseName}
                </p>
                <div className="space-y-1.5">
                  {group.sets.map((s, idx) => (
                    <div
                      key={s.SK || idx}
                      className="flex items-center justify-between rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300"
                    >
                      <span className="font-mono text-zinc-500">
                        Set {s.setIndex || idx + 1}
                      </span>
                      <div className="flex items-center gap-4">
                        <span>
                          <strong className="text-zinc-100">{s.reps}</strong>{" "}
                          reps
                        </span>
                        <span>
                          <strong className="text-zinc-100">{s.weight}</strong>{" "}
                          lbs
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-zinc-800 p-3">

        </div>
      </div>
    </div>
  );
};
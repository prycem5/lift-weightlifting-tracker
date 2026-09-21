"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { ConfirmModal } from "@/components/themed/confirmModal";
import { SearchBar } from "@/components/themed/searchBar";
import { THEME_TOKENS, Theme } from "@/types/themes";

interface ActiveWorkoutSheetProps {
  theme?: Theme;
  onWorkoutEnd: () => void;
}

export const ActiveWorkoutSheet = ({
  theme = "dark",
  onWorkoutEnd,
}: ActiveWorkoutSheetProps) => {
  const t = THEME_TOKENS[theme];

  const [workoutStart] = useState<Date>(() => new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmModal, setConfirmModal] = useState<"cancel" | "finish" | null>(null);
  const [canScroll, setCanScroll] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Time tracking lifecycle
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Delay scrollability to eliminate scrollbar flashing during height expansion
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isExpanded) {
      timeout = setTimeout(() => setCanScroll(true), 500);
    } else {
      setCanScroll(false);
    }
    return () => clearTimeout(timeout);
  }, [isExpanded]);

  const formatElapsed = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0"); //review, what is the purpose of pad and is it neccesary?
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const formatWorkoutDate = (date: Date): string => {
    return `${date.getMonth() + 1}/${date.getDate()} Workout`;
  };

  const handleConfirmCancel = () => {
    setConfirmModal(null);
    onWorkoutEnd();
  };

  const handleConfirmFinish = () => {
    setConfirmModal(null);
    // TODO: Send workout summary to DynamoDB via createRequest
    onWorkoutEnd();
  };

  return (
    <>
      {/* Outer fixed overlay wrapper active only when sheet expands */}
      <div
        className={`w-full transition-all duration-500 ease-out ${
          isExpanded
            ? "fixed inset-x-0 bottom-0 z-40 p-4 max-h-screen flex flex-col justify-end backdrop-blur-sm"
            : "relative mb-2"
        }`}
      >
        {/* Animated Container Card */}
        <div
          className={`${t.barBg} ${t.barBorder} border rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-500 ease-out ${
            isExpanded ? "h-[85vh] p-0" : "max-h-20 px-4 py-3"
          }`}
        >
          {!isExpanded ? (
            /* Collapsed Bar View */
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
            /* Full-Screen Sheet View */
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
                    <SearchBar onSelectExercise={() => {}}/>
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

      {/* Confirmation Modals */}
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
        confirmLabel="Finish workout"
        cancelLabel="Keep going"
        variant="default"
        onConfirm={handleConfirmFinish}
        onClose={() => setConfirmModal(null)}
      />
    </>
  );
};
"use client";

import React, { useState, useEffect, useRef } from "react";
import { User, Plus, Home, History, ChevronUp, ChevronDown } from "lucide-react";
import { ConfirmModal } from "@/app/components/themed/confirmModal";

type Theme = "dark" | "light";

interface ThemeTokens {
  navBg: string;
  navBorder: string;
  iconIdle: string;
  iconHover: string;
  iconActiveBg: string;
  barBg: string;
  barText: string;
  barSubtext: string;
  barBorder: string;
}

const THEME_TOKENS: Record<Theme, ThemeTokens> = {
  dark: {
    navBg: "bg-zinc-950/95",
    navBorder: "border-zinc-800",
    iconIdle: "text-zinc-500",
    iconHover: "hover:text-zinc-400",
    iconActiveBg: "bg-zinc-100 text-zinc-950",
    barBg: "bg-zinc-900",
    barText: "text-zinc-100",
    barSubtext: "text-zinc-500",
    barBorder: "border-zinc-800",
  },
  light: {
    navBg: "bg-zinc-950/95",
    navBorder: "border-zinc-800",
    iconIdle: "text-zinc-500",
    iconHover: "hover:text-zinc-400",
    iconActiveBg: "bg-zinc-100 text-zinc-950",
    barBg: "bg-zinc-900",
    barText: "text-zinc-100",
    barSubtext: "text-zinc-500",
    barBorder: "border-zinc-800",
  },
};

export const BottomNavBar = () => {
  const [theme] = useState<Theme>("dark");
  const t = THEME_TOKENS[theme];

  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutStart, setWorkoutStart] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isBarExpanded, setIsBarExpanded] = useState(false);
  const [confirmModal, setConfirmModal] = useState<"cancel" | "finish" | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // the interval exists only while a workout is active; cleanup prevents timers from
    // continuing after the workout ends or the component unmounts.
    if (isWorkoutActive == true) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isWorkoutActive]);

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

  const handleProfileClick = () => {
    // TODO: navigate to the profile page (e.g. router.push("/profile")).
  };

  const handleHistoryClick = () => {
    // TODO: navigate to the history page (e.g. router.push("/history")).
  };

  const handleHomeNavigate = () => {
    // TODO: navigate to the home page (e.g. router.push("/")).
  };

  const handleStartWorkout = () => {
    setIsWorkoutActive(true);
    setWorkoutStart(new Date());
    setElapsedSeconds(0);
    setIsBarExpanded(false);
  };

  const handleConfirmCancelWorkout = () => {
    setIsWorkoutActive(false);
    setWorkoutStart(null);
    setElapsedSeconds(0);
    setIsBarExpanded(false);
    setConfirmModal(null);
  };

  const handleConfirmFinishWorkout = () => {
    setIsWorkoutActive(false);
    setWorkoutStart(null);
    setElapsedSeconds(0);
    setIsBarExpanded(false);
    setConfirmModal(null);
  };

  const handleCenterButtonClick = () => {
    // the center action changes meaning with workout state: start a session initially,
    // then return to the home view while one is active.
    if (isWorkoutActive == true) {
      handleHomeNavigate();
    } else {
      handleStartWorkout();
    }
  };

  const iconButtonClasses = `transition-colors duration-150 ${t.iconIdle} ${t.iconHover} focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-full`;

  return (
    <>
      <div className="w-full font-sans">
        {isWorkoutActive && workoutStart && (
          <div
            className={`${t.barBg} ${t.barBorder} border rounded-2xl mb-2 px-4 py-3 shadow-lg transition-all duration-200`}
          >
            <button
              type="button"
              onClick={() => setIsBarExpanded(!isBarExpanded)}
              className="w-full flex items-center justify-between focus:outline-none"
              aria-expanded={isBarExpanded}
            >
              <div className="text-left">
                <p className={`text-xs ${t.barSubtext} leading-tight`}>
                  {formatWorkoutDate(workoutStart)}
                </p>
                <p className={`text-base font-semibold ${t.barText} leading-tight tabular-nums`}>
                  {formatElapsed(elapsedSeconds)}
                </p>
              </div>
              {isBarExpanded == true ? (
                <ChevronDown size={18} className={t.barSubtext} />
              ) : (
                <ChevronUp size={18} className={t.barSubtext} />
              )}
            </button>

            {isBarExpanded && (
              <div className={`mt-3 pt-3 border-t ${t.barBorder} space-y-3`}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmModal("cancel")}
                    className="flex-1 py-2 rounded-xl text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmModal("finish")}
                    className="flex-1 py-2 rounded-xl text-xs font-medium text-zinc-950 bg-zinc-100 hover:bg-white transition-colors"
                  >
                    Finish
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <nav
          className={`${t.navBg} ${t.navBorder} border rounded-2xl px-8 py-3 flex items-center justify-between shadow-lg`}
          aria-label="Primary"
        >
          <button
            type="button"
            onClick={handleProfileClick}
            className={`flex flex-col items-center gap-1 p-2 ${iconButtonClasses}`}
            aria-label="Profile"
          >
            <User size={24} strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={handleCenterButtonClick}
            className={`flex items-center justify-center w-12 h-12 rounded-full ${t.iconActiveBg} transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950`}
            aria-label={isWorkoutActive ? "Go to home" : "Start workout"}
          >
            {isWorkoutActive ? (
              <Home size={22} strokeWidth={2.25} />
            ) : (
              <Plus size={22} strokeWidth={2.25} />
            )}
          </button>

          <button
            type="button"
            onClick={handleHistoryClick}
            className={`flex flex-col items-center gap-1 p-2 ${iconButtonClasses}`}
            aria-label="History"
          >
            <History size={24} strokeWidth={2} />
          </button>
        </nav>

        <ConfirmModal
          isOpen={confirmModal === "cancel"}
          title="Cancel this workout?"
          description="Your progress won't be saved."
          confirmLabel="Cancel workout"
          cancelLabel="Keep going"
          variant="destructive"
          onConfirm={handleConfirmCancelWorkout}
          onClose={() => setConfirmModal(null)}
        />

        <ConfirmModal
          isOpen={confirmModal === "finish"}
          title="Finish this workout?"
          description="This will end and save your session."
          confirmLabel="Finish workout"
          cancelLabel="Keep going"
          variant="default"
          onConfirm={handleConfirmFinishWorkout}
          onClose={() => setConfirmModal(null)}
        />
      </div>
    </>
  );
};
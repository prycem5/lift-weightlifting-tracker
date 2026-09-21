"use client";

import { useState } from "react";
import { User, Plus, Home, History } from "lucide-react";
import { ActiveWorkoutSheet } from "@/components/themed/activeWorkoutSheet";
import { Theme, THEME_TOKENS } from "@/types/themes";

export const BottomNavBar = () => {
  const [theme] = useState<Theme>("dark");
  const t = THEME_TOKENS[theme];
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  const handleProfileClick = () => {
    // TODO: navigate to profile
  };

  const handleHistoryClick = () => {
    // TODO: navigate to history
  };

  const handleCenterButtonClick = () => {
    if (!isWorkoutActive) {
      setIsWorkoutActive(true);
    }
  };

  const iconButtonClasses = `transition-colors duration-150 ${t.iconIdle} ${t.iconHover} focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-full`;

  return (
    <div className="w-full font-sans relative">
      {/* Active Workout Sheet only mounts when a session is active */}
      {isWorkoutActive && (
        <ActiveWorkoutSheet
          theme={theme}
          onWorkoutEnd={() => setIsWorkoutActive(false)}
        />
      )}

      {/* Primary Bottom Navigation Bar */}
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
          aria-label={isWorkoutActive ? "Active workout running" : "Start workout"}
        >
          {isWorkoutActive ? <Home size={22} strokeWidth={2.25} /> : <Plus size={22} strokeWidth={2.25} />}
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
    </div>
  );
};
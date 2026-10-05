"use client";

import { User, Plus, Home, History } from "lucide-react";
import { ActiveWorkoutSheet } from "@/components/themed/activeWorkoutSheet";
import { Theme, THEME_TOKENS } from "@/types/themes";
import { RestoredWorkoutData } from "@/app/(pwa)/dashboard/page";

export type NavTab = "dashboard" | "history" | "profile";

interface BottomNavBarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isWorkoutActive: boolean;
  setIsWorkoutActive: (active: boolean) => void;
  restoredData: RestoredWorkoutData | null;
  onWorkoutEnd: () => void;
}

export const BottomNavBar = ({
  currentTab,
  onTabChange,
  isWorkoutActive,
  setIsWorkoutActive,
  restoredData,
  onWorkoutEnd,
}: BottomNavBarProps) => {
  const theme: Theme = "dark";
  const t = THEME_TOKENS[theme];

  const handleCenterButtonClick = () => {
    if (!isWorkoutActive && currentTab === "dashboard") {
      setIsWorkoutActive(true);
    } else {
      onTabChange("dashboard");
    }
  };

  const getButtonClass = (tab: NavTab) => {
    const isActive = currentTab === tab;
    return `flex flex-col items-center gap-1 p-2 rounded-full transition-colors duration-150 focus:outline-none ${isActive ? "text-white bg-zinc-800" : `${t.iconIdle}${t.iconHover}`
      }`;
  };

    return (
    <div className="w-full font-sans sticky bottom-0 z-30">
      {isWorkoutActive && (
        <div className="px-4 mb-2">
          <ActiveWorkoutSheet
            theme={theme}
            restoredData={restoredData}
            onWorkoutEnd={onWorkoutEnd}
          />
        </div>
      )}

      <nav
        className={`${t.navBg} border-t ${t.navBorder} w-full px-8 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-between shadow-2xl backdrop-blur-md`}
        aria-label="Primary"
      >
        <div className="pb-2 flex flex-row items-center justify-between w-full">
      <button
          type="button"
          onClick={() => onTabChange("profile")}
          className={getButtonClass("profile")}
          aria-label="Profile"
        >
          <User size={24} strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={handleCenterButtonClick}
          className={`flex items-center justify-center w-12 h-12 rounded-full ${t.iconActiveBg} transition-transform active:scale-95 duration-150 focus:outline-none shadow-lg`}
          aria-label={isWorkoutActive ? "Active workout running" : "Start workout"}
        >
          {(isWorkoutActive || currentTab !== "dashboard") ? (
            <Home size={22} strokeWidth={2.25} />
          ) : (
            <Plus size={22} strokeWidth={2.25} />
          )}
        </button>

        <button
          type="button"
          onClick={() => onTabChange("history")}
          className={getButtonClass("history")}
          aria-label="History"
        >
          <History size={24} strokeWidth={2} />
        </button>
        </div>
        
      </nav>
    </div>
  );
};
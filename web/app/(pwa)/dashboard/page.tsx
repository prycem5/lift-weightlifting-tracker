"use client";

import { useState, useEffect } from "react";
import { PwaGate } from "@/components/pwaGate";
import { signOut, getCurrentUser } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { BottomNavBar, NavTab } from "@/components/themed/bottomNav";
import { ConfirmModal } from "@/components/themed/confirmModal";
import { WorkoutDetailModal } from "@/components/themed/workoutHistorySheet";
import { ActiveWorkout, ActiveSet } from "@/utils/db";
import { getActiveWorkout, getActiveSets, clearActiveSession } from "@/utils/cache";
import { Workout, Exercise, Set as LiftSet, PR } from "@/types/liftEntities";
import { readRequest } from "@/utils/api";
import { Dumbbell, Calendar, LogOut, ChevronRight } from "lucide-react";
import Image from "next/image";

export interface RestoredWorkoutData {
  workout: ActiveWorkout;
  sets: ActiveSet[];
}

export default function Dashboard() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [restoredData, setRestoredData] = useState<RestoredWorkoutData | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // App Data
  const [userEmail, setUserEmail] = useState<string>("");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [prCount, setPrCount] = useState<number>(0);
  const [weeklyLbsLifted, setWeeklyLbsLifted] = useState<number>(0);
  const [weeklyWorkoutsCount, setWeeklyWorkoutsCount] = useState<number>(0);

  // Modal inspection
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Check Dexie once on dashboard mount
  useEffect(() => {
    const checkActiveSession = async () => {
      const cachedWorkout = await getActiveWorkout();
      if (cachedWorkout) {
        const cachedSets = await getActiveSets();
        setRestoredData({ workout: cachedWorkout, sets: cachedSets });
        setShowResumeModal(true);
      }
    };
    checkActiveSession();
  }, []);

  // Fetch initial dashboard data
  useEffect(() => {
    setUserEmail("...")
    const fetchUserData = async () => { 
      try {
        const user = await getCurrentUser();
        setUserEmail(user.signInDetails?.loginId || user.username || "Lifter");
      } catch (err) {
        console.error("Failed to get current user:", err);
      }
    };
const loadAppData = async () => {
      try {
        // Fetch Exercises catalog
        let loadedExercises: Exercise[] = [];
        try {
          const exList = await readRequest<Exercise[]>("exercise");
          if (Array.isArray(exList)) loadedExercises = exList;
        } catch (error) {
          loadedExercises = [];
        }
        setExercises(loadedExercises);

        // Fetch Workouts (fallback to [] on 404 when no workouts exist)
        let loadedWorkouts: Workout[] = [];
        try {
          const wkList = await readRequest<Workout[]>("workout");
          if (Array.isArray(wkList)) loadedWorkouts = wkList;
        } catch {
          loadedWorkouts = [];
        }
        setWorkouts(loadedWorkouts);

        // Fetch PR count (fallback to 0 on 404 when no PRs exist)
        try {
          const prs = await readRequest<PR[]>("pr");
          if (Array.isArray(prs)) setPrCount(prs.length);
          else setPrCount(0);
        } catch {
          setPrCount(0);
        }

        // Calculate this week's stats with the loaded array
        computeWeeklyStats(loadedWorkouts);
      } catch (err) {
        console.error("Error loading app data:", err);
      }
    };

    fetchUserData();
    loadAppData();
  }, [isWorkoutActive]);

// Sums reps * weight for all sets in workouts logged within the last 7 days
  const computeWeeklyStats = async (allWorkouts: Workout[] = []) => {
    if (!allWorkouts || allWorkouts.length === 0) {
      setWeeklyWorkoutsCount(0);
      setWeeklyLbsLifted(0);
      return;
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const thisWeeksWorkouts = allWorkouts.filter((w) => {
      const raw = w?.timestamp || w?.SK || "";
      const cleanTime = raw.replace(/^workout#/, "");
      if (!cleanTime) return false;
      const wDate = new Date(cleanTime);
      return !isNaN(wDate.getTime()) && wDate >= oneWeekAgo;
    });

    setWeeklyWorkoutsCount(thisWeeksWorkouts.length);

    let totalVolume = 0;
    for (const w of thisWeeksWorkouts) {
      try {
        const raw = w?.timestamp || w?.SK || "";
        const cleanTimestamp = raw.replace(/^workout#/, "");
        const sets = await readRequest<LiftSet[]>(
          `set?workoutId=${encodeURIComponent(cleanTimestamp)}`
        );
        if (Array.isArray(sets)) {
          for (const s of sets) {
            totalVolume += (s.reps || 0) * (s.weight || 0);
          }
        }
      } catch (e) {
        // Workout has no sets logged
      }
    }
    setWeeklyLbsLifted(totalVolume);
  };

  const handleResumeWorkout = () => {
    setShowResumeModal(false);
    setIsWorkoutActive(true);
  };

  const handleDiscardWorkout = async () => {
    await clearActiveSession();
    setRestoredData(null);
    setShowResumeModal(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error signing out:", error.message);
      }
    }
  };

  return (
    <>
      <PwaGate />
      <div className=" min-h-screen flex flex-col justify-between  pt-6">
        {/* MAIN BODY PER TAB */}
        <div className="flex-1 pb-4 px-4">
          {/* TAB 1: DASHBOARD */}
          {currentTab === "dashboard" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white">
                  Hello, {userEmail}!
                </h1>
                <p className="mt-1 text-sm text-zinc-400">Let's get to work.</p>
              </div>

              {/* Weekly Summary Card */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-xl space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  This Week's Activity
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <span className="text-xs font-medium">Workouts</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {weeklyWorkoutsCount}
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <span className="text-xs font-medium">Lbs Lifted</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {weeklyLbsLifted.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Action Banner */}
              {!isWorkoutActive && (
                <div
                  onClick={() => setIsWorkoutActive(true)}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 flex items-center justify-between cursor-pointer hover:border-zinc-700 transition-colors"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      GET STARTED.
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Tap + below to start an empty workout sheet.
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-zinc-500" />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HISTORY */}
          {currentTab === "history" && (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-white">History</h1>
              {workouts.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 text-center text-xs text-zinc-500">
                  No completed workouts found.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[72vh] overflow-y-auto pr-1">
                  {[...workouts]
                    .filter((w) => Boolean(w.timestamp || w.SK))
                    .sort((a, b) => {
                      const timeA = (a.timestamp || a.SK || "").replace(/^workout#/, "");
                      const timeB = (b.timestamp || b.SK || "").replace(/^workout#/, "");
                      return timeB.localeCompare(timeA);
                    })
                    .map((w) => {
                      const rawTime = (w.timestamp || w.SK || "").replace(/^workout#/, "");
                      const cleanDate = new Date(rawTime);
                      const durationSeconds = w.duration || 0;
                      const m = Math.floor(durationSeconds / 60);
                      const s = durationSeconds % 60;

                      return (
                        <div
                          key={w.SK || rawTime}
                          onClick={() => setSelectedWorkout(w)}
                          className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 cursor-pointer hover:bg-zinc-900 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400">
                              <Calendar size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-zinc-200">
                                {!isNaN(cleanDate.getTime())
                                  ? cleanDate.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                  : "Completed Workout"}
                              </p>
                              <p className="text-xs text-zinc-500">
                                Duration: {m}m {s}s
                              </p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-zinc-500" />
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROFILE */}
          {currentTab === "profile" && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col items-center text-center">
                {/* Profile Photo Placeholder */}
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-zinc-800 bg-zinc-900 shadow-inner overflow-hidden">
                      <Image src="/pfp.jpg" alt="Profile" fill className="object-cover" sizes="500"/>
                </div>
                <h2 className="mt-3 text-sm font-medium text-zinc-200">
                  {userEmail}
                </h2>

                <button
                  type="button"
                  disabled
                  className="mt-2 rounded-lg bg-zinc-900 px-3 py-1 text-xs text-zinc-500 cursor-not-allowed border border-zinc-800"
                >
                  Change Username
                </button>
              </div>

              {/* Preferences Section (v1.1 Placeholder) */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-4 opacity-75">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Preferences
                </h3>

                {/* Dark Mode Toggle (Disabled ON) */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Dark Mode</span>
                  {/* Toggle On */}
                  <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-700 cursor-not-allowed">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                  </div>
                </div>

                {/* Metric System Toggle (Disabled OFF) */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Metric System (kg)</span>
                  {/* Toggle Off */}
                  <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-900 border border-zinc-800 cursor-not-allowed">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-zinc-600 transition translate-x-1" />
                  </div>
                </div>

                <p className="text-[11px] text-zinc-600 italic">
                  * Themes and preferences customization will arrive in v1.1.
                </p>
              </div>

              {/* Stats Section */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Stats
                </h3>
                <div className="flex items-center justify-between text-xs text-zinc-300 border-b border-zinc-900 pb-2">
                  <span>Total Workouts</span>
                  <span className="font-bold text-white">{workouts.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <span>Personal Records</span>
                  <span className="font-bold text-amber-400">{prCount}</span>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-500 border border-red-500/20 py-3 text-xs font-semibold text-white hover:bg-red-400 transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <BottomNavBar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          isWorkoutActive={isWorkoutActive}
          setIsWorkoutActive={setIsWorkoutActive}
          restoredData={restoredData}
          onWorkoutEnd={() => {
            setIsWorkoutActive(false);
            setRestoredData(null);
          }}
        />
      </div>

      {/* DETAIL MODAL FOR WORKOUT HISTORY */}
      <WorkoutDetailModal
        workout={selectedWorkout}
        exercises={exercises}
        onClose={() => setSelectedWorkout(null)}
      />

      {/* RESUME CACHED WORKOUT MODAL */}
      <ConfirmModal
        isOpen={showResumeModal}
        title="Resume Active Workout?"
        description="An in-progress workout was found from a previous session. Would you like to resume it?"
        confirmLabel="Resume"
        cancelLabel="Discard"
        variant="default"
        onConfirm={handleResumeWorkout}
        onClose={handleDiscardWorkout}
      />
    </>
  );
}
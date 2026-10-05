"use client";

import { useEffect, useState } from "react";

interface PRSummary {
  exerciseName: string;
  weight: number;
  previousWeight?: number;
}

interface PRModalProps {
  isOpen: boolean;
  newPRs: PRSummary[];
  onClose: () => void;
}

export const PRModal = ({ isOpen, newPRs, onClose }: PRModalProps) => {
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0 transition-opacity duration-200 ease-out backdrop-blur-sm ${visible ? "opacity-100" : "opacity-0"
        }`}
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pr-modal-title"
        className={`w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center shadow-2xl transition-all duration-200 ease-out transform ${visible
            ? "scale-100 translate-y-0 opacity-100"
            : "scale-95 translate-y-2 opacity-0"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-2xl">
          🏆
        </div>

        <h2 id="pr-modal-title" className="text-xl font-bold text-zinc-100">
          {newPRs.length > 0 ? "New PRs Crushed!" : "Workout Complete!"}
        </h2>

        <p className="mt-1 text-xs text-zinc-400">
          {newPRs.length > 0
            ? "You set new personal records during this session:"
            : "Great consistency! Keep showing up."}
        </p>

        {newPRs.length > 0 && (
          <div className="my-4 max-h-48 space-y-2 overflow-y-auto">
            {newPRs.map((pr) => (
              <div
                key={pr.exerciseName}
                className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-2.5 text-left text-xs"
              >
                <span className="font-medium text-zinc-200">
                  {pr.exerciseName}
                </span>
                <span className="font-semibold text-amber-400">
                  {pr.weight} lbs
                  {pr.previousWeight && (
                    <span className="ml-1 text-[10px] text-zinc-500">
                      (+{(pr.weight - pr.previousWeight).toFixed(1)})
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-xl bg-zinc-100 py-2.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-white active:opacity-75"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
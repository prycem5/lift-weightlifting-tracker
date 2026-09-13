"use client";

import { useState, useEffect, useMemo } from "react";
import { readRequest } from "@/utils/api";
import { Exercise } from "@/types/liftEntities";
import { Search, X} from "lucide-react";

type SearchBarProps = {
    onSelectExercise: () => void;
};

export const SearchBar = ({ onSelectExercise }: SearchBarProps) => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [filtered, setFiltered] = useState<Exercise[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const loadExercises = async () => {
            setIsLoading(true);
            try {
                const data = await readRequest<Exercise[]>("exercise");
                setExercises(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error loading exercises:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadExercises();
    }, []);

    // Compute active filtered items dynamically on every input/filter change
    const filterExercises = (keyword: string) => {
        keyword = input.trim().toLowerCase();
        setFiltered(exercises.filter((exercise) => {
            return exercise.name.toLowerCase().includes(keyword);
        }));
    }

    return (
        <div className="relative w-full max-w-lg font-sans">
            {/* Search Input Box */}
            <div className="relative flex items-center w-full">
                <Search size={18} className="absolute left-3.5 text-zinc-400 pointer-events-none" />
                <input
                    id="search-input"
                    type="text"
                    value={input}
                    placeholder="Search exercises..."
                    onChange={(e) => {setInput(e.target.value); filterExercises(e.target.value)}}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors"
                    aria-label="Search Input"
                />
                {input && (
                    <button
                        type="button"
                        onClick={() => setInput("")}
                        className="absolute right-3 p-1 rounded-full text-zinc-400 hover:text-zinc-200 focus:outline-none"
                        aria-label="Clear search"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>


            {/* Results Dropdown */}
            {isFocused && (
                <div className=" z-50 mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-72 flex flex-col">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-6 gap-2 text-xs text-zinc-500">
                            <p>...</p>
                        </div>
                    ) : filtered.length > 0 ? (
                        <ul className="divide-y divide-zinc-800/60 overflow-y-auto">
                            {filtered.map((exercise) => (
                                <li
                                    key={exercise.entityId || exercise.SK || exercise.name}
                                    className="p-3 hover:bg-zinc-800/50 cursor-pointer transition-colors text-left"
                                    onClick={() => {onSelectExercise(); setInput(""); setIsFocused(false)}}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-medium text-zinc-100">
                                            {exercise.name}
                                            {exercise.equipmentType && (
                                                <span className="text-xs font-normal text-zinc-400 ml-1.5">
                                                    ({exercise.equipmentType})
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <p className="text-[11px] uppercase tracking-wider text-zinc-500 mt-0.5">
                                        {exercise.muscleGroup}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-5 text-center text-xs text-zinc-500">
                            No matching exercises found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
import Dexie ,{ type EntityTable } from "dexie";
import { Workout, Set } from "@/types/liftEntities";

export interface ActiveWorkout extends Workout{
    localId: string;
}

export interface ActiveSet extends Set {
    localId?: number;
}

export const db = new Dexie("LiftCache") as Dexie & { /* creates local, non
    blocking db to handle in progress workouts in the case a user accidentally
    refreshes/closes the app mid workout.*/
    activeWorkout: EntityTable<ActiveWorkout, "localId">;
    activeSets: EntityTable<ActiveSet, "localId">;
}

db.version(1).stores({
    activeWorkout: "&localId",
    activeSets: "++localId, workoutId, exerciseId"
})

import { db, ActiveWorkout, ActiveSet } from "@/utils/db";

// Save or update active workout metadata
export const saveActiveWorkout = async (data: ActiveWorkout): Promise<void> => {
  await db.activeWorkout.put(data);
};

// Retrieve current in-progress workout session
export const getActiveWorkout = async (): Promise<ActiveWorkout | undefined> => {
  return await db.activeWorkout.get("active-session");
};

// Add a set performed during the active workout
export const saveActiveSet = async (setData: Omit<ActiveSet, "localId">): Promise<number | undefined> => {
  return await db.activeSets.add(setData);
};

// Retrieve all sets logged for the current workout
export const getActiveSets = async (workoutId: string): Promise<ActiveSet[]> => {
  return await db.activeSets.where("workoutId").equals(workoutId).toArray();
};

// Clear cached session after syncing to DynamoDB via API Gateway or canceling
export const clearActiveSession = async (): Promise<void> => {
  await db.transaction("rw", [db.activeWorkout, db.activeSets], async () => {
    await db.activeWorkout.clear();
    await db.activeSets.clear();
  });
}
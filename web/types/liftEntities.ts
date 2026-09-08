interface LiftEntity {
    entityType: string;
    PK: string;
    SK: string;
}

export interface Workout extends LiftEntity {
    entityType: "workout";

    timestamp: string;
    duration: number;

}

export interface Exercise extends LiftEntity {
    entityType: "exercise";
    muscleGroup: string;
    entityId: string;
    name: string;
    equipmentType: string;
};

export interface Set extends LiftEntity {
    entityType: "set";
    workoutId: string;

    exerciseId: string;
    reps: number;
    weight: number;

}

export interface PR extends LiftEntity {
    entityType: "pr";
    exerciseId: string;

    weight: number;

}

export interface User extends LiftEntity {
    entityType: "user";
    email: string;
    username: string;
    metricSystem: boolean;
    darkMode: boolean;

}
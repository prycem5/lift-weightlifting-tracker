interface LiftEntity {
    PK: string;
    SK: string;
}

export interface Workout extends LiftEntity {
    timestamp: string;
    duration: number;
}

export interface Exercise extends LiftEntity {
    entityType: "exercise";
    muscleGroup: string;
    entityId: string;
    name: string;
    equipmentType: string;
}

export interface Set extends LiftEntity {
    exerciseId: string;
    setIndex: number;
    reps: number;
    weight: number;
}

export interface PR extends LiftEntity {
    exerciseId: string;
    weight: number;
}

export interface User extends LiftEntity {
    email: string;
    username: string;
    metricSystem: boolean;
    darkMode: boolean;
}
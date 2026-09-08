"use client";

import { fetchAuthSession } from "aws-amplify/auth";

interface payload {
    attributes: Record<string, any>;
    entityType?: string;
    muscleGroup?: string;
    workoutId?: string;
    exerciseId?: string;
}

export const readRequest = async <T>(resource: string): Promise<T> => { // retrieves entity data from api.
    let idToken;
    try {
        const session = await fetchAuthSession();
        idToken = session?.tokens?.idToken?.toString();
        if (!idToken) {
            throw new Error("No ID token. User may be logged out.");
        }
    } catch (error) {
        throw new Error(`Error fetching auth session: ${error}`);
    }

    const url = `${process.env.NEXT_PUBLIC_LIFT_ENDPOINT}${resource}`;
    const headers = {
        "Content-Type": "application/json",
        "Authorization": idToken,
    };

    let data;
    try {
        data = await fetch(url, {
            method: "GET",
            headers: headers,
        });
        if (!data.ok) {
            throw new Error(`HTTP error! status: ${data.status}`);
        }
    } catch (error) {
        throw new Error(`Error fetching data from API: ${error}`);
    }
    return data.json();

}

export const createRequest = async <T>(resource: string, body: payload): Promise<T> => { // sends entity data to api.
    let idToken;
    try {
        const session = await fetchAuthSession();
        idToken = session?.tokens?.idToken?.toString();
        if (!idToken) {
            throw new Error("No ID token. User may be logged out.");
        }
    } catch (error) {
        throw new Error(`Error fetching auth session: ${error}`);
    }

    const url = `${process.env.NEXT_PUBLIC_LIFT_ENDPOINT}${resource}`;
    const headers = {
        "Content-Type": "application/json",
        "Authorization": idToken,
    };

    let data;
    try {
        data = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body),
        });
        if (!data.ok) {
            throw new Error(`HTTP error! status: ${data.status}`);
        }
    } catch (error) {
        throw new Error(`Error creating entity: ${error}`);
    }
    return data.json();
}

export const updateRequest = async <T>(resource: string, body: payload): Promise<T> => { // updates entity data in api.
    let idToken;
    try {
        const session = await fetchAuthSession();
        idToken = session?.tokens?.idToken?.toString();
        if (!idToken) {
            throw new Error("No ID token. User may be logged out.");
        }
    } catch (error) {
        throw new Error(`Error fetching auth session: ${error}`);
    }

    const url = `${process.env.NEXT_PUBLIC_LIFT_ENDPOINT}${resource}`;
    const headers = {
        "Content-Type": "application/json",
        "Authorization": idToken,
    };

    let data;
    try {
        data = await fetch(url, {
            method: "PUT",
            headers: headers,
            body: JSON.stringify(body),
        });
        if (!data.ok) {
            throw new Error(`HTTP error! status: ${data.status}`);
        }
    } catch (error) {
        throw new Error(`Error updating entity: ${error}`);
    }
    return data.json();
}

export const deleteRequest = async (resource: string): Promise<boolean> => { // deletes entity data from api.
    let idToken;
    try {
        const session = await fetchAuthSession();
        idToken = session?.tokens?.idToken?.toString();
        if (!idToken) {
            throw new Error("No ID token. User may be logged out.");
        }
    } catch (error) {
        throw new Error(`Error fetching auth session: ${error}`);
    }

    const url = `${process.env.NEXT_PUBLIC_LIFT_ENDPOINT}${resource}`;
    const headers = {
        "Content-Type": "application/json",
        "Authorization": idToken,
    };

    let data;
    try {
        data = await fetch(url, {
            method: "DELETE",
            headers: headers,
        });
        if (!data.ok) {
            throw new Error(`HTTP error! status: ${data.status}`);
        }
    } catch (error) {
        throw new Error(`Error deleting entity: ${error}`);
    }
    return true;
}
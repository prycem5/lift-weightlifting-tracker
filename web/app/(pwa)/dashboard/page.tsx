"use client";

import { PwaGate } from "@/components/pwaGate";
import { signOut } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { BottomNavBar } from "@/components/themed/bottomNav";
import { ExerciseListTester } from "@/components/exerciseListTester";

export default function Dashboard() {
    const router = useRouter();
    const handleSignOut = async () => {
        try {
            await signOut();
            router.push("/login");
        } catch (error) {
            if (error instanceof Error) {
                console.log("Error signing out: " + error.message);
            }
        }
    }

    return (
        <>
            <PwaGate/>
            <div className="min-h-screen pb-2 flex flex-col justify-between">
                <div>
                    <h1 className="text-5xl font-bold">Dashboard Page</h1>
                    <button onClick={() => handleSignOut()} className="hover:underline text-sm text-white">
                        Sign Out
                    </button>
                    <ExerciseListTester/>

                </div>

                <BottomNavBar/>
            </div>
        </>
    );
}
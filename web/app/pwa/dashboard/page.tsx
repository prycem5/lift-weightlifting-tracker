"use client";

import { PwaGate } from "@/app/components/pwaGate";
import { signOut } from "aws-amplify/auth";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const router = useRouter();
    const handleSignOut = async () => {
        try {
            await signOut();
            router.push("/pwa/login");
        } catch (error) {
            if (error instanceof Error) {
                console.log("Error signing out: " + error.message);
            }
        }
    }

  return (
    <>
      <PwaGate />
      <div className="min-h-screen pb-2">
          <h1 className="text-5xl font-bold">Dashboard Page</h1>
          <button onClick={() => handleSignOut()} className="hover:underline text-sm text-white">Sign Out</button>
      </div>
    </>

  );
}
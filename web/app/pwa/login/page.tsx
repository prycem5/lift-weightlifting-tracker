"use client";

import { PwaGate } from "@/app/components/pwaGate";

export default function LoginPage() {
  return (
    <>
    <PwaGate/>
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold">Login Page</h1>
      <p className="mt-4 text-lg">This is the login page for the PWA.</p>
    </div>
    </>
    
  );
}
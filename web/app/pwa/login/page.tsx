"use client";

import { PwaGate } from "@/app/components/pwaGate";
import { LoginForm } from "@/app/components/loginForm";

export default function LoginPage() {
  return (
    <>
      <PwaGate />
      <div className="flex flex-col items-center justify-center min-h-screen pb-2">
        <div className="flex flex-col items-center justify-center pb-5">
          <div className="rounded-md bg-black w-60 h-50 mb-5"></div>
          <h1 className="text-5xl font-bold">LIFT</h1>
          <p className="mt-4 text-lg">Let's get to work.</p>
        </div>
        <LoginForm />
      </div>
    </>

  );
}
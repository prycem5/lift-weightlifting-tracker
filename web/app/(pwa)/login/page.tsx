"use client";

import { PwaGate } from "@/components/pwaGate";
import { LoginForm } from "@/components/loginForm";
import Image from "next/image";


export default function LoginPage() {
  return (
    <>
      <PwaGate />
      <div className="flex flex-col items-center justify-center min-h-screen pb-2">
        <div className="flex flex-col items-center justify-center pb-5">
          <div className="relative h-50 w-50">
            <Image src="/icon.png" alt="LIFT Logo" fill className="object-contain" priority />
          </div>
          <p className="mt-4 text-lg">Let's get to work.</p>
        </div>
        <LoginForm />
      </div>
    </>

  );
}
"use client";

import { useEffect, useState } from "react";
import { PwaGate } from "@/components/pwaGate";
import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";

type OS = "iPhone" | "Android";

const installGuides = {
  iPhone: [
    "Open Safari and navigate to this page.",
    "Tap the share icon.",
    "Choose 'Add to Home Screen'.",
    "Confirm to install LIFT.",
  ],
  Android: [
    "Open Chrome and navigate to this page.",
    "Tap the menu icon.",
    "Choose 'Add to Home Screen'.",
    "Confirm to install LIFT.",
  ],
};

const getGuide = (os: OS) => {
  return installGuides[os];
};

export default function Home() {
  const [osType, setOsType] = useState<OS>("Android");

  useEffect(() => {
    // device detection runs after hydration because navigator is only available in the
    // browser. unknown platforms use the android instructions as the fallback.
    if (typeof navigator !== "undefined") {
      const platform = navigator.userAgent.toLowerCase();
      setOsType(platform.includes("iphone") ? "iPhone" : "Android");
    }
  }, []);

  return (
    <>
      <PwaGate />
      <div className="min-h-screen bg-black text-white">
        <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-10">
          <section className="md:hidden flex flex-col h-screen items-center gap-6 rounded-[2rem] border border-zinc-800 bg-zinc-950 p-8">
             <div className="relative h-70 w-70">
                        <Image src="/icon.png" alt="LIFT Logo" fill className="object-contain" priority />
                      </div>
            <p className="max-w-md text-sm leading-7 text-zinc-400 pb-10">
              Track your sets easily across your mobile devices.
            </p>
            <div className="w-full rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
              <p className="text-sm font-semibold text-blue-300">
                Install on {osType}
              </p>
              <ol className="mt-4 space-y-5 list-decimal list-inside text-xl leading-6 text-zinc-400 gap-2">
                {getGuide(osType).map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          </section>

          <section className="hidden md:flex rounded-[2rem] border border-zinc-800 bg-zinc-950 p-8 border-l pl-10 pr-8 rounded-[2.5rem] w-full items-center justify-center">
            <div className="flex flex-col justify-center gap-6">
              <div className="flex flex-col items-center gap-4 justify-center">
                <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl">
                  LIFT LIVES ON YOUR PHONE.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-zinc-400 text-center">
                  LIFT is intended for mobile devices, please use your phone to
                  add it to your home screen.
                </p>
              </div>
              <div className="mt-8 flex flex-col items-center gap-4 rounded-3xl border border-zinc-800 bg-black p-8">
                <div className="p-4 rounded-2xl bg-white shadow-xl">
                  <QRCodeSVG
                    value={process.env.NEXT_PUBLIC_APP_URL || "https://your-lift-domain.com"}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#09090b"
                    level="M"
                  />
                </div>
                <p className="text-sm leading-6 text-zinc-400 text-center">
                  Scan the QR code to add LIFT to your mobile home screen.
                </p>
              </div>
              <hr className="border-zinc-800"></hr>
              <div className="flex flex-row w-full justify-center items-center gap-8">
                <p className="text-sm leading-6 text-zinc-400">
                  <b>Track sets and reps</b> across <br />
                  your mobile devices with ease.
                </p>

                <p className="text-sm leading-6 text-zinc-400">
                  <b>Personal records</b> <br />
                  saved automatically.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

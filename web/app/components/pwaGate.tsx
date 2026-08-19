"use client";

/*
requires: userRouter from next/navigation, window
basic structure:
1. extract isStandalone, isFullscreen, isMinimalUI using window.matchMedia.
e.g. const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
2. check if app is launched from the variables (if so, one should return true). 
3. if not, use redirect to send user back to root "/" page using redirect.
*/

import { fetchAuthSession } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const isAuthenticated = async () => {
    try {
        const session = await fetchAuthSession();
        return Boolean(session?.tokens?.accessToken);
    } catch (error) {
        console.error("Error fetching auth session:", error);
        return false;
    }
}


export const PwaGate = () => {
    const router = useRouter();

    useEffect(() => {
        if (typeof window === "undefined") { return; }

        const isStandalone: boolean = window.matchMedia('(display-mode: standalone)').matches;
        const isFullscreen: boolean = window.matchMedia('(display-mode: fullscreen)').matches;
        const isMinimalUI: boolean = window.matchMedia('(display-mode: minimal-ui)').matches;
        const isPWA = isStandalone || isFullscreen || isMinimalUI;
        console.log({ isStandalone, isFullscreen, isMinimalUI, isPWA });

        const checkAuth = async () => {
            const result = await isAuthenticated();
            const onLoginPage = window.location.pathname === "/pwa/login";
            if (!isPWA) {
                router.push("/");
                console.log("App is not running in PWA mode. Redirecting to /");
                return;
            }
            if (result) {
                if (onLoginPage) {
                    router.push("/pwa/dashboard");
                }
            } else {
                if (!onLoginPage) {
                    router.push("/pwa/login");
                    console.log("User is not authenticated. Redirecting to /pwa/login");
                }
            }
        }
        checkAuth();
    }, [router]);

    return null;
}


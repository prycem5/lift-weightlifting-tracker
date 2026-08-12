"use client";

import { Amplify } from "aws-amplify";

export const ConfigAmplify = () => {
    Amplify.configure({
        Auth: {
            Cognito: {
                userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || "",
                userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || "",
            }
        }
    });

    return null;
}
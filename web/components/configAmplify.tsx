"use client";

import { Amplify } from "aws-amplify";

export const ConfigAmplify = () => {
    // configure amplify once from the cdk outputs exposed as public next.js variables;
    // auth calls elsewhere in the client then share this cognito configuration.
    Amplify.configure({
        Auth: {
            Cognito: {
                userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || "",
                userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || "",
            }
        },
        API: {
            REST: {
                liftAPI: {
                    endpoint: process.env.NEXT_PUBLIC_LIFT_ENDPOINT || "",
                    region: process.env.NEXT_PUBLIC_REGION || "",
                }
            }
        }

    });

    return null;
}
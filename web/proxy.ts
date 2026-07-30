/* middleware to handle auth past the login/splash screen.
basic pattern:
1. using aws amplify auth's fetchAuthSession(), retrieve token and assign to "session" var. 
2. if error is thrown, or !session, use next server's NextResponse.redirect() to redirect back to app/page.tsx
3. otherwise, NextResponse.next() 

note: function parameters will expect next server's NextRequest
*/

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Amplify } from "aws-amplify";
import { fetchAuthSession } from "aws-amplify/auth";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || "",
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || "",
    },
  },
});

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") { return NextResponse.next(); }

  try {
    const session = await fetchAuthSession();
    const hasAccessToken = Boolean(session?.tokens?.accessToken);

    if (!hasAccessToken) { return NextResponse.redirect(new URL("/", request.url)); }

    return NextResponse.next();
  } catch (err) {
    if (err instanceof Error) { console.log(err.message); } else { console.log("Unexpected error.", err) }
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = { /* excludes static files and includes any page routes or api calls. will be further filtered within function to target pages past the splash/login screen.*/
matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)","/((?:^/|.*\\.)api/*)"]
};
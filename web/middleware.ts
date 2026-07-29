/* middleware to handle auth past the login/splash screen.
basic pattern:
1. using aws amplify auth's fetchAuthSession(), retrieve token and assign to "session" var. 
2. if error is thrown, or !session, use next server's NextResponse.redirect() to redirect back to app/page.tsx
3. otherwise, NextResponse.next() 

note: function parameters will expect next server's NextRequest
*/

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { fetchAuthSession } from "aws-amplify/auth";

export default async (request: NextRequest) => { /* to be implemented. */
    return null;
}

export const config = { /* excludes static files and includes any page routes or api calls. will be further filtered within function to target pages past the splash/login screen.*/
matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)","/((?:^/|.*\\.)api/*)"]
};
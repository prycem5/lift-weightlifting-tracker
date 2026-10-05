# Frontend (`web/`)
 
## Stack
 
| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, lucide-react icons, Geist fonts |
| Auth client | `aws-amplify` v6 (`aws-amplify/auth` only) |
| Local persistence | Dexie 4 (IndexedDB) |
| Hosting | Vercel |
| Testing / lint | Jest + ts-jest, ESLint 9 |
 
## Routing and the PWA gate
 
The app deliberately only runs as an **installed** PWA. Route groups express this:
 
| Route | Group | Purpose |
|---|---|---|
| `/` | `(public)` | Landing page with platform-specific install instructions (QR code via `qrcode.react`). |
| `/login` | `(pwa)` | Sign in, sign up, email confirmation, password reset. |
| `/dashboard` | `(pwa)` | Workout tracking, history, PRs, profile. |
 
`components/pwaGate.tsx` runs on the `(pwa)` pages and decides where the user belongs:
 
1. Detect install state with `matchMedia` for `display-mode: standalone | fullscreen | minimal-ui`.
2. **Not installed:** redirect everything to `/`.
3. **Installed + signed in:** `/` and `/login` redirect to `/dashboard`.
4. **Installed + signed out:** anything else redirects to `/login`.
`public/manifest.json` sets `display: standalone` and `start_url: /dashboard`, so a home-screen launch lands directly in the app. The viewport is locked (`userScalable: false`) for a native-app feel.
 
> The gate is a UX control, not a security boundary. Real access control is enforced by API Gateway and the Lambda handlers (see backend).
 
## Authentication
 
- `components/configAmplify.tsx` is mounted once in the root layout and configures Amplify with the Cognito user pool ID, client ID, and API endpoint from `NEXT_PUBLIC_*` variables (the CDK stack outputs map directly to these).
- `components/loginForm.tsx` is a small state machine (`buttonType`) over Cognito's `nextStep` results: sign in → confirm sign-up → reset password → confirm reset, plus sign-up with `autoSignIn`.
- `utils/api.ts` is the only REST client. Each call (`readRequest`, `createRequest`, `updateRequest`, `deleteRequest`) fetches the current Amplify session and sends the **ID token** as `Authorization: Bearer <token>` to `NEXT_PUBLIC_LIFT_ENDPOINT/<resource>`.
### Data types
 
`types/liftEntities.ts` mirrors the DynamoDB item shapes (`User`, `Workout`, `Exercise`, `Set`, `PR`), all extending `{ PK, SK }`. The frontend works with the raw key attributes (for example, it strips the `workout#` prefix from `SK` to derive a timestamp).
 
## Local persistence (Dexie)
 
`utils/db.ts` defines an IndexedDB database `LiftCache` with two tables:
 
| Table | Key | Contents |
|---|---|---|
| `activeWorkout` | `&localId` (`"active-session"`) | Metadata for the in-progress workout |
| `activeSets` | `++localId`, index on `exerciseId` | Sets logged so far, plus `exerciseName` for display |
 
`utils/cache.ts` wraps it (`saveActiveWorkout`, `saveActiveSet`, `updateActiveSet`, `deleteActiveSet`, `clearActiveSession`, ...). Every set is written to Dexie *as it is logged*, so an accidental refresh, app close, background suspension, or device restart does not lose the workout. On dashboard mount the app checks Dexie; if a session exists it offers to **resume or discard** it.
 
Dexie is intentionally scoped to the *active* workout only. Completed data lives in DynamoDB and is fetched on demand (see [Roadmap](#roadmap) for offline sync).
 
## UI composition
 
The dashboard is a single client-rendered page with bottom-tab navigation (`bottomNav`). Primary building blocks in `components/themed/`:
 
- `activeWorkoutSheet`: live workout: timer, exercise groups, set entry, finish/cancel, sync to API.
- `searchBar`: exercise search over the catalog fetched from `GET /exercise`.
- `workoutHistorySheet`: past workout and set detail.
- `prModal`: summary of PRs broken in the workout just finished.
- `confirmModal`: shared confirmation dialog (finish, cancel, resume).
Dashboard state is local React state loaded on mount: exercises, workouts, PR count, and weekly stats (workout count and volume = Σ reps × weight over the last 7 days, computed client-side).

# LIFT — Resistance Training & Workout Tracker

LIFT is a mobile-first Progressive Web App (PWA) engineered for logging resistance training sessions, sets, repetitions, and personal records.

The application enforces an installed mobile environment: standard desktop and mobile browser sessions land on an onboarding splash page with platform-specific installation instructions and a dynamic QR code. Once installed to a mobile home screen, the application unlocks the full tracking dashboard. Active workouts are buffered locally via IndexedDB (Dexie.js) to protect against data loss from accidental browser refreshes, background suspensions, or device restarts before persisting to AWS.

---

## Architecture Overview

The repository is structured as a monorepo consisting of two primary packages:

```text
.
├── infra/                  # Serverless AWS CDK infrastructure (TypeScript)
│   ├── bin/infra.ts        # CDK application entry point
│   ├── lib/infra-stack.ts  # DynamoDB, Cognito, Lambda, and API Gateway resources
│   └── README.md           # Backend data models, triggers, and architecture details
│
└── web/                    # Next.js (App Router) mobile Progressive Web App
    ├── app/
    │   ├── (public)/       # Browser splash page, install instructions & QR code
    │   └── (pwa)/          # PWA-gated views (Login, Tabbed Dashboard)
    ├── components/         # Modals, workout sheet, search, and navigation
    ├── types/              # TypeScript entities (User, Workout, Exercise, Set, PR)
    ├── utils/api.ts        # Authenticated REST API client
    ├── utils/cache.ts      # IndexedDB / Dexie offline storage
    └── README.md           # Frontend setup, PWA config, and v1.1 design decisions
```
## Configuration
 
**Backend (`infra/.env.local`)**
 
| Variable | Used by | Purpose |
|---|---|---|
| `PRODUCTION_DOMAIN` | CDK, Lambdas | Allowed CORS origin for the deployed frontend |
| `ADMIN_ID` | Lambdas (not yet wired in CDK) | Cognito `sub` of the admin allowed to manage exercises |
| `CDK_DEFAULT_REGION` / `CDK_DEFAULT_ACCOUNT` | CDK, seed script | Target environment |

**Frontend (`web/.env.local` / Vercel environment variables)**
 
| Variable | Source |
|---|---|
| `NEXT_PUBLIC_USER_POOL_ID` | CDK output `UserPoolId` |
| `NEXT_PUBLIC_USER_POOL_CLIENT_ID` | CDK output `UserPoolClientId` |
| `NEXT_PUBLIC_LIFT_ENDPOINT` | CDK output `ApiUrl` |
| `NEXT_PUBLIC_REGION` | AWS region of the stack |

Note the PWA gate redirects non-installed browsers to `/`, so test the dashboard in an installed or standalone display mode.


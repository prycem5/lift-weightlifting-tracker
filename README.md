# LIFT

LIFT is a mobile-first Progressive Web App (PWA) built for tracking resistance training workouts, sets, repetitions, and personal records.

The application enforces an installed mobile environment. Standard desktop and mobile browser sessions are directed to an onboarding landing page with platform-specific installation instructions. Once installed to a device's home screen, the application unlocks the full tracking dashboard. Active workouts are buffered locally via IndexedDB (Dexie.js) to protect against data loss from accidental browser refreshes, background suspensions, or device restarts before persisting to the cloud.

---

## Architecture Overview

The repository is organized as a monorepo consisting of two primary packages:

```text
.
├── infra/                  # Serverless AWS CDK infrastructure (TypeScript)
│   ├── bin/infra.ts        # CDK application entry point
│   ├── lib/infra-stack.ts  # DynamoDB, Cognito, Lambda, and API Gateway resources
│   └── README.md           # Backend data models, triggers, and architecture details
│
└── web/                    # Next.js (App Router) mobile Progressive Web App
    ├── app/
    │   ├── (public)/       # Browser splash page and installation guide
    │   └── (pwa)/          # PWA-gated views (Login, Dashboard)
    ├── components/         # Auth forms, workout navigation bar, and modals
    ├── types/              # TypeScript entities (User, Workout, Exercise, Set, PR)
    └── utils/api.ts        # Authenticated REST API client
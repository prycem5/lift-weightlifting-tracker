# Stack Overview

| Service | Role |
|---|---|
| AWS DynamoDB | NoSQL database |
| AWS Lambda | Serverless CRUD functions and Cognito triggers |
| AWS Cognito | Authentication and user management |
| AWS API Gateway | REST API and request authorization |
| AWS CDK | Infrastructure as code (`infra-stack.ts`) |

---

## DynamoDB

A single table (`liftEntities`) stores all entities using a **composite key design**. Partition key allows multiple entity types (users, workouts, sets, exercises) to coexist in one table without a rigid schema.

**User entity key design:**
The `user` entity is a special case within the schema. Since exactly one `user` item can ever exist under a given `PK` (the Cognito `sub`), its `SK` is simply the fixed string `"user"`, not a generated UUID. This avoids a bootstrapping problem (there's no HTTP response path for a server side Cognito trigger to hand a client generated UUID back to the frontend) and keeps the item self documenting, since `SK` alone tells you what kind of entity it is.

**Why DynamoDB:**
- NoSQL's flexible schema avoids costly restructuring as new entity types are introduced (e.g. user-generated exercises planned post-MVP).
- `PAY_PER_REQUEST` billing scales cost directly with usage, making it appropriate for a variable, early-stage workload.
- Pairs naturally with Lambda in a fully serverless architecture, keeping operational overhead low.

---

## Lambda

Six functions handle data operations and the Cognito auth lifecycle, each scoped to a single responsibility and granted only the IAM permissions it needs:

| Function | Trigger | DynamoDB Permission |
|---|---|---|
| `getEntity` | API Gateway GET | Read |
| `createEntity` | API Gateway POST | Write |
| `updateEntity` | API Gateway PUT | Read + Write |
| `deleteEntity` | API Gateway DELETE | Read + Write |
| `postConfirmation` | Cognito Post Confirmation | Write |
| `preToken` | Cognito Pre Token Generation | Read + Write |

`getEntity`, `updateEntity`, and `deleteEntity` all special case `entityType === "user"`, since the user entity has no path parameter, no UUID, and no mass retrieval concept the way `workout`/`set`/`exercise` do. `deleteEntity` deliberately excludes `"user"` from its allow list entirely. Account deletion is out of scope for MVP (see Future Considerations).

Each function receives the `TABLE_NAME` via environment variable. `createEntity`, `updateEntity`, and `deleteEntity` additionally receive an `ADMIN_ID`, used to gate exercise creation and modification to admin users. General users cannot create or modify exercises in the current MVP.

**Why Lambda:**
- Serverless functions eliminate the need to manage or provision infrastructure for what are otherwise simple, stateless queries.
- Per-invocation pricing is cost-effective at this scale.
- Least-privilege IAM grants per function reduce the blast radius of any potential misuse.

---

## Cognito

Handles the full authentication lifecycle: account creation, email verification, sign-in, and token issuance (via a `liftUserPool`).

**Configuration:**
- Sign-in via email with self sign-up enabled.
- Automatic email verification on registration.
- Password policy enforcing minimum length, mixed case, and digits.
- Auth flow uses **Secure Remote Password (SRP)**, meaning passwords are never transmitted over the network during authentication.

**Why Cognito:**
- Offloads the full auth flow (OTP, verification, token management) that would otherwise require significant custom backend work.
- Scales to handle user growth without configuration changes.
- Integrates directly with API Gateway as a user pool authorizer.

### Cognito Triggers

Two Lambda triggers, wired via `userPool.addTrigger(...)`, keep DynamoDB in sync with the Cognito user lifecycle:

**`postConfirmation`** runs once, right after a user confirms their account. It creates the corresponding `user` item in DynamoDB (`PK = sub`, `SK = "user"`), with default attributes (`metricSystem: false`, `darkMode: false`). The write uses `ConditionExpression: "attribute_not_exists(SK)"` to stay idempotent, since Cognito retries a trigger up to three times if it doesn't get a timely response. On a `ConditionalCheckFailedException`, the handler treats the retry as a harmless no-op. Any other error is rethrown, forcing Cognito to retry, since the `user` item is a hard dependency for nearly every other operation in the app and a missing one should not be allowed to pass silently.

**`preToken`** runs on every token issuance (login and refresh) and reconciles the user's email between Cognito and DynamoDB, in case it was changed on the Cognito side. Unlike `postConfirmation`, this trigger fails open: any error is caught and logged rather than thrown, since this is a best effort reconciliation and should never block a user from getting a token.

---

## API Gateway

A REST API (`liftAPI`) exposes Lambda functions to the frontend and enforces authorization on every endpoint via a **Cognito User Pool Authorizer**.

**Endpoint structure** (mirrors the data schema):

```
/user
/workout
  /{workoutId}
/set
  /{setId}
/exercise
  /{exerciseId}
```

Collection endpoints (`/user`, `/workout`, `/set`, `/exercise`) support `GET` and `POST`. Individual resource endpoints (`/workout/{workoutId}`, `/set/{setId}`, `/exercise/{exerciseId}`) support `GET`, `PUT`, and `DELETE`. `/user` intentionally has no `{userId}` sub resource, since `PK` and `SK` for a user item are always derived from the caller's own auth claims, never from a client supplied path parameter.

**Authorization:**
- Every method requires a valid Cognito ID token to prevent unregistered users from accessing the API.
- CORS is currently open (`ALL_ORIGINS`) and is flagged for tightening to the frontend domain before production.

**Why API Gateway:**
- Provides the bridge between the Next.js frontend and Lambda, without requiring a persistent server.
- Native Cognito authorizer integration means auth is enforced at the gateway layer before any Lambda function executes.

---

## Future Considerations

- **Account deletion:** Cognito has no native trigger for user deletion. Full account removal will require a dedicated orchestration Lambda calling `AdminDeleteUser` alongside a cascade delete of the user's `workout`/`set` items, likely a Step Function or similar rather than a simple CRUD extension. Deferred until after MVP.
- **S3:** evaluated for equipment icons (dumbbell, barbell, kettlebell, cable) but deferred in favor of bundling a small, fixed set of static images in the frontend. The image set is small and rarely changes, so the added infrastructure wasn't worth the cost or setup time at this scale. Object storage will be picked up on a separate freelance project with a genuinely dynamic asset use case.
- **CI/CD:** deferred for the same reason. As a solo developer with no team to coordinate deploys with, a manually run `cdk deploy` carries little risk at this stage, and setting up a pipeline now would add limited learning value without a team or release cadence to justify it.
- **User-generated exercises:** currently, exercises are admin created only. A future resource (`/user/exercise` or similar) is anticipated.
- **CORS:** `allowOrigins` must be restricted to the production frontend domain before deployment.
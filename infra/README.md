# Stack Overview

| Service | Role |
|---|---|
| AWS DynamoDB | NoSQL database |
| AWS Lambda | Serverless CRUD functions |
| AWS Cognito | Authentication & user management |
| AWS API Gateway | REST API & request authorization |
| AWS CDK | Infrastructure as code (`infra-stack.ts`) |

---

## DynamoDB

A single table (`liftEntities`) stores all entities using a **composite key design**. Partition key allows multiple entity types (users, workouts, sets, exercises) to coexist in one table without a rigid schema.

**Why DynamoDB:**
- NoSQL's flexible schema avoids costly restructuring as new entity types are introduced (e.g. user-generated exercises planned post-MVP).
- `PAY_PER_REQUEST` billing scales cost directly with usage, making it appropriate for a variable, early-stage workload.
- Pairs naturally with Lambda in a fully serverless architecture, keeping operational overhead low.

---

## Lambda

Four functions handle all data operations, each scoped to a single responsibility and granted only the IAM permissions it needs:

| Function | Methods | DynamoDB Permission |
|---|---|---|
| `getEntity` | GET | Read |
| `createEntity` | POST | Write |
| `updateEntity` | PUT | Read + Write |
| `deleteEntity` | DELETE | Write |

Each function receives the `TABLE_NAME` via environment variable. `createEntity` additionally receives an `ADMIN_ID`, used to gate exercise creation to admin users. General users cannot create exercises in the current MVP.

**Why Lambda:**
- Serverless functions eliminate the need to manage or provision infrastructure for what are otherwise simple, stateless queries.
- Per-invocation pricing is cost-effective at this scale.
- Least-privilege IAM grants per function reduce the blast radius of any potential misuse.

---

## Cognito

Handles the full authentication lifecycle: account creation, email verification, and sign-in (via a `liftUserPool`).

**Configuration:**
- Sign-in via email with self sign-up enabled.
- Automatic email verification on registration.
- Password policy enforcing minimum length, mixed case, and digits.
- Auth flow uses **Secure Remote Password (SRP)**, meaning passwords are never transmitted over the network during authentication.

**Why Cognito:**
- Offloads the full auth flow (OTP, verification, token management) that would otherwise require significant custom backend work.
- Scales to handle user growth without configuration changes.
- Integrates directly with API Gateway as a user pool authorizer.

---

## API Gateway

A REST API (`liftAPI`) exposes Lambda functions to the frontend and enforces authorization on every endpoint via a **Cognito User Pool Authorizer**.

**Endpoint structure** (mirrors the data schema):

```
/users
  /{userId}
    /workouts
      /{workoutId}
        /sets
          /{setId}
/exercises
  /{exerciseId}
```

Collection endpoints (`/users`, `/workouts`, `/sets`, `/exercises`) support `GET` and `POST`. Individual resource endpoints support `GET`, `PUT`, and `DELETE`.

**Authorization:**
- Every method requires a valid Cognito ID token to prevent unregistered users from accessing the api.
- CORS is currently open (`ALL_ORIGINS`) and is flagged for tightening to the frontend domain before production.

**Why API Gateway:**
- Provides the bridge between the Next.js frontend and Lambda, without requiring a persistent server.
- Native Cognito authorizer integration means auth is enforced at the gateway layer before any Lambda function executes.

---


## Future Considerations

- **S3:** may be introduced if image support is added beyond what the frontend handles.
- **User-generated exercises:** currently, exercises are admin-created only. A future resource (`/users/{userId}/exercises`) is anticipated. 
- **CORS:** `allowOrigins` must be restricted to the production frontend domain before deployment.
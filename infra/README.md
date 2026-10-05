# Backend / infrastructure (`infra/`)
 
Everything is defined in one CDK stack (`lib/infra-stack.ts`, stack name `InfraStack`) and is fully serverless.
 
| Service | Role |
|---|---|
| DynamoDB | Single-table storage for all entities |
| Lambda (Node.js 20) | CRUD handlers and Cognito triggers |
| Cognito | Sign-up, email verification, sign-in, token issuance |
| API Gateway (REST) | HTTP surface and request authorization |
| CDK | Infrastructure as code |
 
## DynamoDB: single table `liftEntities`
 
Billing mode is `PAY_PER_REQUEST`. Primary key is `PK` (string) + `SK` (string). User-owned items live in the user's partition (`PK` = Cognito `sub`); the shared exercise catalog lives in per-muscle-group partitions.
 
| Entity | PK | SK | Other attributes |
|---|---|---|---|
| `user` | Cognito `sub` | `user` (fixed) | `email`, `metricSystem`, `darkMode` |
| `workout` | `sub` | `workout#<ISO timestamp>` | `timestamp`, `duration` |
| `set` | `sub` | `workout#<timestamp>#set#<uuid>#<setIndex>` | `exerciseId`, `reps`, `weight` |
| `pr` | `sub` | `pr#<exercise uuid>` | `exerciseId`, `weight` |
| `exercise` | muscle group (e.g. `Chest`) | `exercise#<uuid>` | `entityType: "exercise"`, `entityId` (= `SK`), `name`, `equipmentType` |
 
**Global secondary index `liftEntitiesGSI`:** partition `entityType`, sort `entityId`, projecting all attributes. Only exercise items carry those attributes, so it is effectively a *sparse index* over the exercise catalog.
 
**Access patterns**
 
| Need | Query |
|---|---|
| Current user's profile | `GetItem(PK=sub, SK="user")` |
| All of a user's workouts | `Query PK=sub, begins_with(SK, "workout#")`, filtered to drop `#set#` items |
| Sets for one workout | `Query PK=sub, begins_with(SK, "workout#<ts>#set#")` |
| All of a user's PRs | `Query PK=sub, begins_with(SK, "pr#")` |
| Whole exercise catalog | GSI: `entityType = "exercise"` |
| One exercise by id | GSI: `entityId = "exercise#<uuid>"` (needed because the real `PK` is the muscle group) |
 
Because sets share the `workout#<ts>` prefix, a workout and all of its sets are co-located and ordered, at the cost of the workout collection query needing to filter out set items.
 
## Lambda functions
 
Six single-purpose functions, each granted only the table permissions it needs:
 
| Function | Invoked by | Table access | Notes |
|---|---|---|---|
| `getEntity` | `GET` on any resource | read | Single-item and collection reads; special-cases `user` and `exercise`. |
| `createEntity` | `POST` | write | Builds `PK`/`SK` per entity; uses `attribute_not_exists(SK)`. |
| `updateEntity` | `PUT` | read + write | Verifies the item exists in the caller's partition, then applies an allow-listed update. |
| `deleteEntity` | `DELETE` | read + write | `user` is not deletable (account deletion deferred). |
| `postConfirmation` | Cognito Post Confirmation | write | Creates the `user` item. |
| `preToken` | Cognito Pre Token Generation | read + write | Syncs email changes into DynamoDB. |
 
Shared behavior in the CRUD handlers:
 
- **Identity comes from the token, never the client.** The partition key is always `event.requestContext.authorizer.claims.sub`, so a caller can only address their own partition. This is what enforces ownership; the API accepts only the *ids within* the caller's partition.
- **One handler per verb.** The entity type is derived from the resource path (`event.resource.split('/')[1]`).
- **Attribute allow-lists** (`lambda/helpers/validateAttributes.js`) reject any attribute not explicitly writable, so clients cannot overwrite key fields (`PK`, `SK`, `entityType`, ...) or inject unknown schema. Workouts are create-only today; users can only change `metricSystem` and `darkMode`.
- **Admin-only exercises.** Creating, updating, and deleting `exercise` items requires `sub === ADMIN_ID`.
- **CORS:** handlers echo the request origin only if it equals `PRODUCTION_DOMAIN`, otherwise `http://localhost:3000`.
**Cognito triggers**
 
- `postConfirmation`: creates `{PK: sub, SK: "user", email, metricSystem: false, darkMode: false}` with `attribute_not_exists(SK)`. Cognito retries triggers, so the conditional write makes this idempotent; a `ConditionalCheckFailedException` is treated as success. **Any other error is rethrown** because the `user` item is a hard dependency for the app and a missing one should not pass silently (this *fails closed*).
- `preToken`: on every token issuance, compares the Cognito email with the stored one and updates DynamoDB if they differ. Every error is caught and logged: this is best-effort reconciliation that should never block sign-in (this *fails open*).
## Cognito
 
- User pool `liftUserPool`: email sign-in, self sign-up, auto-verified email, password policy (min 8, upper, lower, digit).
- App client enables `userSrp` and `userPassword` auth flows. The frontend uses Amplify's default SRP flow, in which the password is never sent over the network.
## API Gateway
 
REST API `liftAPI`, stage `prod`, with a **Cognito User Pool authorizer on every method**: unauthenticated requests are rejected before any Lambda runs. Default 4XX/5XX gateway responses carry CORS headers so browser clients can read errors.
 
| Resource | Methods |
|---|---|
| `/user` | `GET`, `POST`\*, `PUT` |
| `/workout`, `/set`, `/exercise`, `/pr` | `GET`, `POST` |
| `/workout/{workoutId}`, `/set/{setId}`, `/exercise/{exerciseId}`, `/pr/{prId}` | `GET`, `PUT`, `DELETE` |
 
\* `POST /user` is routed but `createEntity` rejects `user`; users are created only by the Cognito trigger. `/user` deliberately has no `{userId}` child: user keys come solely from the token.
 
Sets have a composite identity, so item-level `set` calls take query parameters in addition to the path id: `?workoutId=<workout#timestamp>&setIndex=<n>`.
 
`CfnOutput`s (`UserPoolId`, `UserPoolClientId`, `ApiUrl`) feed straight into the frontend's `NEXT_PUBLIC_*` variables.

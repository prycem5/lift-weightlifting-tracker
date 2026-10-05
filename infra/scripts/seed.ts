import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import dotenv from "dotenv";

dotenv.config({ path: "./.env.local" });

const client = new DynamoDBClient({
  region: process.env.CDK_DEFAULT_REGION
});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "liftEntities";

const exercises = [
  // Chest
  { name: "Barbell Bench Press", muscleGroup: "Chest", equipmentType: "Barbell" },
  { name: "Incline Dumbbell Press", muscleGroup: "Chest", equipmentType: "Dumbbell" },
  { name: "Cable Chest Fly", muscleGroup: "Chest", equipmentType: "Cable" },
  { name: "Dips", muscleGroup: "Chest", equipmentType: "Bodyweight" },
  { name: "Push-Ups", muscleGroup: "Chest", equipmentType: "Bodyweight" },

  // Back
  { name: "Barbell Deadlift", muscleGroup: "Back", equipmentType: "Barbell" },
  { name: "Pull-Ups", muscleGroup: "Back", equipmentType: "Bodyweight" },
  { name: "Barbell Bent-Over Row", muscleGroup: "Back", equipmentType: "Barbell" },
  { name: "Lat Pulldown", muscleGroup: "Back", equipmentType: "Cable" },
  { name: "Seated Cable Row", muscleGroup: "Back", equipmentType: "Cable" },
  { name: "Single-Arm Dumbbell Row", muscleGroup: "Back", equipmentType: "Dumbbell" },

  // Shoulders
  { name: "Overhead Press (OHP)", muscleGroup: "Shoulders", equipmentType: "Barbell" },
  { name: "Seated Dumbbell Shoulder Press", muscleGroup: "Shoulders", equipmentType: "Dumbbell" },
  { name: "Dumbbell Lateral Raise", muscleGroup: "Shoulders", equipmentType: "Dumbbell" },
  { name: "Face Pull", muscleGroup: "Shoulders", equipmentType: "Cable" },

  // Legs
  { name: "Barbell Back Squat", muscleGroup: "Legs", equipmentType: "Barbell" },
  { name: "Front Squat", muscleGroup: "Legs", equipmentType: "Barbell" },
  { name: "Romanian Deadlift (RDL)", muscleGroup: "Legs", equipmentType: "Barbell" },
  { name: "Leg Press", muscleGroup: "Legs", equipmentType: "Machine" },
  { name: "Walking Dumbbell Lunge", muscleGroup: "Legs", equipmentType: "Dumbbell" },
  { name: "Leg Extension", muscleGroup: "Legs", equipmentType: "Machine" },
  { name: "Seated Leg Curl", muscleGroup: "Legs", equipmentType: "Machine" },
  { name: "Standing Calf Raise", muscleGroup: "Legs", equipmentType: "Machine" },

  // Arms
  { name: "Barbell Bicep Curl", muscleGroup: "Arms", equipmentType: "Barbell" },
  { name: "Dumbbell Hammer Curl", muscleGroup: "Arms", equipmentType: "Dumbbell" },
  { name: "Incline Dumbbell Curl", muscleGroup: "Arms", equipmentType: "Dumbbell" },
  { name: "Triceps Rope Pushdown", muscleGroup: "Arms", equipmentType: "Cable" },
  { name: "Skull Crushers", muscleGroup: "Arms", equipmentType: "Barbell" },
  { name: "Close-Grip Bench Press", muscleGroup: "Arms", equipmentType: "Barbell" },

  // Core
  { name: "Hanging Leg Raise", muscleGroup: "Core", equipmentType: "Bodyweight" },
  { name: "Cable Woodchopper", muscleGroup: "Core", equipmentType: "Cable" },
  { name: "Ab Wheel Rollout", muscleGroup: "Core", equipmentType: "Bodyweight" },
  { name: "Plank", muscleGroup: "Core", equipmentType: "Bodyweight" },
];

async function seed() {
  console.log(`Seeding ${exercises.length} exercises into ${TABLE_NAME}...`);

  for (const item of exercises) {
    const entityId = `exercise#${crypto.randomUUID()}`;
    const record = {
      PK: item.muscleGroup,
      SK: entityId,
      entityId: entityId,
      entityType: "exercise",
      name: item.name,
      equipmentType: item.equipmentType,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: record,
      })
    );
    console.log(`Inserted: ${item.name} (${item.muscleGroup})`);
  }

  console.log("Seeding complete.");
}

seed().catch((err) => {
  console.error("Error seeding exercises:", err);
  process.exit(1);
});
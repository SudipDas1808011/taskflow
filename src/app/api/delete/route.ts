import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { MongoClient, Db, UpdateResult } from "mongodb";
import { withAuth } from "@/lib/withAuth";

/**
 * Interface for the expected DELETE request body.
 */
interface DeleteRequestBody {
  id: string | number;
  type: "task" | "goal";
}

/**
 * Handles the deletion of tasks or goals from a user's record in MongoDB.
 * Ensures strict typing for request payload and database operations.
 */
export const DELETE = withAuth(async (req, userData) => {
  try {
    const body: DeleteRequestBody = await req.json();
    const { id, type } = body;
    const email = userData.email;

    if (!id || !type) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const client: MongoClient = await clientPromise;
    const db: Db = client.db("taskdb");

    let result: UpdateResult;

    if (type === "task") {
      result = await db.collection("users").updateOne(
        { email },
        {
          $pull: {
            tasks: { id },
          } as any,
        }
      );
    } else if (type === "goal") {
      result = await db.collection("users").updateOne(
        { email },
        {
          $pull: {
            goals: { id },
          } as any,
        }
      );
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid type provided" },
        { status: 400 }
      );
    }

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { 
        success: false, 
        message: "Internal server error during deletion" 
      },
      { status: 500 }
    );
  }
});
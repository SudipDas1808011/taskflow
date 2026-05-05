import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withAuth } from "@/lib/withAuth";

export const PUT = withAuth(async (req, userData) => {
  try {
    const { goalId, completionPercentage } = await req.json();
    const email = userData.email;

    console.log("update-completion payload:", {
      email,
      goalId,
      completionPercentage,
    });

    const client = await clientPromise;
    const db = client.db("taskdb");

    const result = await db.collection("users").updateOne(
      {
        email,
        "goals.id": goalId,
      },
      {
        $set: {
          "goals.$.completionPercentage": completionPercentage,
        },
      }
    );

    console.log("after await response - DB update result:", result);

    return NextResponse.json({
      success: true,
      message: "Goal completion updated",
      result,
    });
  } catch (error: any) {
    console.log("update-completion error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update goal completion",
      },
      { status: 500 }
    );
  }
});
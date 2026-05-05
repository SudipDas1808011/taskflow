import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withAuth } from "@/lib/withAuth";

export const POST = withAuth(async (req, userData) => {
  try {
    const email = userData.email;

    const client = await clientPromise;
    const db = client.db("taskdb");

    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    console.log("User data fetched");

    return NextResponse.json({
      tasks: user.tasks || [],
      goals: user.goals || [],
    });

  } catch (error) {
    console.error("Get user data error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
});


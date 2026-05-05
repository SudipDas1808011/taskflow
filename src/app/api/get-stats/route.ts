import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withAuth } from "@/lib/withAuth";

export const POST = withAuth(async (req, userData) => {
  try {
    const email = userData.email;

    console.log("Fetching stats for:", email);

    const client = await clientPromise;
    const db = client.db("taskdb");

    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return NextResponse.json([], { status: 404 });
    }

    console.log("DB stats:", user.stats || []);

    return NextResponse.json(user.stats || []);
  } catch (err) {
    console.log("Get Stats Error:", err);
    return NextResponse.json([], { status: 500 });
  }
});
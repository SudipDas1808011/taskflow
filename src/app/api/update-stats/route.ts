import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { User } from "@/types/types";

export async function POST(req: Request) {
  try {
    const { email, stats } = await req.json();

    console.log("Updating DB for:", email);
    console.log("Stats:", stats);

    const client = await clientPromise;
    const db = client.db("taskdb");
const userCollection = db.collection<User>("users")

    const result = await userCollection.updateOne(
      { email },
      {
        $set: {
          stats,
          updatedAt: new Date(),
        },
        $push: {
          chatHistory: {
            type: "stats_update",
            data: stats,
            createdAt: new Date(),
          },
        },
      }
    );

    console.log("Mongo update result:", result);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.log("DB Update Error:", err);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
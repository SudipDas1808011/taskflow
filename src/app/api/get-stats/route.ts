import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

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
}
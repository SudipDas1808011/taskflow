import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("taskdb");

    const tasks = await db.collection("tasks").find().toArray();

    return NextResponse.json(tasks);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: "Failed to fetch tasks" }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("taskdb");
    const body = await request.json();

    const result = await db.collection("tasks").insertOne({
      ...body,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: "Failed to save task" }, { status: 500 });
  }
}
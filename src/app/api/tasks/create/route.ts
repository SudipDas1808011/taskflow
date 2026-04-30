import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { token, task } = body;

    console.log("Incoming task:", task);

    if (!token) {
      return NextResponse.json({ message: "No token" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const email = decoded.email;

    const client = await clientPromise;
    const db = client.db("taskdb");

    const newTask = {
      id: new Date().getTime().toString(),
      name: task.name,
      description: task.description,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      isCompleted: false,
      createdAt: new Date(),
    };

    const result = await db.collection("users").updateOne(
      { email },
      {
        $push: {
          tasks: newTask as any,
        },
      },
    );

    console.log("Task inserted:", result);

    return NextResponse.json({
      success: true,
      task: newTask,
    });
  } catch (err) {
    console.error("Create task error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

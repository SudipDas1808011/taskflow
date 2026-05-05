import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withAuth } from "@/lib/withAuth";

export const POST = withAuth(async (req, userData) => {
  try {
    const body = await req.json();
    const { task } = body;

    console.log("Incoming task:", task);

    const email = userData.email;

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
});

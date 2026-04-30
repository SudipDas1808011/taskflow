import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const { email, goalId, taskId, done } = await req.json();

    console.log("Update subtask request:", { email, goalId, taskId, done });

    const client = await clientPromise;
    const db = client.db("taskdb");

    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    const updatedGoals = (user.goals || []).map((goal: any) => {
      if (goal.id !== goalId) return goal;

      return {
        ...goal,
        days: goal.days.map((day: any, di: number) => ({
          ...day,
          tasks: day.tasks.map((task: any, ti: number) => {
            const id = `${goal.id}-${di}-${ti}`;

            if (id === taskId) {
              return { ...task, done };
            }

            return task;
          }),
        })),
      };
    });

    await db.collection("users").updateOne(
      { email },
      { $set: { goals: updatedGoals } }
    );

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.log("Update subtask error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
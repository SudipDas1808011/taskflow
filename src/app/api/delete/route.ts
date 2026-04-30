import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function DELETE(req: Request) {
  try {
    const { email, id, type } = await req.json();

    console.log("delete request:", { email, id, type });

    const client = await clientPromise;
    const db = client.db("taskdb");

    if (type === "task") {
      const result = await db.collection("users").updateOne(
        { email },
        {
          $pull: {
            tasks: { id },
          },
        }
      );

      console.log("task delete result:", result);
    }

    if (type === "goal") {
      const result = await db.collection("users").updateOne(
        { email },
        {
          $pull: {
            goals: { id },
          },
        }
      );

      console.log("goal delete result:", result);
    }

    console.log("after await response - delete completed");

    return NextResponse.json({
      success: true,
      message: `${type} deleted`,
    });
  } catch (error) {
    console.log("delete error:", error);

    return NextResponse.json(
      { success: false, message: "Delete failed" },
      { status: 500 }
    );
  }
}
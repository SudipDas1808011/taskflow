import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getUserFromReq } from "@/lib/getUser";
import { User} from "@/types/types";



export async function GET(req: Request) {
  try {
    const userData = getUserFromReq(req);

    if (!userData) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("taskdb");

    const user = await db.collection("users").findOne({
      email: userData.email,
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    console.log("Fetched tasks for:", userData.email);

    return NextResponse.json({
      tasks: user.tasks || [],
      goals: user.goals || [],
    });

  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}


export async function POST(req: Request) {
  try {
    const userData = getUserFromReq(req);

    if (!userData) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Incoming task:", body);

    const newTask = {
      id: Date.now().toString(),
      name: body.name,
      description: body.description || "",
      dueDate: body.dueDate,
      dueTime: body.dueTime,
      isCompleted: false,
      createdAt: new Date(),
    };

    const client = await clientPromise;
    const db = client.db("taskdb");
    const userCollection = db.collection<User>("users")
    await userCollection.updateOne(
      { email: userData.email },
      {
        $push: { tasks: newTask },
      }
    );

    console.log("Task added for:", userData.email);

    return NextResponse.json({
      message: "Task created",
      task: newTask,
    });

  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to save task" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const userData = getUserFromReq(req);

    if (!userData) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { taskId, isCompleted } = await req.json();

    const client = await clientPromise;
    const db = client.db("taskdb");

    const user = await db.collection("users").findOne({
      email: userData.email,
    });

    const updatedTasks = user?.tasks.map((task: any) =>
      task.id === taskId
        ? { ...task, isCompleted }
        : task
    );

    await db.collection("users").updateOne(
      { email: userData.email },
      { $set: { tasks: updatedTasks } }
    );

    return NextResponse.json({ message: "Updated", tasks: updatedTasks });

  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userData = getUserFromReq(req);

    if (!userData) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await req.json();

    const client = await clientPromise;
    const db = client.db("taskdb");

    const user = await db.collection("users").findOne({
      email: userData.email,
    });

    const updatedTasks = user?.tasks.filter(
      (task: any) => task.id !== taskId
    );

    await db.collection("users").updateOne(
      { email: userData.email },
      { $set: { tasks: updatedTasks } }
    );

    return NextResponse.json({ message: "Deleted", tasks: updatedTasks });

  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
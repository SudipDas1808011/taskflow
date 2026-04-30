import { getUserFromReq } from "@/lib/getUser";
import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  try {
    const userData = getUserFromReq(req);

    if (!userData) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { messages } = await req.json();

    const client = await clientPromise;
    const db = client.db("taskdb");

    const user = await db.collection("users").findOne({
      email: userData.email,
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    await db.collection("users").updateOne(
      { email: userData.email },
      {
        $set: {
          chatHistory: messages,
        },
      }
    );

    return NextResponse.json({
      message: "Updated",
      chatHistory: messages,
    });

  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

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
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Success",
      chatHistory: user.chatHistory || [],
    });

  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    console.log("Register request:", email);

    if (!email || !password) {
      return NextResponse.json(
        { message: "Missing fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("taskdb");

    const existingUser = await db
      .collection("users")
      .findOne({ email });

    console.log("Existing user:", existingUser);

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashed");

    const token = jwt.sign({ email }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    console.log("Token created:", token);

    const newUser = {
      email,
      password: hashedPassword,
      token,
      tasks: [],
      goals: [],
      chatHistory:[],
    };

    await db.collection("users").insertOne(newUser);

    console.log("User saved");

    return NextResponse.json({ token }, { status: 200 });

  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
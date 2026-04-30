import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    console.log("Login request:", email);

    if (!email || !password) {
      return NextResponse.json(
        { message: "Missing fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("taskdb");

    const user = await db
      .collection("users")
      .findOne({ email });

    console.log("User found:", user);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    console.log("Password match:", isMatch);

    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid password" },
        { status: 401 }
      );
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    console.log("New token:", token);

    await db.collection("users").updateOne(
      { email },
      { $set: { token } }
    );

    return NextResponse.json({ token }, { status: 200 });

  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
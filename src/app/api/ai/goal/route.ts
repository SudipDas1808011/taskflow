import { goalContentPrompt } from "@/utils/prompt";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import clientPromise from "@/lib/mongodb";
import crypto from "crypto";
import { withAuth } from "@/lib/withAuth";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const POST = withAuth(async (req, userData) => {
  try {
    const { goal, context } = await req.json();
    const email = userData.email;

    console.log("Goal request received:", { goal, context, email });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: goalContentPrompt },
        {
          role: "user",
          content: `Goal: ${goal}\nContext: ${context}`,
        },
      ],
      temperature: 0.4,
    });

    const raw = response.choices[0].message.content;
    const parsed = JSON.parse(raw || "{}");

    if (!parsed?.plan) {
      return NextResponse.json(
        { error: "Invalid goal plan" },
        { status: 400 }
      );
    }

    const clientDb = await clientPromise;
    const db = clientDb.db("taskdb");

    const goalToSave = {
      id: crypto.randomUUID(),
      ...parsed.plan,
      createdAt: new Date(),
    };

    await db.collection("users").updateOne(
      { email },
      {
        $push: {
          goals: goalToSave,
        },
      }
    );

    console.log("Goal saved to DB:", goalToSave);

    return NextResponse.json({
      plan: parsed.plan,
    });
  } catch (error) {
    console.error("Goal API error:", error);

    return NextResponse.json(
      { error: "Failed to generate goal plan" },
      { status: 500 }
    );
  }
});
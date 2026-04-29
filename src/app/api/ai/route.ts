import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { contentPrompt, matchPrompt } from "@/utils/prompt";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const lastMessage = messages[messages.length - 1]?.text;

    console.log("User input:", lastMessage);

    // =========================
    // STEP 1: INTENT DETECTION
    // =========================
    const intentRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: contentPrompt,
        },
        {
          role: "user",
          content: lastMessage,
        },
      ],
      temperature: 0.3,
    });

    const intentRaw = intentRes.choices[0].message.content;
    console.log("Intent raw:", intentRaw);

    const intent = JSON.parse(intentRaw || "{}");
    console.log("Parsed intent:", intent);

    const operation = intent?.operation;

    // =========================
    // STEP 2: ADD FLOW
    // =========================
    if (intent.type === "task" && operation === "add") {
      return NextResponse.json({
        type: "task",
        intent,
        match: null,
        reply: intent.reply || "Task created"
      });
    }

    // =========================
    // STEP 3: DELETE / RETRY / COMPLETE FLOW (MATCHING)
    // =========================
    if (
      intent.type === "task" &&
      (operation === "delete" ||
        operation === "retry" ||
        operation === "complete")
    ) {
      const email = req.headers.get("email");

      if (!email) {
        return NextResponse.json(
          {
            type: "error",
            intent,
            match: null,
            reply: "Unauthorized"
          },
          { status: 401 }
        );
      }

      const mongoClient = await clientPromise;
      const db = mongoClient.db("taskdb");

      const user = await db.collection("users").findOne({ email });
      const tasks = user?.tasks || [];

      console.log("Sending tasks for matching:", tasks);

      if (tasks.length === 0) {
        return NextResponse.json({
          type: "task",
          intent,
          match: null,
          reply: "No tasks found to match"
        });
      }

      const matchRes = await client.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: matchPrompt,
          },
          {
            role: "user",
            content: JSON.stringify({
              query: intent.data.query,
              tasks,
              operation
            }),
          },
        ],
        temperature: 0.2,
      });

      const matchRaw = matchRes.choices[0].message.content;
      console.log("Match raw:", matchRaw);

      const match = JSON.parse(matchRaw || "{}");
      console.log("Matched task:", match);

      return NextResponse.json({
        type: "task",
        intent,
        match,
        reply: match?.message || intent.reply || "OK"
      });
    }

    // =========================
    // STEP 4: CHAT / FALLBACK
    // =========================
    return NextResponse.json({
      type: intent.type || "chat",
      intent,
      match: null,
      reply: intent.reply || "OK"
    });

  } catch (error) {
    console.error("AI API error:", error);

    return NextResponse.json(
      {
        type: "error",
        reply: "Something went wrong with AI",
        intent: null,
        match: null
      },
      { status: 500 }
    );
  }
}
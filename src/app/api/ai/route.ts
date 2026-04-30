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

    const intentRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: contentPrompt },
        { role: "user", content: lastMessage },
      ],
      temperature: 0.3,
    });

    const intentRaw = intentRes.choices[0].message.content;
    console.log("Intent raw:", intentRaw);

    const intent = JSON.parse(intentRaw || "{}");
    console.log("Parsed intent:", intent);

    const operation = intent?.operation;

    // =========================
    // 🔥 FIXED SAFETY GUARD
    // =========================
    if (!intent?.type || !operation) {
      return NextResponse.json({
        type: "chat",
        intent: {},
        match: null,
        reply: intent?.reply || "I couldn't understand that. Can you rephrase?",
      });
    }

    // =========================
    // TASK ADD
    // =========================
    if (intent.type === "task" && operation === "add") {
      return NextResponse.json({
        type: "task",
        intent,
        match: null,
        reply: intent.reply || "Task created",
      });
    }

    // =========================
    // GOAL
    // =========================
    if (intent.type === "goal") {
      return NextResponse.json({
        type: "goal",
        intent,
        match: null,
        reply: intent.reply || "Goal detected",
      });
    }

    // =========================
    // TASK MATCH FLOW
    // =========================
    if (
      intent.type === "task" &&
      (operation === "delete" ||
        operation === "retry" ||
        operation === "complete")
    ) {
      const email = req.headers.get("email");

      if (!email) {
        return NextResponse.json({
          type: "chat",
          intent,
          match: null,
          reply: "Unauthorized",
        });
      }

      const mongoClient = await clientPromise;
      const db = mongoClient.db("taskdb");

      const user = await db.collection("users").findOne({ email });

      const tasks =
        user?.tasks?.map((t: any) => ({
          id: t.id,
          name: t.name,
          isCompleted: t.isCompleted,
          description: t.description,
          dueDate: t.dueDate,
          dueTime: t.dueTime,
        })) || [];

      const matchRes = await client.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: matchPrompt },
          {
            role: "user",
            content: JSON.stringify({
              query: intent.data.query,
              tasks,
              operation,
            }),
          },
        ],
        temperature: 0.2,
      });

      const matchRaw = matchRes.choices[0].message.content;
      const match = JSON.parse(matchRaw || "{}");

      return NextResponse.json({
        type: "task",
        intent,
        match,
        reply: match?.message || intent.reply || "Processed",
      });
    }

    // =========================
    // CHAT FALLBACK (FIXED)
    // =========================
    return NextResponse.json({
      type: "chat",
      intent,
      match: null,
      reply: intent.reply || "OK",
    });

  } catch (error) {
    console.error("AI API error:", error);

    return NextResponse.json({
      type: "chat",
      intent: {},
      match: null,
      reply: "Something went wrong, try again.",
    });
  }
}
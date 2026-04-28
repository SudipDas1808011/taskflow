import { NextResponse } from "next/server";
import OpenAI from "openai";
import { contentPrompt } from "@/utils/prompt"
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const lastMessage = messages[messages.length - 1]?.text;

    console.log("User input:", lastMessage);

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",

      response_format: { type: "json_object" },

      messages: [
        {
          role: "system",
          content: `${contentPrompt}`,
        },

        ...messages.map((m: any) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text,
        })),
      ],

      temperature: 0.3,
    });

    const raw = completion.choices[0].message.content;

    console.log("AI raw response:", raw);

    return NextResponse.json(JSON.parse(raw || "{}"));
  } catch (error) {
    console.error("AI API error:", error);

    return NextResponse.json(
      { reply: "Something went wrong with AI", type: "error" },
      { status: 500 },
    );
  }
}

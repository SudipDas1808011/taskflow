import { NextResponse } from "next/server";
import OpenAI from "openai";
import { withAuth } from "@/lib/withAuth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();
    console.log("Incoming Data:", body);

   const prompt = `
You are a productivity analytics engine.

User task data:
Completed: ${JSON.stringify(body.completed)}
Due: ${JSON.stringify(body.due)}
Running: ${JSON.stringify(body.running)}

Your job:
- Analyze user behavior from tasks
- Detect patterns automatically
- Generate 3 to 6 performance metrics (dynamic labels)
- Metrics must reflect REAL behavior from tasks (not fixed categories)

Examples of possible metrics (do NOT limit to these):
Time Management, Focus, Consistency, Task Completion Speed, Discipline, Planning Quality, Productivity, Procrastination Control, Health Balance

Rules:
- Total must equal 100%
- Return ONLY JSON array
- No explanations, no markdown

Format:
[
  { "label": "Dynamic Label", "value": 40 }
]
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    console.log("OpenAI Raw:", response);

    let text = response.choices[0].message.content || "[]";
    console.log("Raw Text:", text);

    // clean markdown
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    console.log("Cleaned Text:", text);

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      console.log("Fallback parsing triggered");
      const match = text.match(/\[[\s\S]*\]/);
      parsed = match ? JSON.parse(match[0]) : [];
    }

    console.log("Final Parsed:", parsed);

    return NextResponse.json(parsed);
  } catch (error) {
    console.log("API Error:", error);
    return NextResponse.json({ message: "Error parsing AI response" }, { status: 500 });
  }
});
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { withAuth } from "@/lib/withAuth";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Token cost calculation ebong logging function
function logTokenUsage(usage: any, model: string = "gpt-4o-mini") {
  if (!usage) return;

  // GPT-4o-mini Pricing (As of 2024-2025)
  const inputRate = 0.15 / 1_000_000; // $0.15 per 1M tokens
  const outputRate = 0.60 / 1_000_000; // $0.60 per 1M tokens

  const inputCost = usage.prompt_tokens * inputRate;
  const outputCost = usage.completion_tokens * outputRate;
  const totalCost = inputCost + outputCost;

  console.log("\x1b[36m%s\x1b[0m", "=== AI Token & Cost Report ==="); // Cyan color log
  console.log(`Model: ${model}`);
  console.log(`Input Tokens: ${usage.prompt_tokens}`);
  console.log(`Output Tokens: ${usage.completion_tokens}`);
  console.log(`Total Tokens: ${usage.total_tokens}`);
  console.log(`Estimated Cost: $${totalCost.toFixed(7)}`);
  console.log("\x1b[36m%s\x1b[0m", "==============================");

  return {
    totalTokens: usage.total_tokens,
    totalCost: totalCost.toFixed(7)
  };
}



export const POST = withAuth(async (req: Request) => {
  try {
    const { query, tasks } = await req.json();

    const taskContext = `
RUNNING: ${tasks.runningTasks?.join(" | ") || "None"}
DUE: ${tasks.dueTasks?.join(" | ") || "None"}
DONE: ${tasks.completedTasks?.join(" | ") || "None"}
    `.trim();

  const aiRes = await client.chat.completions.create({

      model: "gpt-4o-mini",

      messages: [

        { 

          role: "system", 

          content: "You are a precise task auditor. Rules:\n1. STATUS: DUE/RUNNING = Not Completed, DONE = Completed.\n2. STRICT GROUNDING: Use ONLY the provided Source Data. No mock data.\n3. COUNTING: If asked 'how many times', scan the entire list and provide an exact count of matching occurrences.\n4. RECENCY: If asked 'when' or 'last performed', identify the occurrence with the most recent date/timestamp provided in the list.\n5. NO DATA: If the task or date is missing, reply 'Data not found.'\n6. FORMAT: Answer concisely without conversational filler." 

        },

        { 

          role: "user", 

          content: `SOURCE DATA:\n${taskContext}\n\nQUERY: ${query}` 

        },

      ],

      temperature: 0,

      max_tokens: 100,

    });

    logTokenUsage(aiRes.usage);

    return NextResponse.json({ reply: aiRes.choices[0]?.message?.content });

  } catch (err) {
    return NextResponse.json({ reply: "Error" }, { status: 500 });
  }
});

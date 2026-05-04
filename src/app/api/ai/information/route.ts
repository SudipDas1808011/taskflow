

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

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



export async function POST(req: NextRequest) {
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
          content: "You are a task assistant. Rules: DUE/RUNNING = Not Completed, DONE = Completed. Check list labels to confirm status. Answer concisely." 
        },
        { 
          role: "user", 
          content: `Task Lists:\n${taskContext}\n\nUser Question: ${query}` 
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
}
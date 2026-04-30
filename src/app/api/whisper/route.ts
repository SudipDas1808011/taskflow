import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const openaiForm = new FormData();
    openaiForm.append("file", file);
    openaiForm.append("model", "gpt-4o-mini-transcribe");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: openaiForm,
    });

    console.log("whisper api response:", response);

    const data = await response.json();
    console.log("whisper api json:", data);

    return NextResponse.json({ text: data.text || "" });

  } catch (err) {
    console.log("whisper error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
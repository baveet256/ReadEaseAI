// src/app/api/tts/route.ts
import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");
  const voice = searchParams.get("voice") || "alloy"; // alloy, echo, fable, onyx, nova, shimmer
  const model = searchParams.get("model") || "tts-1"; // tts-1 or tts-1-hd

  if (!text) {
    return new Response(JSON.stringify({ error: "Text is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate voice
  const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
  if (!validVoices.includes(voice)) {
    return new Response(
      JSON.stringify({ error: `Invalid voice. Must be one of: ${validVoices.join(", ")}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // OpenAI TTS call
    const response = await openai.audio.speech.create({
      model: model as "tts-1" | "tts-1-hd",
      voice: voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
      input: text,
      response_format: "mp3",
    });

    // Convert to base64
    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const base64Audio = audioBuffer.toString("base64");

    return new Response(
      JSON.stringify({ 
        base64Chunks: [{ base64: base64Audio }],
        voice,
        model,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("OpenAI TTS error:", err);
    return new Response(
      JSON.stringify({ 
        error: "TTS failed", 
        details: err.message 
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Optional: POST method for longer text
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, voice = "alloy", model = "tts-1" } = body;

    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await openai.audio.speech.create({
      model: model as "tts-1" | "tts-1-hd",
      voice: voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
      input: text,
      response_format: "mp3",
    });

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const base64Audio = audioBuffer.toString("base64");

    return new Response(
      JSON.stringify({ 
        base64Chunks: [{ base64: base64Audio }],
        voice,
        model,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("OpenAI TTS error:", err);
    return new Response(
      JSON.stringify({ 
        error: "TTS failed", 
        details: err.message 
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
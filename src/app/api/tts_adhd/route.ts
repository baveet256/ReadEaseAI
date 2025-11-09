import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Helper function to clean text for TTS
function cleanTextForTTS(text: string): string {
  return text
    // Remove emojis and special unicode characters
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols and Pictographs
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
    // Remove other problematic characters
    .replace(/[^\x00-\x7F\u0080-\u00FF\u0100-\u017F\u0180-\u024F]/g, '') // Keep basic Latin, extended Latin
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET(req: NextRequest) {
  console.log('🎤 TTS API called via GET');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment');
    return NextResponse.json(
      { error: "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local" },
      { status: 500 }
    );
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const { searchParams } = new URL(req.url);
  const rawText = searchParams.get("text");
  const voice = searchParams.get("voice") || "alloy";
  const model = searchParams.get("model") || "tts-1";

  if (!rawText) {
    return NextResponse.json(
      { error: "Text is required" },
      { status: 400 }
    );
  }

  // Clean the text
  const text = cleanTextForTTS(rawText);
  
  if (!text || text.length === 0) {
    return NextResponse.json(
      { error: "Text is empty after cleaning" },
      { status: 400 }
    );
  }

  const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
  if (!validVoices.includes(voice)) {
    return NextResponse.json(
      { error: `Invalid voice. Must be one of: ${validVoices.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    console.log('🎤 Generating TTS...');
    console.log('  Original text length:', rawText.length);
    console.log('  Cleaned text length:', text.length);
    console.log('  Voice:', voice);
    console.log('  Model:', model);
    
    const response = await openai.audio.speech.create({
      model: model as "tts-1" | "tts-1-hd",
      voice: voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
      input: text,
      response_format: "mp3",
    });

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const base64Audio = audioBuffer.toString("base64");

    console.log('✅ TTS generated successfully');
    console.log('  Audio size:', audioBuffer.length, 'bytes');

    return NextResponse.json({
      base64Chunks: [{ base64: base64Audio }],
      voice,
      model,
    });

  } catch (err: any) {
    console.error("❌ OpenAI TTS error:", err);
    console.error("Error details:", {
      message: err.message,
      type: err.type,
      code: err.code,
    });
    
    return NextResponse.json(
      { 
        error: "TTS generation failed", 
        details: err.message,
        type: err.type || 'unknown'
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  console.log('🎤 TTS API called via POST');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment');
    return NextResponse.json(
      { error: "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local" },
      { status: 500 }
    );
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const body = await req.json();
    const { text: rawText, voice = "alloy", model = "tts-1" } = body;

    if (!rawText) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // Clean the text
    const text = cleanTextForTTS(rawText);
    
    if (!text || text.length === 0) {
      return NextResponse.json(
        { error: "Text is empty after cleaning special characters" },
        { status: 400 }
      );
    }

    console.log('🎤 Generating TTS...');
    console.log('  Original text length:', rawText.length);
    console.log('  Cleaned text length:', text.length);
    console.log('  First 100 chars:', text.substring(0, 100));
    console.log('  Voice:', voice);
    console.log('  Model:', model);

    const response = await openai.audio.speech.create({
      model: model as "tts-1" | "tts-1-hd",
      voice: voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
      input: text,
      response_format: "mp3",
    });

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const base64Audio = audioBuffer.toString("base64");

    console.log('✅ TTS generated successfully');
    console.log('  Audio size:', audioBuffer.length, 'bytes');

    return NextResponse.json({
      base64Chunks: [{ base64: base64Audio }],
      voice,
      model,
    });

  } catch (err: any) {
    console.error("❌ OpenAI TTS error:", err);
    console.error("Error details:", {
      message: err.message,
      type: err.type,
      code: err.code,
      response: err.response?.data,
    });
    
    return NextResponse.json(
      { 
        error: "TTS generation failed", 
        details: err.message,
        type: err.type || 'unknown'
      },
      { status: 500 }
    );
  }
}

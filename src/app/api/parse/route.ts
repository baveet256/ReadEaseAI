// /app/api/parse/route.ts
import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";

interface ParseResponse {
  text: string;
  info?: any;
  metadata?: any;
  version?: string;
  analysis?: {
    cleanedText?: string;
    structure?: any;
  };
  error?: string;
}

// Helper function to clean text for dyslexia-friendly reading
function cleanTextForDyslexia(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, " ")
    // Remove page numbers and headers (common patterns)
    .replace(/Page \d+/gi, "")
    .replace(/^\d+\s*$/gm, "")
    // Remove URLs (can be distracting)
    .replace(/https?:\/\/[^\s]+/g, "")
    // Normalize line breaks
    .replace(/\n{3,}/g, "\n\n")
    // Trim each line
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join("\n")
    .trim();
}

// Helper function to call Claude API for enhanced text extraction
async function enhanceWithClaude(
  pdfBuffer: Buffer,
  fileName: string
) {
  try {
    const base64Data = pdfBuffer.toString("base64");

    const prompt = `Extract and clean the text from this PDF document for someone with dyslexia. 
    
Please:
1. Remove headers, footers, and page numbers
2. Keep only the main content
3. Preserve paragraph structure
4. Remove any OCR artifacts or garbled text
5. Ensure sentences are complete
6. Return ONLY the cleaned text, no JSON or formatting

Focus on making the text clear and readable.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: base64Data,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract text from response
    const cleanedText = data.content
      .map((item: any) => (item.type === "text" ? item.text : ""))
      .filter(Boolean)
      .join("\n");

    return cleanedText;
  } catch (error) {
    console.error("Claude enhancement error:", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const useAI = formData.get("useAI") !== "false";

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Basic PDF parsing
    const pdfData = await pdfParse(buffer);

    let finalText = pdfData.text;
    let analysis = {};

    // If AI enhancement is requested, use Claude
    if (useAI) {
      try {
        console.log("Enhancing PDF with Claude...");
        const enhancedText = await enhanceWithClaude(buffer, file.name);
        finalText = enhancedText;
        analysis = {
          cleanedText: enhancedText,
          enhanced: true,
        };
      } catch (aiError) {
        console.error("AI enhancement failed, using basic extraction:", aiError);
        // Fallback to basic cleaning
        finalText = cleanTextForDyslexia(pdfData.text);
        analysis = {
          enhanced: false,
          fallback: true,
        };
      }
    } else {
      // Just clean the text without AI
      finalText = cleanTextForDyslexia(pdfData.text);
    }

    const response: ParseResponse = {
      text: finalText,
      info: pdfData.info,
      metadata: pdfData.metadata,
      version: pdfData.version,
      analysis,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error parsing PDF:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to parse PDF",
        details: "Please ensure the PDF is not corrupted or password-protected"
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ready",
    features: {
      basicParsing: true,
      aiEnhancement: true,
      dyslexiaOptimized: true,
    },
  });
}
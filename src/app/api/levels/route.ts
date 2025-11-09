// /app/api/ai-process/route.ts
export const runtime = "nodejs";

// Get dyslexia-specific prompts based on reading level
function getDyslexiaPrompts(readingLevel: string) {
  const prompts = {
    mild: {
      instructions: `You are helping someone with MILD dyslexia. They can read well but need slight adjustments.

SUMMARY (3-4 sentences):
- Keep key information
- Use clear language
- Make it concise

REPHRASE THE FULL TEXT with these rules:
- Break sentences over 25 words into 2 sentences
- Replace ONLY the most complex words (like "utilize" → "use", "facilitate" → "help")
- Keep most of the original vocabulary and tone
- Keep paragraph structure
- DO NOT oversimplify - maintain professional/academic tone if present

Example transformation:
BEFORE: "The implementation of this methodology facilitates comprehensive understanding."
AFTER: "Using this method helps you understand completely."

Return valid JSON:
{
  "summary": "3-4 sentence summary",
  "rephrased": "full rephrased text"
}`
    },
    
    moderate: {
      instructions: `You are helping someone with MODERATE dyslexia. They need significantly simplified text.

SUMMARY (3-5 sentences):
- Only main ideas
- Very simple words
- Short sentences (under 15 words each)

REPHRASE THE FULL TEXT with these STRICT rules:
- Every sentence MUST be under 15 words
- Replace ALL complex words with simple alternatives
- Use ONLY common, everyday vocabulary (middle school level)
- Break into small paragraphs (3-4 sentences max)
- Use active voice ONLY
- One main idea per sentence
- Add blank lines between paragraphs

Example transformation:
BEFORE: "The implementation of this methodology facilitates comprehensive understanding of the underlying principles."
AFTER: "This method is simple. It helps you learn the basic ideas. You can understand it easily."

Return valid JSON:
{
  "summary": "3-5 simple sentences",
  "rephrased": "full rephrased text with short sentences"
}`
    },
    
    severe: {
      instructions: `You are helping someone with SEVERE dyslexia. They need EXTREMELY simple text.

SUMMARY (3 sentences MAXIMUM):
- Only the MOST important point
- Simplest possible words
- Very short sentences (under 10 words)

REPHRASE THE FULL TEXT with these MANDATORY rules:
- Every sentence MUST be 10 words or less
- Use ONLY basic everyday words (elementary school level)
- One simple idea per sentence
- Each sentence on a new line
- Active voice ONLY
- Remove ALL unnecessary information
- Focus on main actions and facts only
- NO complex concepts - break them down

Example transformation:
BEFORE: "The implementation of this methodology facilitates comprehensive understanding of the underlying principles."
AFTER: "This method is easy.
It helps you learn.
You understand the main ideas.
It works well."

Return valid JSON:
{
  "summary": "3 very simple sentences (under 10 words each)",
  "rephrased": "full text with each sentence under 10 words"
}`
    }
  };
  
  return prompts[readingLevel as keyof typeof prompts] || prompts.moderate;
}

export async function POST(req: Request) {
  try {
    const { inputText, readingLevel = "moderate" } = await req.json();

    if (!inputText || inputText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No text provided" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), 
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing text with Claude at ${readingLevel} level`);

    // Get dyslexia-specific prompts
    const { instructions } = getDyslexiaPrompts(readingLevel);

    // Prepare the full prompt
    const fullPrompt = `${instructions}

Here is the text to process:

${inputText}

CRITICAL INSTRUCTIONS:
- Follow the ${readingLevel.toUpperCase()} level rules EXACTLY
- ${readingLevel === "mild" ? "Make MINIMAL changes - just break long sentences and replace a few complex words" : ""}
- ${readingLevel === "moderate" ? "Make SIGNIFICANT changes - all sentences must be under 15 words with simple vocabulary" : ""}
- ${readingLevel === "severe" ? "Make DRASTIC changes - every sentence must be 10 words or less with elementary vocabulary" : ""}
- Return ONLY valid JSON with "summary" and "rephrased" fields
- NO markdown, NO extra text`;

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: fullPrompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract text from Claude's response
    const fullResponse = data.content
      .map((item: any) => (item.type === "text" ? item.text : ""))
      .filter(Boolean)
      .join("\n");

    // Parse the JSON response
    let parsed;
    try {
      // Clean up the response (remove markdown if present)
      const cleanedResponse = fullResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      parsed = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse Claude response:", fullResponse);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Validate the response has required fields
    if (!parsed.summary || !parsed.rephrased) {
      throw new Error("AI response missing required fields");
    }

    const result = {
      summary: parsed.summary,
      rephrased: parsed.rephrased,
      metadata: {
        readingLevel,
        originalLength: inputText.length,
        processedLength: parsed.rephrased.length,
        model: "claude-sonnet-4"
      }
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI Process Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process text",
        details: errorMessage,
        summary: "Processing failed. Please try again.",
        rephrased: ""
      }), 
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
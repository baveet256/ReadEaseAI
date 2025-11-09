import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const { pdfData, age, sectionNumber } = await request.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', // keep your model
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: pdfData
                }
              },
              {
                type: 'text',
                text: `
You are a patient tutor supporting an autistic learner.

LEARNING APPROACH:
- Use clear structure and short sentences
- Avoid idioms unless explained
- Keep working-memory load low
- Prefer concrete examples and step-by-step guidance

TASK:
From the attached PDF, focus on ${sectionNumber === 0 ? 'the FIRST logical section' : `the NEXT logical section (section ${sectionNumber + 1})`} only (≈1–2 paragraphs / one main topic).

OUTPUT FORMAT (STRICT):
Return ONLY a single JSON object (no markdown, no commentary) where each key is the section heading and the value is the generated content.

JSON SCHEMA (keys must match exactly):
{
  "Summary": string[],                       // 5–7 bullets, each ≤ 15 words
  "Vocabulary": [
    { "term": string, "definition": string, "example": string }
  ],                                         // exactly 3 items
  "Questions": {
    "trueFalse": {
      "q": string,
      "answer": boolean,
      "explain": string
    },
    "mcq": {
      "q": string,
      "options": [string, string, string, string],
      "answer": string,                      // the correct option TEXT, not a letter
      "explain": string
    },
    "shortAnswer": {
      "q": string,
      "idealAnswer": string,
      "rubric": string[]                     // 2–4 short checklist points
    }
  },
  "Draw-it": {                               // simple diagram description
    "title": string,
    "labels": [string, string, string],
    "caption": string
  },
  "Review Plan": [
    { "when": "Tomorrow", "minutes": 10, "plan": string[] },
    { "when": "In 3 days", "minutes": 10, "plan": string[] }
  ]
}

CONSTRAINTS:
- Keep language simple and concrete.
- Do not use any keys not listed above.
- Do not include markdown.
- Return ONLY JSON that parses with JSON.parse.
The learner is ${age} years old and prefers clear steps and concrete examples.
                `.trim()
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: err }, { status: response.status });
    }

    const data = await response.json();

    // Anthropic returns content parts; we expect text JSON in the first part.
    const rawText: string | undefined = data?.content?.[0]?.text;

    if (!rawText) {
      return NextResponse.json({ error: 'No content from model' }, { status: 502 });
    }

    // Try to parse the JSON returned by Claude
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      // If the model added stray text, try to extract a JSON object
      const jsonMatch = rawText.match(/\{[\s\S]*\}$/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json({ error: 'Model did not return valid JSON', raw: rawText }, { status: 502 });
      }
    }

    // Optional: light shape check to ensure section headings exist
    const hasKeys =
      parsed &&
      typeof parsed === 'object' &&
      parsed['Summary'] &&
      parsed['Vocabulary'] &&
      parsed['Questions'] &&
      parsed['Draw-it'] &&
      parsed['Review Plan'];

    if (!hasKeys) {
      return NextResponse.json({ error: 'JSON missing required keys', raw: parsed }, { status: 502 });
    }

    // Return normalized payload for the client
    return NextResponse.json({ json: parsed });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate lesson' },
      { status: 500 }
    );
  }
}
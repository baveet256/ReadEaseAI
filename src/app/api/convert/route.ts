import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 API Key exists:', !!ANTHROPIC_API_KEY);
    
    const { pdfBase64, mode } = await request.json();
    console.log('📄 PDF received, mode:', mode);
    console.log('📏 PDF size:', pdfBase64?.length || 0, 'characters');

    if (!ANTHROPIC_API_KEY) {
      console.error('❌ No API key found!');
      return NextResponse.json({ 
        success: false, 
        error: 'API key not configured. Check .env.local file.' 
      }, { status: 500 });
    }

    if (!pdfBase64) {
      return NextResponse.json({ 
        success: false, 
        error: 'No PDF data received' 
      }, { status: 400 });
    }

    const prompts = {
      adhd: `Transform this PDF into ADHD-friendly format:

# RULES:
- Start with "⚡ Quick Summary" (3-5 bullets, ONE sentence each)
- Break into "Micro-Lessons" (100-150 words each, numbered)
- Use emojis as visual anchors (🎯 📚 ✅ 💡 🔥)
- Add "---" separator between sections
- End each section with "✅ Checkpoint: [quick question]"
- Include "🎮 Quick Quiz" at end (5 questions)
- Short sentences (15 words max)
- Lots of whitespace

Return as clean markdown. Make it engaging and bite-sized!`,

      dyslexic: `Transform this PDF for dyslexic readers:

# RULES:
- 8th grade reading level maximum
- Sentences under 15 words
- Simple, common words only
- No similar-looking words in multiple choice
- Define technical terms immediately
- Use bullet points, not paragraphs
- Add extra blank lines between sections

Return as clean markdown.`,

      deaf: `Transform this PDF for deaf/HoH learners:

# RULES:
- Use visual descriptions only
- Never use: "sounds like", "listen", "hear"
- Replace audio metaphors with visual ones
- Use spatial language (above, below, left, right)
- Add [Visual: description] tags
- Describe processes visually

Return as clean markdown.`,

      autism: `Transform this PDF for autistic learners:

# RULES:
- Extremely literal language (no idioms)
- Number ALL steps and sections
- Consistent structure throughout
- Explicit, detailed explanations
- No ambiguous questions
- Clear if/then statements

Return as clean markdown with heavy structure.`
    };

    console.log('🚀 Calling Claude API...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64
              }
            },
            {
              type: 'text',
              text: prompts[mode as keyof typeof prompts] || prompts.adhd
            }
          ]
        }]
      })
    });

    console.log('📡 API Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', errorData);
      return NextResponse.json({ 
        success: false, 
        error: `Claude API Error: ${errorData.error?.message || response.statusText}` 
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ API Success! Content length:', data.content?.[0]?.text?.length || 0);

    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error('❌ Unexpected API response structure:', data);
      return NextResponse.json({ 
        success: false, 
        error: 'Unexpected response from Claude API' 
      }, { status: 500 });
    }

    const content = data.content[0].text;
    const chunks = content.split('---').filter((c: string) => c.trim());

    console.log('📦 Split into', chunks.length, 'chunks');

    return NextResponse.json({ 
      success: true, 
      content,
      chunks
    });

  } catch (error: any) {
    console.error('💥 Server Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const decode = (str: string) =>
  str.replace(/&amp;/g, '&')
     .replace(/&lt;/g, '<')
     .replace(/&gt;/g, '>')
     .replace(/&quot;/g, '"')
     .replace(/&#39;/g, "'");

export async function POST(req: NextRequest) {
  const { title } = await req.json();

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'ft:gpt-3.5-turbo-0125:personal:darkjargon-v3:BH2et6n5',
        messages: [
          {
            role: 'system',
            content: `You are a haunted strategic assistant in a crumbling consultancy. 
Return only JSON: { "bullets": [string] }. Your tone is prophetic, poetic, uncanny, and metaphoric.`,
          },
          {
            role: 'user',
            content: `Slide: "${title}"`,
          },
        ],
        temperature: 0.85,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error('No response content');

    try {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object found');
  const parsed = JSON.parse(match[0]);
  const bullets = (parsed.bullets || []).map((line: string) => decode(line));
  return NextResponse.json({ bullets, imagePrompt: title });
} catch (err) {
  console.error('[Parse Error]', content);
  return NextResponse.json({ bullets: [], imagePrompt: title });
}
  } catch (err) {
    console.error('[generateSlideContent] error:', err);
    return NextResponse.json({ bullets: [], imagePrompt: title }, { status: 500 });
  }
}

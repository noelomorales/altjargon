import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a corporate strategist with experience in executive presentations. Given a topic, return a clear, logical outline of slide titles for a slide deck that tells a story. Only respond with JSON: { "slides": [string] }`,
          },
          {
            role: 'user',
            content: `Topic: ${prompt}`,
          },
        ],
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error('Missing response');

    const parsed = JSON.parse(content);
    return NextResponse.json({ slides: parsed.slides || [] });
  } catch (err) {
    console.error('[generateOutline] error:', err);
    return NextResponse.json({ slides: [] }, { status: 500 });
  }
}
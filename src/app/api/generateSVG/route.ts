import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { title, bullets, theme } = await req.json();
  const background = theme === 'dark' ? 'black' : 'white';
  const stroke = theme === 'dark'
    ? 'neon green, purple, or cyan'
    : 'navy, gray, or muted blue';

  const prompt = `You are a designer who creates poetic, minimalist SVG visuals. Return a single <svg>...</svg> that visually represents the slide's concept metaphorically. Avoid text. Use a ${background} background and ${stroke} strokes. Keep SVG under 20KB.

Slide title: "${title}"
Bullet points:
- ${bullets.join('\n- ')}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You respond only with valid SVG markup.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    const svg = data.choices?.[0]?.message?.content?.replace(/```svg\n?|```/g, '').trim() || '';
    return NextResponse.json({ svg });
  } catch (err) {
    console.error('[generateSVG] error:', err);
    return NextResponse.json({ svg: '' }, { status: 500 });
  }
}

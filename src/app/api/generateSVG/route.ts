// File: src/app/api/generateSvg/route.ts

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { title, bullets, theme } = await req.json();
const background = theme === 'dark' ? 'black' : 'white';
const foreground = theme === 'dark' ? 'neon green, purple, or cyan' : 'navy, gray, or muted blue';

  const prompt = `You are a designer who creates poetic, minimalist SVG visuals to represent abstract ideas. Given a slide title and bullet points, return a single <svg>...</svg> element that visually represents the concept in a metaphorical or symbolic way. Avoid text. Keep it under 20KB. Return only valid SVG.

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
      body: JSON.stringify({ title, bullets, theme }),
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You respond only with valid SVG markup.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    const svg = data.choices?.[0]?.message?.content || '';
    return NextResponse.json({ svg });
  } catch (err) {
    console.error('[generateSvg] error:', err);
    return NextResponse.json({ svg: '' }, { status: 500 });
  }
}

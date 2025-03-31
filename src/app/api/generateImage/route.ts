import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const imageRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url',
      }),
    });

    const imageData = await imageRes.json();
    const url = imageData?.data?.[0]?.url || null;

    return NextResponse.json({ image: url });
  } catch (err) {
    console.error('[image generation] error:', err);
    return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
  }
}
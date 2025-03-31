// File: src/app/api/generateImage/route.ts

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid prompt' }, { status: 400 });
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
    console.error('[generateImage] Unexpected error:', err);
    return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
  }
}

// File: src/app/api/generateImage/route.ts

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function pollForImage(retryUrl: string, apiKey: string): Promise<string> {
  const maxTries = 10;
  const delay = 3000;

  for (let attempt = 0; attempt < maxTries; attempt++) {
    const pollRes = await fetch(retryUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const statusData = await pollRes.json();

    if (statusData.status === 'succeeded') {
      return statusData.data[0].url;
    }

    if (statusData.status === 'failed') {
      throw new Error('Image generation failed');
    }

    await new Promise((res) => setTimeout(res, delay));
  }

  throw new Error('Image polling timed out');
}

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  try {
    const initRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url',
      }),
    });

    const initData = await initRes.json();

    if (!initData.id) throw new Error('No generation ID returned');

    const retryUrl = `https://api.openai.com/v1/images/generations/${initData.id}`;
    const imageUrl = await pollForImage(retryUrl, apiKey!);

    return NextResponse.json({ image: imageUrl });
  } catch (err) {
    console.error('[generateImage] polling error:', err);
    return NextResponse.json(
      {
        error: 'Image generation failed or timed out',
        fallback:
          'https://upload.wikimedia.org/wikipedia/commons/4/4f/Black_hole_-_Messier_87_crop_max_res.jpg',
      },
      { status: 500 }
    );
  }
}

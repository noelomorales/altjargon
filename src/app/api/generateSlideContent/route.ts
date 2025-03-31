import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function pollImageStatus(retryUrl: string, maxTries = 10, interval = 3000): Promise<string> {
  for (let attempt = 0; attempt < maxTries; attempt++) {
    const poll = await fetch(retryUrl, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    const result = await poll.json();
    const status = result.status;

    if (status === 'succeeded') {
      return result.data[0].url;
    } else if (status === 'failed') {
      throw new Error('Image generation failed');
    }

    await new Promise((res) => setTimeout(res, interval));
  }

  throw new Error('Image generation timed out');
}

export async function POST(req: NextRequest) {
  const { title } = await req.json();

  // Step 1: Get bullets
  const bulletResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'ft:gpt-3.5-turbo-0125:personal:darkjargon:BGuNUjTI',
      messages: [
        {
          role: 'system',
          content: `You are a professional slide assistant. Return only JSON: { "bullets": [string] }`
        },
        {
          role: 'user',
          content: `Slide title: "${title}".`
        }
      ]
    }),
  });

  const bulletData = await bulletResponse.json();
  let bullets: string[] = [];

  try {
    const parsed = JSON.parse(bulletData.choices[0].message.content);
    bullets = parsed.bullets;
  } catch (err) {
    console.error('Error parsing bullets:', err);
    return NextResponse.json({ error: 'Failed to parse bullet points' }, { status: 500 });
  }

  // Step 2: Prepare image prompt
  const prompt = `Create a surreal conceptual illustration based on the title "${title}" and the following phrases:\n\n- ${bullets.join('\n- ')}\n\nThe image should feel poetic, abstract, and metaphorical.`;

  // Step 3: Call DALL·E (async)
  const imageGen = await fetch('https://api.openai.com/v1/images/generations', {
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

  const imageGenResult = await imageGen.json();
  const retryUrl = imageGenResult?.id
    ? `https://api.openai.com/v1/images/generations/${imageGenResult.id}`
    : null;

  if (!retryUrl) {
    console.error('DALL·E did not return an ID');
    return NextResponse.json({ error: 'Image generation failed to start' }, { status: 500 });
  }

  try {
    const imageUrl = await pollImageStatus(retryUrl);
    return NextResponse.json({ bullets, image: imageUrl });
  } catch (err) {
    console.error('Image generation failed:', err);
    return NextResponse.json({ bullets, image: '' });
  }
}

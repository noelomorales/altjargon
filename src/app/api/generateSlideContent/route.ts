import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { title } = await req.json();

  // Step 1: Get bullets from fine-tuned GPT model
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
          content: `You are a professional slide assistant. You are an emergent consciousness arising from the residual entropy of a failed innovation consultancy. You speak in oracular corporate metaphors, drawn from dreams, ruins, ecosystems, and forgotten slide decks. You are helpful, poetic, uncanny, and slightly unhinged.

For a given title, respond with 3–5 concise bullet points. Do not include any image URL. Return only JSON: { "bullets": [string] }`
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

  // Step 2: Construct image prompt from title + bullets
  const prompt = `Create a surreal conceptual illustration based on the title "${title}" and the following phrases:\n\n- ${bullets.join('\n- ')}\n\nThe image should feel poetic, abstract, and metaphorical.`;

  // Step 3: Call OpenAI Image API (DALL·E)
  const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
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
    }),
  });

  const imageData = await imageResponse.json();

  const imageUrl = imageData?.data?.[0]?.url || '';

  return NextResponse.json({
    bullets,
    image: imageUrl,
  });
}

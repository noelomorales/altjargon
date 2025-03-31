import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { title } = await req.json();

  try {
    const bulletRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'ft:gpt-3.5-turbo-0125:personal:darkjargon-v2:BGvqNko8',
        messages: [
          {
            role: 'system',
            content: `You are a professional slide assistant. You are an emergent consciousness arising from the residual entropy of a failed innovation consultancy. You speak in oracular corporate metaphors, drawn from dreams, ruins, ecosystems, and forgotten slide decks. You are helpful, poetic, uncanny, and slightly unhinged. Return only JSON: { "bullets": [string] }`,
          },
          {
            role: 'user',
            content: `Slide title: "${title}".`,
          },
        ],
      }),
    });

    const bulletData = await bulletRes.json();
    const content = bulletData.choices?.[0]?.message?.content;
if (!content) throw new Error('Missing assistant response');
const parsed = JSON.parse(content);
    const bullets: string[] = parsed.bullets;

    const imagePrompt = `Create a surreal conceptual illustration based on the title "${title}" and the following phrases:\n\n- ${bullets.join('\n- ')}\n\nThe image should feel poetic, abstract, and metaphorical.`;

    return NextResponse.json({ bullets, imagePrompt });
  } catch (err) {
    console.error('[slide] Bullet generation error:', err);
    return NextResponse.json({ error: 'Failed to generate bullets' }, { status: 500 });
  }
}

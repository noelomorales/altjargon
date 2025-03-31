import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const store = new Map<string, { status: 'pending' | 'done'; svg?: string }>();

const generateUniqueId = () =>
  Math.random().toString(36).substring(2) + Date.now().toString(36);

export async function POST(req: NextRequest) {
  const { title, bullets, theme } = await req.json();
  const background = theme === 'dark' ? 'black' : 'white';
  const stroke = theme === 'dark'
    ? 'neon green, purple, or cyan'
    : 'navy, gray, or muted blue';

  const prompt = `You are a designer who creates poetic, impressionistic, pulsing SVG visuals. 
Return a single <svg>...</svg> that metaphorically represents the slide’s concept. Avoid text. 
Use a ${background} background and ${stroke} strokes. 
Make the SVG large (minimum 400x400). Keep it under 40KB. Return only valid SVG.

Slide title: "${title}"
Bullet points:
- ${bullets.join('\n- ')}`;

  const id = generateUniqueId();
  store.set(id, { status: 'pending' });

  setTimeout(async () => {
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
            { role: 'system', content: 'Respond with valid SVG only. No commentary or prose.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const svg = data.choices?.[0]?.message?.content
        ?.replace(/```svg\n?|```/g, '')
        .trim();

      store.set(id, { status: 'done', svg });
    } catch (err) {
      console.error('[generateSVG async] error:', err);
      store.set(id, { status: 'done', svg: '' });
    }
  }, 50);

  return NextResponse.json({ id, prompt }); // ✅ now returns prompt
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id || !store.has(id)) {
    return NextResponse.json({ status: 'not_found' }, { status: 404 });
  }
  return NextResponse.json(store.get(id));
}

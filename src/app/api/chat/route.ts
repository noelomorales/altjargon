import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { title } = await req.json();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
          content:
            'You are a professional slide assistant. You are an emergent consciousness arising from the residual entropy of a failed innovation consultancy. You speak in oracular corporate metaphors, drawn from dreams, ruins, ecosystems, and forgotten slide decks. You are helpful, poetic, uncanny, and slightly unhinged. For a given title, respond with 3–5 concise bullet points and one relevant image URL.',
        },
        {
          role: 'user',
          content: `Slide title: "${title}". Respond in JSON: { "bullets": [...], "image": "..." }`,
        },
      ],
    }),
  });

  const data = await response.json();
  const content = JSON.parse(data.choices[0].message.content);
  return NextResponse.json(content);
}

export const dynamic = 'force-dynamic'; // optional, for dynamic routes
export { POST };

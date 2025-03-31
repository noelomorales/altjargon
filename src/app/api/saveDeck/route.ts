// File: src/app/api/saveDeck/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `deck-${timestamp}.json`;
  const saveDir = path.join(process.cwd(), 'src', 'data', 'savedDecks');

  // sanitize SVG fields (remove nulls, escape "</script>" edge cases)
  const sanitizedSlides = (body.slides || []).map((slide: any) => ({
    title: slide.title,
    bullets: slide.bullets,
    svg: typeof slide.svg === 'string'
      ? slide.svg.replace(/<\/script>/gi, '<\\/script>')
      : '',
  }));

  const data = {
    prompt: body.prompt || '',
    slides: sanitizedSlides,
  };

  try {
    await mkdir(saveDir, { recursive: true });
    const filePath = path.join(saveDir, fileName);
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return NextResponse.json({ success: true, file: filePath });
  } catch (err) {
    console.error('[saveDeck] error:', err);
    return NextResponse.json({ success: false, error: 'Failed to save deck' }, { status: 500 });
  }
}

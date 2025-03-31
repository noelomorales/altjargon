// File: src/app/api/saveDeck/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const data = await req.json();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `deck-${timestamp}.json`;
  const savePath = path.join(process.cwd(), 'src', 'data', 'savedDecks');

  try {
    await mkdir(savePath, { recursive: true });
    await writeFile(path.join(savePath, fileName), JSON.stringify(data, null, 2), 'utf-8');
    return NextResponse.json({ success: true, file: `/saved/${fileName}` });
  } catch (err) {
    console.error('[saveDeck] failed:', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

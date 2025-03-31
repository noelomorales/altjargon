// File: src/app/api/loadDecks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest) {
  try {
    const folder = path.join(process.cwd(), 'src', 'data', 'savedDecks');
    const files = await readdir(folder);
    const decks = await Promise.all(
      files
        .filter((f) => f.endsWith('.json'))
        .map(async (file) => {
          const filePath = path.join(folder, file);
          const content = await readFile(filePath, 'utf-8');
          return {
            name: file.replace('.json', ''),
            data: JSON.parse(content),
          };
        })
    );
    return NextResponse.json({ decks });
  } catch (err) {
    console.error('[loadDecks] error:', err);
    return NextResponse.json({ decks: [] }, { status: 500 });
  }
}
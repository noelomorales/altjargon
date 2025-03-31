import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest) {
  try {
    const folder = path.join(process.cwd(), 'public', 'saved');
    await mkdir(folder, { recursive: true });
    const files = await readdir(folder);
    const decks = await Promise.all(
      files
        .filter((file) => file.endsWith('.json'))
        .map(async (file) => {
          const content = await readFile(path.join(folder, file), 'utf-8');
          return {
            name: file.replace('.json', ''),
            data: JSON.parse(content),
          };
        })
    );
    return NextResponse.json({ decks });
  } catch (err) {
    console.error('[savedDecks GET] error:', err);
    return NextResponse.json({ decks: [] }, { status: 500 });
  }
}

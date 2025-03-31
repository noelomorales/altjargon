/* Full updated page.tsx input form with:
   - Enter to submit (Shift+Enter for newline)
   - Button shows "Generating..." while loading
   - Full generation flow restored
*/

'use client';

import { useState } from 'react';

interface Slide {
  title: string;
  bullets: string[];
  svg: string;
  notes: string;
}

type Theme = 'clean' | 'dark';

export default function PresentationBuilder() {
  const [prompt, setPrompt] = useState('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [generating, setGenerating] = useState(false);
  const [theme, setTheme] = useState<Theme>('clean');

  const bg = theme === 'dark' ? 'bg-black text-lime-300' : 'bg-[#f2f2f7] text-gray-800';
  const button = theme === 'dark' ? 'bg-[#39ff14] text-black hover:bg-[#53ff5c]' : 'bg-black text-white hover:bg-gray-800';
  const textarea = theme === 'dark' ? 'bg-[#111] border-lime-500 text-lime-300' : 'bg-white border-gray-300 text-black';

  const decode = (str: string) =>
    str.replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

  const generateOutline = async (prompt: string): Promise<string[]> => {
    const res = await fetch('/api/generateOutline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    return data.slides || [];
  };

  const generateSlideContent = async (title: string): Promise<{ bullets: string[] }> => {
    const res = await fetch('/api/generateSlideContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    const text = await res.text();
    const isJSON = res.headers.get('content-type')?.includes('application/json');
    const data = isJSON ? JSON.parse(text) : { bullets: [] };
    return { bullets: data.bullets.map(decode) || [] };
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setSlides([]);

    try {
      const outline = await generateOutline(prompt);
      const generatedSlides: Slide[] = [];

      for (const title of outline) {
        const { bullets } = await generateSlideContent(title);
        generatedSlides.push({ title, bullets, svg: '', notes: '' });
      }

      setSlides(generatedSlides);
    } catch (err) {
      console.error(err);
    }

    setGenerating(false);
  };

  return (
    <main className={`min-h-screen flex flex-col items-center justify-center p-8 ${bg}`}>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="w-full max-w-xl space-y-4">
        <h1 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-lime-400' : 'text-gray-800'}`}>Generate a Slide Deck</h1>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="e.g. AI startup pitch for logistics"
          className={`w-full p-4 rounded-md border focus:outline-none ${textarea}`}
          rows={4}
        />
        <button type="submit" disabled={generating} className={`px-6 py-2 rounded ${button}`}>
          {generating ? 'Generating…' : 'Generate Deck'}
        </button>
      </form>
    </main>
  );
}

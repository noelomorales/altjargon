/* Full updated page.tsx input form with:
   - Enter to submit (Shift+Enter for newline)
   - Button shows "Generating..." while loading
*/

'use client';

import { useState, useEffect } from 'react';

interface Slide {
  title: string;
  bullets: string[];
  svg: string;
  notes: string;
}

type Theme = 'clean' | 'dark';
type ViewMode = 'single' | 'grid';

export default function PresentationBuilder() {
  const [prompt, setPrompt] = useState('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [generating, setGenerating] = useState(false);
  const [theme, setTheme] = useState<Theme>('clean');
  const bg = theme === 'dark' ? 'bg-black text-lime-300' : 'bg-[#f2f2f7] text-gray-800';
  const button = theme === 'dark' ? 'bg-[#39ff14] text-black hover:bg-[#53ff5c]' : 'bg-black text-white hover:bg-gray-800';
  const textarea = theme === 'dark' ? 'bg-[#111] border-lime-500 text-lime-300' : 'bg-white border-gray-300 text-black';

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    // your generation logic here
    setTimeout(() => setGenerating(false), 3000); // remove after implementing real logic
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

'use client';

import { useState } from 'react';

interface Slide {
  title: string;
  bullets: string[];
  svg: string;
}

type Theme = 'clean' | 'dark';
type ViewMode = 'single' | 'grid';

export default function PresentationBuilder() {
  const [prompt, setPrompt] = useState('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [theme, setTheme] = useState<Theme>('clean');
  const [view, setView] = useState<ViewMode>('single');

  const generateOutline = async (prompt: string): Promise<string[]> => {
    const res = await fetch('/api/generateOutline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    return data.slides || [];
  };

  const generateSlideContent = async (title: string): Promise<Omit<Slide, 'svg'>> => {
    const res = await fetch('/api/generateSlideContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });

    const text = await res.text();
    const isJSON = res.headers.get('content-type')?.includes('application/json');
    const data = isJSON ? JSON.parse(text) : { bullets: [] };

    return {
      title,
      bullets: data.bullets || [],
    };
  };

  const generateSvg = async (title: string, bullets: string[]): Promise<string> => {
    try {
      const res = await fetch('/api/generateSVG', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, bullets }),
      });
      const data = await res.json();
      const raw = data.svg || '';
      return raw.replace(/```svg\n?|\n?```/g, '').trim();
    } catch (err) {
      console.error('[generateSVG] failed:', err);
      return '';
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setGenerating(true);
    setSlides([]);
    setCurrent(0);

    try {
      const outline = await generateOutline(prompt);
      const slideData: Slide[] = [];

      for (const title of outline) {
        const content = await generateSlideContent(title);
        const svg = await generateSvg(title, content.bullets);
        const slide: Slide = { title, bullets: content.bullets, svg };
        slideData.push(slide);
        setSlides([...slideData]);
        await new Promise((res) => setTimeout(res, 300));
      }
    } catch (err) {
      alert('Failed to generate deck');
      console.error(err);
    }

    setGenerating(false);
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/saveDeck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, slides }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Deck saved to: ${data.file}`);
      } else {
        alert('Save failed');
      }
    } catch (err) {
      alert('Save failed');
    }
  };

  const slide = slides[current];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const bg = theme === 'dark' ? 'bg-black text-lime-300' : 'bg-[#f2f2f7] text-gray-800';
  const card =
    theme === 'dark'
      ? 'bg-[#111] border border-lime-500 text-lime-200 shadow-[0_0_20px_#0f0]'
      : 'bg-white border border-gray-200 text-black shadow-xl';
  const button =
    theme === 'dark'
      ? 'bg-lime-500 text-black hover:bg-lime-300'
      : 'bg-black text-white hover:bg-gray-800';
  const textarea =
    theme === 'dark'
      ? 'bg-[#111] border-lime-500 text-lime-300'
      : 'bg-white border-gray-300 text-black';

  return (
    <main className={`min-h-screen flex flex-col items-center justify-center p-8 transition-all ${bg}`}>
      <div className="absolute top-4 right-4 flex gap-2">
        <button onClick={() => setTheme(theme === 'clean' ? 'dark' : 'clean')} className={`px-3 py-1 text-sm rounded ${button}`}>
          {theme === 'dark' ? '☀ Clean Mode' : '🧿 Glitch Mode'}
        </button>
        {slides.length > 0 && (
          <>
            <button onClick={() => setView(view === 'single' ? 'grid' : 'single')} className={`px-3 py-1 text-sm rounded ${button}`}>
              {view === 'single' ? '🗂 View All' : '🔍 View One'}
            </button>
            <button onClick={handleSave} className={`px-3 py-1 text-sm rounded ${button}`}>
              💾 Save Deck
            </button>
          </>
        )}
      </div>

      {slides.length === 0 ? (
        <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-4">
          <h1 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-lime-400' : 'text-gray-800'}`}>
            Generate a Slide Deck
          </h1>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. AI startup pitch for logistics"
            className={`w-full p-4 rounded-md border ${textarea} focus:outline-none focus:ring-2 focus:ring-blue-400`}
            rows={4}
          />
          <button type="submit" disabled={generating} className={`px-6 py-2 rounded disabled:opacity-50 ${button}`}>
            {generating ? 'Generating…' : 'Generate Deck'}
          </button>
        </form>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-[90rem] mt-8">
          {slides.map((s, i) => (
            <div
              key={i}
              onClick={() => {
                setCurrent(i);
                setView('single');
              }}
              className={`cursor-pointer p-4 rounded-xl ${card}`}
            >
              <h2 className="text-xl font-bold mb-2">{s.title}</h2>
              <ul className="text-sm list-disc pl-4 space-y-1">
                {s.bullets.map((pt, j) => (
                  <li key={j}>{pt}</li>
                ))}
              </ul>
              <div
                className="mt-4 w-full aspect-square bg-black p-2 flex items-center justify-center rounded border border-current"
                dangerouslySetInnerHTML={{ __html: s.svg || '' }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={`w-full max-w-[90rem] h-[85vh] rounded-2xl p-10 flex flex-col ${card}`}>
          <div className="flex-1 flex gap-8">
            <div className="flex-1 flex flex-col">
              <h2 className="text-3xl font-bold mb-4 border-b pb-2 border-current">{slide?.title}</h2>
              <ul className="list-disc pl-6 space-y-2 text-lg">
                {slide?.bullets.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
            <div
              className="w-[40%] h-full overflow-hidden rounded-xl border border-current bg-black flex items-center justify-center p-4"
              dangerouslySetInnerHTML={{ __html: slide?.svg || '' }}
            />
          </div>
          <div className="flex justify-between items-center mt-6">
            <button disabled={current === 0} onClick={() => setCurrent((i) => i - 1)} className="text-sm px-3 py-1 bg-gray-200 rounded disabled:opacity-50">
              ◀ Previous
            </button>
            <div className="text-sm opacity-60">
              Slide {current + 1} of {slides.length}
            </div>
            <button disabled={current === slides.length - 1} onClick={() => setCurrent((i) => i + 1)} className="text-sm px-3 py-1 bg-gray-200 rounded disabled:opacity-50">
              Next ▶
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

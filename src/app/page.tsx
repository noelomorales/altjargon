// src/app/page.tsx

'use client';

import { useState } from 'react';

interface Slide {
  title: string;
  bullets: string[];
  svg: string;
  notes: string;
  caption?: string;
  type: 'title' | 'agenda' | 'normal';
}

type Theme = 'clean' | 'dark';

export default function PresentationBuilder() {
  const [prompt, setPrompt] = useState('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [theme, setTheme] = useState<Theme>('clean');
  const [notesExpanded, setNotesExpanded] = useState(false);

  const decode = (str: string) =>
    str.replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

  const stripNumber = (title: string) => title.replace(/^\d+\.\s*/, '');

  const glitch = theme === 'dark' ? 'animate-[glitch_1s_infinite] tracking-wide' : '';
  const glitchStyle = theme === 'dark' ? 'text-lime-300 drop-shadow-[0_0_2px_lime]' : '';

  const bg = theme === 'dark' ? 'bg-black text-lime-300' : 'bg-[#f2f2f7] text-gray-800';
  const card = theme === 'dark' ? 'bg-[#111] border border-lime-500 shadow-[0_0_20px_#0f0]' : 'bg-white border border-gray-200';
  const button = theme === 'dark' ? 'bg-[#39ff14] text-black hover:bg-[#53ff5c]' : 'bg-black text-white hover:bg-gray-800';
  const navButton = theme === 'dark' ? 'bg-lime-500 text-black hover:bg-lime-400' : 'bg-gray-200 text-black hover:bg-gray-300';
  const textarea = theme === 'dark' ? 'bg-[#111] border-lime-500 text-lime-300' : 'bg-white border-gray-300 text-black';

  const slide = slides[current] ?? {
    title: '', bullets: [], svg: '', notes: '', caption: '', type: 'normal',
  };

  const retrySlideContent = async (title: string, bullets: string[], suffix: string): Promise<string[]> => {
    for (let i = 0; i < 3; i++) {
      try {
        const res = await fetch('/api/generateSlideContent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: `${title} ${suffix} \n ${bullets.join('\n')}` }),
        });
        const data = await res.json();
        if (data?.bullets?.length) return data.bullets.map(decode);
      } catch {}
    }
    return ['(Failed to generate content)'];
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setSlides([]);
    setCurrent(0);

    try {
      const outlineRes = await fetch('/api/generateOutline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!outlineRes.ok) {
        throw new Error(`[generateOutline] ${outlineRes.status} ${outlineRes.statusText}`);
      }

      const outlineData = await outlineRes.json();
      const outline: string[] = outlineData.slides || [];

      const initialSlides = [
        { title: prompt, type: 'title' },
        { title: 'Agenda', type: 'agenda' },
        ...outline.map((t) => ({ title: t, type: 'normal' })),
      ];

      const allSlides: Slide[] = [];

      for (const s of initialSlides) {
        const content = await fetch('/api/generateSlideContent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: s.title }),
        });
        const contentData = await content.json();
        const bullets = (contentData.bullets || []).map(decode);

        const svgPayload = await fetch('/api/generateSVG', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: s.title, bullets, theme }),
        });
        const { id } = await svgPayload.json();
        let svg = '';
        if (id) {
          for (let i = 0; i < 10; i++) {
            const poll = await fetch(`/api/generateSVG?id=${id}`);
            const result = await poll.json();
            if (result.status === 'done') {
              svg = result.svg;
              break;
            }
            await new Promise((res) => setTimeout(res, 1000));
          }
        }

        const caption = (await retrySlideContent(s.title, bullets, 'caption'))[0];
        const notes = (await retrySlideContent(s.title, bullets, 'notes')).join(' ');

        const newSlide: Slide = {
          title: s.title,
          type: s.type as Slide['type'],
          bullets,
          svg,
          caption,
          notes,
        };

        allSlides.push(newSlide);
        setSlides([...allSlides]);
      }
    } catch (err) {
      console.error('[generateDeck error]', err);
      setSlides([
        {
          title: 'Error',
          type: 'title',
          bullets: ['Failed to generate deck. Please try again or check server logs.'],
          svg: '',
          caption: '',
          notes: '',
        },
      ]);
      setGenerating(false);
      return;
    }

    setGenerating(false);
  };

  return (
    <main className={`min-h-screen flex flex-col items-center justify-center p-8 ${bg} font-sans`}>
      <style>{`
        @keyframes glitch {
          0% { text-shadow: 2px 0 lime, -2px 0 magenta; }
          20% { text-shadow: -2px -1px cyan, 2px 1px lime; }
          40% { text-shadow: 1px 2px magenta, -1px -2px cyan; }
          60% { text-shadow: -1px 0 lime, 1px 0 cyan; }
          80% { text-shadow: 2px -2px magenta, -2px 2px lime; }
          100% { text-shadow: 0 0 0 lime; }
        }
        svg {
          max-width: 100%;
          max-height: 100%;
          display: block;
        }
      `}</style>

      <div className="absolute top-4 right-4 flex gap-2">
        <button onClick={() => setTheme(theme === 'clean' ? 'dark' : 'clean')} className={`px-3 py-1 text-sm rounded ${button}`}>
          {theme === 'dark' ? '☀ Clean Mode' : '🧿 Glitch Mode'}
        </button>
      </div>

      {slides.length > 0 && (
        <div className="flex justify-between items-center my-4 w-full max-w-[90rem]">
          <button disabled={current === 0} onClick={() => setCurrent(i => i - 1)} className={`text-base px-4 py-1 rounded ${navButton} disabled:opacity-50`}>⬅️ Previous</button>
          <div className="text-base opacity-60">Slide {current + 1} of {slides.length}</div>
          <button disabled={current === slides.length - 1} onClick={() => setCurrent(i => i + 1)} className={`text-base px-4 py-1 rounded ${navButton} disabled:opacity-50`}>Next ➡️</button>
        </div>
      )}

      {slides.length > 0 && slide && (
        <div className={`w-full max-w-[90rem] aspect-[16/9] rounded-2xl p-10 flex flex-col ${card}`}>
          <div className="flex-1 flex gap-8">
            <div className="flex-1 flex flex-col">
              <h2 className={`text-4xl font-bold mb-6 border-b pb-3 border-current leading-tight tracking-tight ${glitch}`}>{stripNumber(slide.title)}</h2>
              <ul className={`list-disc pl-6 space-y-3 text-xl ${glitchStyle}`}>
                {slide.bullets?.map((pt, i) => <li key={i}>{pt}</li>)}
              </ul>
            </div>
            <div className={`w-[40%] h-full overflow-hidden rounded-xl border border-current flex flex-col items-center justify-center p-4 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
              {slide.svg && (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: theme === 'dark' ? 'black' : 'white' }}
                  dangerouslySetInnerHTML={{ __html: slide.svg }}
                />
              )}
              {slide.caption && (
                <div className="text-xs text-gray-400 mt-2 italic whitespace-pre-wrap text-center">
                  {slide.caption}
                </div>
              )}
            </div>
          </div>
          <div className="mt-6 text-sm border-t pt-2 border-current opacity-80 w-full">
            <button onClick={() => setNotesExpanded(!notesExpanded)} className="underline text-xs mb-1">
              {notesExpanded ? 'Hide Speaker Notes' : 'Show Speaker Notes'}
            </button>
            {notesExpanded && (
              <textarea
                value={slide.notes || ''}
                onChange={(e) => {
                  const updated = [...slides];
                  updated[current].notes = e.target.value;
                  setSlides(updated);
                }}
                className="w-full bg-transparent font-mono border border-current rounded p-2 mt-1 text-sm resize-none h-32"
              />
            )}
          </div>
        </div>
      )}

      {slides.length === 0 && (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="w-full max-w-xl space-y-4">
          <h1 className="text-3xl font-bold leading-snug tracking-tight">Generate a Slide Deck</h1>
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
            className={`w-full p-4 rounded-md border focus:outline-none text-lg ${textarea}`}
            rows={4}
          />
          <button type="submit" disabled={generating} className={`px-6 py-2 rounded text-lg ${button}`}>
            {generating ? 'Generating…' : 'Generate Deck'}
          </button>
        </form>
      )}
    </main>
  );
}

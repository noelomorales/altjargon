/* Full updated page.tsx with:
   - Prompt -> Outline -> Bullets -> SVG -> Notes
   - Animated bullet reveal
   - SVG visual generation with polling + retry
   - Editable, collapsible, monospace speaker notes
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

export default function PresentationBuilder() {
  const [prompt, setPrompt] = useState('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [generating, setGenerating] = useState(false);
  const [theme, setTheme] = useState<Theme>('clean');
  const [visibleBullets, setVisibleBullets] = useState<number[]>([]);
  const [notesExpanded, setNotesExpanded] = useState<boolean>(false);

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

  const generateNotes = async (title: string, bullets: string[]): Promise<string> => {
    try {
      const res = await fetch('/api/generateSlideContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `${title} - notes:\n${bullets.join('\n')}` }),
      });
      const text = await res.text();
      const isJSON = res.headers.get('content-type')?.includes('application/json');
      const data = isJSON ? JSON.parse(text) : { bullets: [] };
      return data.bullets?.join(' ') || '';
    } catch {
      return '';
    }
  };

  const generateSvg = async (title: string, bullets: string[], attempt = 1): Promise<string> => {
    try {
      const res = await fetch('/api/generateSVG', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, bullets, theme }),
      });
      const { id } = await res.json();
      if (!id) throw new Error('No SVG ID returned');
      for (let i = 0; i < 10; i++) {
        await new Promise((res) => setTimeout(res, 2000));
        const poll = await fetch(`/api/generateSVG?id=${id}`);
        if (!poll.ok) continue;
        const text = await poll.text();
        try {
          const json = JSON.parse(text);
          if (json.status === 'done') return json.svg || '';
        } catch {}
      }
      throw new Error('SVG polling timeout');
    } catch {
      if (attempt < 3) return generateSvg(title, bullets, attempt + 1);
      return '';
    }
  };

  const revealBullets = (index: number, total: number) => {
    setVisibleBullets((prev) => {
      const updated = [...prev];
      updated[index] = 0;
      return updated;
    });
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setVisibleBullets((prev) => {
        const updated = [...prev];
        updated[index] = count;
        return updated;
      });
      if (count >= total) clearInterval(interval);
    }, 300);
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setSlides([]);
    setVisibleBullets([]);

    try {
      const outline = await generateOutline(prompt);
      const slideData: Slide[] = [];

      for (const title of outline) {
        const { bullets } = await generateSlideContent(title);
        revealBullets(slideData.length, bullets.length);
        const svg = await generateSvg(title, bullets);
        const notes = await generateNotes(title, bullets);
        const slide: Slide = { title, bullets, svg, notes };
        slideData.push(slide);
        setSlides([...slideData]);
        await new Promise((r) => setTimeout(r, 300));
      }
    } catch (err) {
      alert('Deck generation failed');
    }

    setGenerating(false);
  };

  const slide = slides[0];
  const bg = theme === 'dark' ? 'bg-black text-lime-300' : 'bg-[#f2f2f7] text-gray-800';
  const card = theme === 'dark' ? 'bg-[#111] border border-lime-500 shadow-[0_0_20px_#0f0]' : 'bg-white border border-gray-200';
  const button = theme === 'dark' ? 'bg-[#39ff14] text-black hover:bg-[#53ff5c]' : 'bg-black text-white hover:bg-gray-800';
  const textarea = theme === 'dark' ? 'bg-[#111] border-lime-500 text-lime-300' : 'bg-white border-gray-300 text-black';

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

      {slides.length > 0 && (
        <div className={`w-full max-w-[90rem] aspect-[16/9] rounded-2xl p-10 mt-8 flex flex-col ${card}`}>
          <div className="flex-1 flex gap-8">
            <div className="flex-1 flex flex-col">
              <h2 className="text-3xl font-bold mb-4 border-b pb-2 border-current">{slide?.title}</h2>
              <ul className="list-disc pl-6 space-y-2 text-lg">
                {slide?.bullets.slice(0, visibleBullets[0] || 0).map((point, i) => <li key={i}>{point}</li>)}
              </ul>
            </div>
            <div
              className={`w-[40%] h-full overflow-hidden rounded-xl border border-current flex items-center justify-center p-4 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}
              dangerouslySetInnerHTML={{ __html: slide?.svg || '' }}
            />
          </div>
          <div className="mt-6 text-sm border-t pt-2 border-current opacity-80 w-full">
            <button onClick={() => setNotesExpanded(!notesExpanded)} className="underline text-xs mb-1">
              {notesExpanded ? 'Hide Speaker Notes' : 'Show Speaker Notes'}
            </button>
            {notesExpanded && (
              <textarea
                value={slide?.notes}
                onChange={(e) => {
                  const updated = [...slides];
                  updated[0].notes = e.target.value;
                  setSlides(updated);
                }}
                className="w-full bg-transparent font-mono border border-current rounded p-2 mt-1 text-xs resize-none h-32"
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}

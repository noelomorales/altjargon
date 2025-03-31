/* Safe fallback page.tsx
   - Handles undefined SVG, notes, bullets, prompt
   - Never crashes on missing fields
   - Maintains glitch mode, speaker notes, SVG prompts
*/

'use client';

import { useState } from 'react';

interface Slide {
  title: string;
  bullets: string[];
  svg: string;
  notes: string;
  svgPrompt?: string;
}

type Theme = 'clean' | 'dark';

export default function PresentationBuilder() {
  const [prompt, setPrompt] = useState('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
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

  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const generateOutline = async (prompt: string): Promise<string[]> => {
    try {
      const res = await fetch('/api/generateOutline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      return data.slides || [];
    } catch {
      return [];
    }
  };

  const generateSlideContent = async (title: string): Promise<{ bullets: string[] }> => {
    try {
      const res = await fetch('/api/generateSlideContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const text = await res.text();
      const isJSON = res.headers.get('content-type')?.includes('application/json');
      const data = isJSON ? JSON.parse(text) : { bullets: [] };
      return { bullets: data.bullets?.map(decode) || [] };
    } catch {
      return { bullets: [] };
    }
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

  const generateSvg = async (title: string, bullets: string[], attempt = 1): Promise<{ svg: string; prompt: string }> => {
    try {
      const res = await fetch('/api/generateSVG', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, bullets, theme }),
      });
      const data = await res.json();
      if (!data?.id) throw new Error('No SVG ID returned');
      const { id, prompt } = data;
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const poll = await fetch(`/api/generateSVG?id=${id}`);
        if (!poll.ok) continue;
        const text = await poll.text();
        try {
          const json = JSON.parse(text);
          if (json.status === 'done') return { svg: json.svg || '', prompt };
        } catch {}
      }
      throw new Error('SVG polling timeout');
    } catch {
      if (attempt < 3) return generateSvg(title, bullets, attempt + 1);
      return { svg: '', prompt: '' };
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
    setCurrent(0);

    try {
      const outline = await generateOutline(prompt);
      const agendaBullets = outline.slice(0, 6).map(title => title.replace(/^\d+\.\s*/, ''));
      const author = 'J. Foresight';

      const frontMatter: Slide[] = [
        {
          title: prompt,
          bullets: [`By ${author}`, today],
          svg: '',
          notes: 'Title and metadata slide',
        },
        {
          title: 'Agenda',
          bullets: agendaBullets,
          svg: '',
          notes: 'Overview of topics to be covered',
        },
      ];

      const generatedSlides: Slide[] = [...frontMatter];

      for (const title of outline) {
        const { bullets } = await generateSlideContent(title);
        const filtered = bullets.map(b => b.replace(/^.*\b[Ss]lide\b.*?:?\s*/, ''));
        revealBullets(generatedSlides.length, filtered.length);
        const { svg, prompt: svgPrompt } = await generateSvg(title, filtered);
        const notes = await generateNotes(title, filtered);
        const slide: Slide = { title, bullets: filtered, svg, notes, svgPrompt };
        generatedSlides.push(slide);
        setSlides([...generatedSlides]);
        await new Promise((r) => setTimeout(r, 300));
      }
    } catch (err) {
      console.error('[generateDeck error]', err);
      alert('Deck generation failed');
    }

    setGenerating(false);
  };

  const slide = slides[current];
  const bg = theme === 'dark' ? 'bg-black text-lime-300' : 'bg-[#f2f2f7] text-gray-800';
  const card = theme === 'dark' ? 'bg-[#111] border border-lime-500 shadow-[0_0_20px_#0f0]' : 'bg-white border border-gray-200';
  const button = theme === 'dark' ? 'bg-[#39ff14] text-black hover:bg-[#53ff5c]' : 'bg-black text-white hover:bg-gray-800';
  const textarea = theme === 'dark' ? 'bg-[#111] border-lime-500 text-lime-300' : 'bg-white border-gray-300 text-black';

  return (
    <main className={`min-h-screen flex flex-col items-center justify-center p-8 ${bg} font-sans`}>
      <div className="absolute top-4 right-4 flex gap-2">
        <button onClick={() => setTheme(theme === 'clean' ? 'dark' : 'clean')} className={`px-3 py-1 text-sm rounded ${button}`}>
          {theme === 'dark' ? '☀ Clean Mode' : '🧿 Glitch Mode'}
        </button>
      </div>

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

      {slides.length > 0 && slide && (
        <div className={`w-full max-w-[90rem] aspect-[16/9] rounded-2xl p-10 mt-8 flex flex-col ${card}`}>
          <div className="flex-1 flex gap-8">
            <div className="flex-1 flex flex-col">
              <h2 className="text-4xl font-bold mb-6 border-b pb-3 border-current leading-tight tracking-tight">{slide.title}</h2>
              <ul className="list-disc pl-6 space-y-3 text-xl">
                {slide.bullets?.slice(0, visibleBullets[current] || slide.bullets.length).map((pt, i) => <li key={i}>{pt}</li>)}
              </ul>
            </div>
            <div className={`w-[40%] h-full overflow-hidden rounded-xl border border-current flex flex-col items-center justify-center p-4 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
              <div dangerouslySetInnerHTML={{ __html: slide.svg || '' }} />
              {slide.svgPrompt && (
                <div className="text-xs text-gray-400 mt-2 italic whitespace-pre-wrap text-center">
                  {slide.svgPrompt}
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
          <div className="flex justify-between items-center mt-4">
            <button disabled={current === 0} onClick={() => setCurrent((i) => i - 1)} className="text-base px-3 py-1 bg-gray-200 rounded disabled:opacity-50">◀ Previous</button>
            <div className="text-base opacity-60">Slide {current + 1} of {slides.length}</div>
            <button disabled={current === slides.length - 1} onClick={() => setCurrent((i) => i + 1)} className="text-base px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Next ▶</button>
          </div>
        </div>
      )}
    </main>
  );
}

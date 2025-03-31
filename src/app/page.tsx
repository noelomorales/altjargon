'use client';

import { useState } from 'react';

interface Slide {
  title: string;
  bullets: string[];
  image: string;
  imagePrompt: string;
}

export default function PresentationBuilder() {
  const [prompt, setPrompt] = useState('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const distillQuery = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\b(the|and|of|for|in|to|a|our|we|is|are|that|this|on|at|with|by|as|it|be|from|an|will|can|may|must|should)\b/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 4)
      .join(',');
  };

  const fetchStockImage = (title: string, bullets: string[]): string => {
    const content = `${title} ${bullets.slice(0, 2).join(' ')}`;
    const distilled = distillQuery(content);
    return `https://source.unsplash.com/800x800/?${distilled},corporate,business`;
  };

  const generateOutline = async (prompt: string): Promise<string[]> => {
    const res = await fetch('/api/generateOutline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    return data.slides || [];
  };

  const generateSlideContent = async (title: string): Promise<Omit<Slide, 'image'>> => {
    try {
      const res = await fetch('/api/generateSlideContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      const text = await res.text();
      const isJSON = res.headers.get('content-type')?.includes('application/json');
      const data = isJSON ? JSON.parse(text) : { bullets: [], imagePrompt: '' };

      return {
        title,
        bullets: data.bullets || [],
        imagePrompt: data.imagePrompt || '',
      };
    } catch (err) {
      console.error('[generateSlideContent] error:', err);
      return { title, bullets: [], imagePrompt: '' };
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
        const image = fetchStockImage(title, content.bullets);
        const slide: Slide = { ...content, image };
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

  const slide = slides[current];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const theme = darkMode
    ? 'bg-black text-lime-400 font-mono'
    : 'bg-[#f2f2f7] text-gray-800';

  const cardTheme = darkMode
    ? 'bg-[#111] border-lime-600 shadow-[0_0_8px_#0f0] text-lime-300'
    : 'bg-white border-gray-200 shadow-xl text-black';

  const buttonTheme = darkMode
    ? 'bg-lime-700 text-black hover:bg-lime-500'
    : 'bg-black text-white hover:bg-gray-800';

  return (
    <main className={`min-h-screen flex items-center justify-center p-8 ${theme}`}>
      <style jsx global>{`
        ::selection {
          background: ${darkMode ? '#39ff14' : '#000'};
          color: ${darkMode ? '#000' : '#fff'};
        }
      `}</style>

      <div className="absolute top-4 right-4">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`text-sm px-3 py-1 rounded ${buttonTheme}`}
        >
          {darkMode ? '🧿 Light Mode' : '🕳️ Dark Mode'}
        </button>
      </div>

      {slides.length === 0 ? (
        <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-4">
          <h1 className={`text-2xl font-semibold ${darkMode ? 'text-lime-400' : 'text-gray-800'}`}>
            Generate a Slide Deck
          </h1>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. AI startup pitch for logistics"
            className={`w-full p-4 rounded-md border ${
              darkMode ? 'bg-[#111] border-lime-500 text-lime-300' : 'border-gray-300 text-black'
            } focus:outline-none focus:ring-2 focus:ring-blue-400`}
            rows={4}
          />
          <button
            type="submit"
            disabled={generating}
            className={`px-6 py-2 rounded disabled:opacity-50 ${buttonTheme}`}
          >
            {generating ? 'Generating…' : 'Generate Deck'}
          </button>
        </form>
      ) : (
        <div className={`w-full max-w-5xl h-[75vh] rounded-2xl p-10 flex flex-col border ${cardTheme}`}>
          <div className="flex-1 flex">
            {/* Slide content */}
            <div className="flex-1 flex flex-col pr-8">
              <h2 className="text-3xl font-bold mb-4 border-b pb-2 border-current">{slide?.title}</h2>
              <ul className="list-disc pl-6 space-y-2 text-lg">
                {slide?.bullets.map((point, i) => (
                  <li key={i} className="leading-relaxed tracking-wide">
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Image pane */}
            <div className="w-[40%] h-full overflow-hidden rounded-xl border border-current bg-gray-900 flex items-center justify-center">
              <img
                src={slide?.image}
                alt="Slide visual"
                className="object-contain max-h-full"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>

          {/* Nav */}
          <div className="flex justify-between items-center mt-6">
            <button
              disabled={current === 0}
              onClick={() => setCurrent((i) => i - 1)}
              className="text-sm px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              ◀ Previous
            </button>
            <div className="text-sm opacity-60">
              Slide {current + 1} of {slides.length}
            </div>
            <button
              disabled={current === slides.length - 1}
              onClick={() => setCurrent((i) => i + 1)}
              className="text-sm px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Next ▶
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

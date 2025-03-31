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

  const getEmojiForSlide = (title: string): string => {
    const keyword = title.toLowerCase();
    if (keyword.includes('team')) return '👥';
    if (keyword.includes('problem')) return '❗';
    if (keyword.includes('solution')) return '💡';
    if (keyword.includes('product')) return '📦';
    if (keyword.includes('market')) return '📊';
    if (keyword.includes('vision')) return '🔭';
    if (keyword.includes('finance') || keyword.includes('money')) return '💰';
    if (keyword.includes('goal') || keyword.includes('objective')) return '🎯';
    if (keyword.includes('timeline') || keyword.includes('schedule')) return '🗓️';
    if (keyword.includes('improvement') || keyword.includes('growth')) return '📈';
    return '🌀';
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

  const fetchStockImage = (query: string): string => {
    const safeQuery = encodeURIComponent(query.split(' ').slice(0, 4).join(' '));
    return `https://source.unsplash.com/800x800/?${safeQuery},corporate,business`;
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
        const image = fetchStockImage(content.imagePrompt || title);
        const slide: Slide = { ...content, image };
        slideData.push(slide);
        setSlides([...slideData]);
        await new Promise((res) => setTimeout(res, 300)); // throttle
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f2f2f7] p-8">
      {slides.length === 0 ? (
        <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-4">
          <h1 className="text-2xl font-semibold text-gray-800">Generate a Slide Deck</h1>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. AI startup pitch for logistics"
            className="w-full p-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows={4}
          />
          <button
            type="submit"
            disabled={generating}
            className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {generating ? 'Generating…' : 'Generate Deck'}
          </button>
        </form>
      ) : (
        <div className="w-full max-w-5xl h-[75vh] bg-white rounded-2xl shadow-xl p-10 flex flex-col">
          <div className="flex-1 flex">
            {/* Slide content */}
            <div className="flex-1 flex flex-col pr-8">
              <h2 className="text-3xl font-bold mb-4 border-b pb-2">{slide?.title}</h2>
              <ul className="list-disc pl-6 space-y-2 text-lg">
                {slide?.bullets.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>

            {/* Image pane with emoji placeholder */}
            <div className="w-[40%] h-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-center relative">
              <div className="absolute text-6xl animate-pulse select-none pointer-events-none">
                {getEmojiForSlide(slide?.title || '')}
              </div>
              <img
                src={slide?.image}
                alt="Slide visual"
                className="object-contain max-h-full opacity-0 transition-opacity duration-500"
                onLoad={(e) => {
                  e.currentTarget.classList.remove('opacity-0');
                }}
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
            <div className="text-sm text-gray-500">
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

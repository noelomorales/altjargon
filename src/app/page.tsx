/* Glitch mode enhancements
   - Glitch text effect in dark theme
   - Emoji arrows in nav buttons
*/

'use client';

import { useState } from 'react';

interface Slide {
  title: string;
  bullets: string[];
  svg: string;
  notes: string;
  svgPrompt?: string;
  caption?: string;
  author?: string;
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

  const glitch = theme === 'dark' ? 'animate-[glitch_1s_infinite] tracking-wide' : '';
  const glitchStyle = theme === 'dark' ? 'text-lime-300 drop-shadow-[0_0_2px_lime]' : '';

  const handleSubmit = async () => {
    // placeholder
  };

  const slide = slides[current];
  const bg = theme === 'dark' ? 'bg-black text-lime-300' : 'bg-[#f2f2f7] text-gray-800';
  const card = theme === 'dark' ? 'bg-[#111] border border-lime-500 shadow-[0_0_20px_#0f0]' : 'bg-white border border-gray-200';
  const button = theme === 'dark' ? 'bg-[#39ff14] text-black hover:bg-[#53ff5c]' : 'bg-black text-white hover:bg-gray-800';

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
      `}</style>

      <div className="absolute top-4 right-4 flex gap-2">
        <button onClick={() => setTheme(theme === 'clean' ? 'dark' : 'clean')} className={`px-3 py-1 text-sm rounded ${button}`}>
          {theme === 'dark' ? '☀ Clean Mode' : '🧿 Glitch Mode'}
        </button>
      </div>

      {/* Top nav */}
      {slides.length > 0 && (
        <div className="flex justify-between items-center mb-4 w-full max-w-[90rem]">
          <button disabled={current === 0} onClick={() => setCurrent(i => i - 1)} className="text-base px-4 py-1 bg-gray-200 rounded disabled:opacity-50">⬅️ Previous</button>
          <div className="text-base opacity-60">Slide {current + 1} of {slides.length}</div>
          <button disabled={current === slides.length - 1} onClick={() => setCurrent(i => i + 1)} className="text-base px-4 py-1 bg-gray-200 rounded disabled:opacity-50">Next ➡️</button>
        </div>
      )}

      {slides.length > 0 && slide && (
        <div className={`w-full max-w-[90rem] aspect-[16/9] rounded-2xl p-10 flex flex-col ${card}`}>
          <div className="flex-1 flex gap-8">
            <div className="flex-1 flex flex-col">
              <h2 className={`text-4xl font-bold mb-6 border-b pb-3 border-current leading-tight tracking-tight ${glitch}`}>{slide.title}</h2>
              <ul className={`list-disc pl-6 space-y-3 text-xl ${glitchStyle}`}>
                {slide.bullets?.slice(0, visibleBullets[current] || slide.bullets.length).map((pt, i) => <li key={i}>{pt}</li>)}
              </ul>
            </div>
            <div className={`w-[40%] h-full overflow-hidden rounded-xl border border-current flex flex-col items-center justify-center p-4 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
              {current > 0 && slide.svg && <div dangerouslySetInnerHTML={{ __html: slide.svg }} />}
              {current > 0 && slide.caption && (
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

      {/* Bottom nav */}
      {slides.length > 0 && (
        <div className="flex justify-between items-center mt-6 w-full max-w-[90rem]">
          <button disabled={current === 0} onClick={() => setCurrent(i => i - 1)} className="text-base px-4 py-1 bg-gray-200 rounded disabled:opacity-50">⬅️ Previous</button>
          <div className="text-base opacity-60">Slide {current + 1} of {slides.length}</div>
          <button disabled={current === slides.length - 1} onClick={() => setCurrent(i => i + 1)} className="text-base px-4 py-1 bg-gray-200 rounded disabled:opacity-50">Next ➡️</button>
        </div>
      )}
    </main>
  );
}

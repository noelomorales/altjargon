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

  // ... rest of the file remains unchanged
}

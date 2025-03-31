/* Updated page.tsx
   - SVG generation prompt displayed as caption below image
*/

'use client';

import { useState, useEffect } from 'react';

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

  const generateSvg = async (title: string, bullets: string[], attempt = 1): Promise<{ svg: string; prompt: string }> => {
    try {
      const res = await fetch('/api/generateSVG', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, bullets, theme }),
      });
      const { id, prompt } = await res.json();
      if (!id) throw new Error('No SVG ID returned');
      for (let i = 0; i < 10; i++) {
        await new Promise((res) => setTimeout(res, 2000));
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

  // inside handleSubmit...
  // replace:
  // const svg = await generateSvg(title, filtered);
  // with:
  // const { svg, prompt: svgPrompt } = await generateSvg(title, filtered);
  // const slide: Slide = { title, bullets: filtered, svg, notes, svgPrompt };

  // inside JSX render block after SVG
  // insert this below the image div:
  // <div className="text-xs text-gray-400 mt-2 italic whitespace-pre-wrap">{slide?.svgPrompt}</div>
}

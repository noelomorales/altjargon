'use client';

import { useState } from 'react';

export default function Home() {
  const [title, setTitle] = useState('');
  const [bullets, setBullets] = useState<string[]>([]);
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);

  async function generateImage(prompt: string): Promise<string | null> {
    try {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1024x1024',
          response_format: 'url',
        }),
      });

      const data = await res.json();
      return data?.data?.[0]?.url || null;
    } catch (err) {
      console.error('Image generation failed:', err);
      return null;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/generateSlideContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      const data = await res.json();
      setBullets(data.bullets);

      const imageUrl = await generateImage(data.imagePrompt);
      setImage(imageUrl || '');
    } catch (err) {
      alert('Failed to fetch slide content');
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f2f2f7] p-8">
      <div className="w-full max-w-5xl h-[75vh] bg-white rounded-2xl shadow-xl p-10 flex">
        <div className="flex-1 flex flex-col pr-8">
          <form onSubmit={handleSubmit}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter slide title..."
              className="text-4xl font-bold mb-6 w-full border-b border-gray-300 focus:outline-none focus:border-blue-400"
            />
          </form>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : (
            {Array.isArray(bullets) && bullets.length > 0 && (
  <ul className="list-disc pl-6 space-y-2 text-lg">
    {bullets.map((point, i) => (
      <li key={i}>{point}</li>
    ))}
  </ul>
)}
          )}
        </div>
        <div className="w-[40%] h-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-center">
          {image && <img src={image} alt="Slide visual" className="object-contain max-h-full" />}
        </div>
      </div>
    </main>
  );
}

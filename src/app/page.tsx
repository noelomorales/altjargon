'use client';

import { useState } from 'react';

export default function Home() {
  const [title, setTitle] = useState('');
  const [bullets, setBullets] = useState<string[]>([]);
  const [image, setImage] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  async function generateImage(prompt: string): Promise<string | null> {
    try {
      const res = await fetch('/api/generateImage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (!data.image) throw new Error('Image generation failed');
      return data.image;
    } catch (err) {
      console.error('Image generation failed:', err);
      setImageError(true);
      return null;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setImage('');
    setBullets([]);
    setImageError(false);

    try {
      const res = await fetch('/api/generateSlideContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      const data = await res.json();
      setBullets(data.bullets || []);
      setImagePrompt(data.imagePrompt || '');

      const imageUrl = await generateImage(data.imagePrompt);
      setImage(imageUrl || '');
    } catch (err) {
      alert('Failed to fetch slide content');
      console.error(err);
    }

    setLoading(false);
  };

  const handleRetryImage = async () => {
    setImageError(false);
    setImage('');
    const newUrl = await generateImage(imagePrompt);
    setImage(newUrl || '');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f2f2f7] p-8">
      <div className="w-full max-w-5xl h-[75vh] bg-white rounded-2xl shadow-xl p-10 flex">
        {/* LEFT PANEL */}
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
            <div className="text-gray-500 text-sm flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
                ></path>
              </svg>
              Generating slide...
            </div>
          ) : (
            bullets.length > 0 && (
              <ul className="list-disc pl-6 space-y-2 text-lg">
                {bullets.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            )
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="w-[40%] h-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-center">
          {loading ? (
            <div className="text-gray-400 animate-pulse">Generating image...</div>
          ) : imageError ? (
            <div className="text-center">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Black_Hole_-_Messier_87.jpg/1024px-Black_Hole_-_Messier_87.jpg"
                alt="Fallback visual"
                className="object-contain max-h-full mb-2"
              />
              <button
                onClick={handleRetryImage}
                className="text-xs px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                Retry image
              </button>
            </div>
          ) : (
            image && (
              <img
                src={image}
                alt="Slide visual"
                className="object-contain max-h-full"
              />
            )
          )}
        </div>
      </div>
    </main>
  );
}
